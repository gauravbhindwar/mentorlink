import { connect } from "../../../../lib/dbConfig";
import { AcademicSession } from "../../../../lib/db/academicSessionSchema";
import { Mentor } from "../../../../lib/db/mentorSchema";
import { Mentee } from "../../../../lib/db/menteeSchema";
import { NextResponse } from "next/server";

export async function GET(request) {
    await connect();

    const { searchParams } = new URL(request.url);
    const year = searchParams.get('year');
    const session = searchParams.get('session');
    const semester = searchParams.get('semester');

    if (!year || !session || !semester) {
        return NextResponse.json({ error: 'Year, session, and semester are required' }, { status: 400 });
    }

    try {
        const [startYear, endYear] = year.split('-').map(Number);
        console.log('Parsing params:', { startYear, endYear, session, semester });

        const academicSession = await AcademicSession.findOne({
            start_year: startYear,
            'sessions.name': session
        });

        if (!academicSession) {
            return NextResponse.json({ error: 'No meetings found for the given criteria' }, { status: 404 });
        }

        const targetSession = academicSession.sessions.find(s => s.name === session);
        const targetSemester = targetSession.semesters.find(s => s.semester_number === parseInt(semester));
        
        // Get all meetings with their sections
        const meetingsWithSections = targetSemester.sections.flatMap(section => 
            section.meetings.map(meeting => ({
                ...meeting.toObject(),
                section: section.name
            }))
        );

        // Get unique mentor IDs and mentee IDs
        const mentorMUJIds = [...new Set(meetingsWithSections.map(m => m.mentor_id))];
        const menteeIds = [...new Set(meetingsWithSections.flatMap(m => m.mentee_ids))];

        // Fetch complete mentee details with full population
        const [mentorDetails, menteeDetails] = await Promise.all([
            Mentor.find({ MUJid: { $in: mentorMUJIds } }),
            Mentee.find({ MUJid: { $in: menteeIds } }).select({
                MUJid: 1,
                name: 1,
                email: 1,
                phone: 1,
                semester: 1,
                section: 1,
                academicYear: 1,
                academicSession: 1,
                yearOfRegistration: 1,
                parents: 1
            }).exec()
        ]);

        // Create detailed mentee lookup map
        const menteeMap = new Map(menteeDetails.map(mentee => [
            mentee.MUJid,
            {
                MUJid: mentee.MUJid,
                name: mentee.name,
                email: mentee.email,
                phone: mentee.phone || 'Not provided',
                semester: mentee.semester,
                section: mentee.section,
                academicYear: mentee.academicYear,
                academicSession: mentee.academicSession,
                yearOfRegistration: mentee.yearOfRegistration,
                parents: {
                    father: mentee.parents?.father || {},
                    mother: mentee.parents?.mother || {},
                    guardian: mentee.parents?.guardian || {}
                }
            }
        ]));

        // Transform the data with complete mentee details
        const mentorMeetingsData = mentorMUJIds.map(MUJid => {
            const meetings = meetingsWithSections.filter(m => m.mentor_id === MUJid);
            const mentor = mentorDetails.find(m => m.MUJid === MUJid);
            
            return {
                MUJid: mentor?.MUJid || MUJid,
                mentorName: mentor?.name || 'Unknown',
                mentorEmail: mentor?.email || '',
                mentorPhone: mentor?.phone_number || '',
                meetingCount: meetings.length,
                totalMentees: [...new Set(meetings.flatMap(m => m.mentee_ids))].length,
                meetings: meetings.map(meeting => ({
                    date: meeting.meeting_date,
                    time: meeting.meeting_time,
                    section: meeting.section,
                    mentees: meeting.mentee_ids.map(menteeId => {
                        const menteeData = menteeMap.get(menteeId);
                        if (!menteeData) {
                            console.warn(`Mentee not found: ${menteeId}`);
                        }
                        return menteeData || {
                            MUJid: menteeId,
                            name: 'Unknown Mentee',
                            email: 'Not found in database',
                            phone: 'Not found',
                            semester: 'Unknown',
                            section: 'Unknown',
                            academicYear: 'Unknown',
                            academicSession: 'Unknown',
                            yearOfRegistration: 'Unknown'
                        };
                    }),
                    notes: meeting.meeting_notes
                }))
            };
        });

        return NextResponse.json(mentorMeetingsData);
    } catch (error) {
        console.error('Error fetching mentor meetings:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(request) {
    await connect();

    try {
        const body = await request.json();
        const { year, session, semester, section, meeting } = body;

        if (!year || !session || !semester || !meeting) {
            return NextResponse.json({ error: 'Year, session, semester, and meeting details are required' }, { status: 400 });
        }

        // Validate mentor_id format
        if (!meeting.mentor_id || !/^[A-Z0-9]+$/.test(meeting.mentor_id)) {
            return NextResponse.json({ error: 'Invalid mentor MUJid format. Must be uppercase alphanumeric only.' }, { status: 400 });
        }

        // Validate mentee_ids format
        if (!meeting.mentee_ids || !Array.isArray(meeting.mentee_ids) || 
            !meeting.mentee_ids.every(id => /^[A-Z0-9]+$/.test(id))) {
            return NextResponse.json({ error: 'Invalid mentee MUJids format. Must be uppercase alphanumeric only.' }, { status: 400 });
        }

        // Convert mentor_id and mentee_ids to uppercase
        meeting.mentor_id = meeting.mentor_id.toUpperCase();
        meeting.mentee_ids = meeting.mentee_ids.map(id => id.toUpperCase());

        const sessionYear = session.includes('JULY') ? year.split('-')[0] : year.split('-')[1];
        const endYear = session.includes('JULY') ? parseInt(sessionYear) + 1 : parseInt(sessionYear);
        console.log('Parsed sessionYear:', sessionYear);
        console.log('Parsed endYear:', endYear);

        let academicSession = await AcademicSession.findOne({ 
            start_year: parseInt(sessionYear),
            'sessions.name': session
        });

        if (!academicSession) {
            console.log('Creating new academic session');
            const isJulySession = session.includes('JULY');
            const semesterStartDate = isJulySession ? 
                new Date(`${sessionYear}-07-01`) : 
                new Date(`${sessionYear}-01-01`);
            const semesterEndDate = isJulySession ? 
                new Date(`${sessionYear}-12-31`) : 
                new Date(`${sessionYear}-06-30`);

            academicSession = new AcademicSession({
                start_year: parseInt(sessionYear),
                end_year: endYear,
                sessions: [{
                    name: session,
                    semesters: [{
                        semester_number: parseInt(semester),
                        start_date: semesterStartDate,
                        end_date: semesterEndDate,
                        sections: [{
                            name: section.toUpperCase(),
                            meetings: [meeting]
                        }]
                    }]
                }]
            });

            await academicSession.save();
            return NextResponse.json({ message: 'Meeting added successfully' }, { status: 201 });
        }

        // If academic session exists, find or create necessary nested documents
        let targetSession = academicSession.sessions.find(s => s.name === session);
        if (!targetSession) {
            targetSession = {
                name: session,
                semesters: []
            };
            academicSession.sessions.push(targetSession);
        }

        let targetSemester = targetSession.semesters.find(s => s.semester_number === parseInt(semester));
        if (!targetSemester) {
            const isJulySession = session.includes('JULY');
            targetSemester = {
                semester_number: parseInt(semester),
                start_date: isJulySession ? new Date(`${sessionYear}-07-01`) : new Date(`${sessionYear}-01-01`),
                end_date: isJulySession ? new Date(`${sessionYear}-12-31`) : new Date(`${sessionYear}-06-30`),
                sections: []
            };
            targetSession.semesters.push(targetSemester);
        }

        let targetSection = targetSemester.sections.find(s => s.name === section.toUpperCase());
        if (!targetSection) {
            targetSection = {
                name: section.toUpperCase(),
                meetings: []
            };
            targetSemester.sections.push(targetSection);
        }

        targetSection.meetings.push(meeting);
        await academicSession.save();

        return NextResponse.json({ message: 'Meeting added successfully' }, { status: 201 });
    } catch (error) {
        console.error('Error adding meeting:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}