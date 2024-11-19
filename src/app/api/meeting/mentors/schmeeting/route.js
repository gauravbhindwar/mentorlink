import { connect } from "../../../../../lib/dbConfig";
import { AcademicSession } from "../../../../../lib/db/academicSessionSchema";
import { Mentor } from "../../../../../lib/db/mentorSchema";
// import { Mentee } from "../../../../../lib/db/menteeSchema";
import { NextResponse } from "next/server";

export async function GET(request) {
    await connect();

    const { searchParams } = new URL(request.url);
    const year = searchParams.get('year');
    const session = searchParams.get('session');
    const semester = searchParams.get('semester');
    const mentor_id = searchParams.get('mentor_id');
    const section = searchParams.get('section');

    
    // const { year, session, semester, mentor_id, section } = request.query;
    

    if (!year || !session || !semester || !mentor_id || !section) {
        return NextResponse.json({ error: 'Year, session, and semester are required' }, { status: 400 });
    }

    try {
        const [startYear, endYear] = year.split('-').map(Number);
        console.log('Parsing params:', { startYear, endYear, session, semester, section, mentor_id });

        // First find academic session
        const academicSession = await AcademicSession.findOne({
            start_year: startYear,
        }).select({
            'sessions': {
                $elemMatch: {
                    'name': session,
                    'semesters': {
                        $elemMatch: {
                            'semester_number': parseInt(semester),
                            'sections': {
                                $elemMatch: {
                                    'name': section,
                                    'meetings.mentor_id': mentor_id
                                }
                            }
                        }
                    }
                }
            }
        });

        if (!academicSession || !academicSession.sessions || !academicSession.sessions.length) {
            // Check if mentor exists
            const mentorExists = await Mentor.findOne({ MUJid: mentor_id });
            
            if (!mentorExists) {
                return NextResponse.json({ 
                    error: 'Mentor not found',
                    meetings: [],
                    totalMeetings: 0
                }, { status: 404 });
            }
            
            return NextResponse.json({ 
                meetings: [],
                totalMeetings: 0,
            }, { status: 200 });
        }

        // Get the relevant sessions data
        const targetSession = academicSession.sessions[0];
        const targetSemester = targetSession.semesters?.find(s => s.semester_number === parseInt(semester));
        const targetSection = targetSemester?.sections?.find(s => s.name === section);
        const meetings = targetSection?.meetings?.filter(m => m.mentor_id === mentor_id) || [];

        return NextResponse.json({ 
            meetings,
            totalMeetings: meetings.length 
        }, { status: 200 });
    } catch (error) {
        console.error('Error fetching mentor meetings:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(request) {
    await connect();

    try {
        const body = await request.json();
        const { mentor_id,
            meeting_id,
            meeting_topic,
            date,
            time,
            semester,
            section,
            session,
            year} = body;

        if (!mentor_id || !meeting_id || !meeting_topic || !date || !time || !semester || !section || !session || !year) {
            return NextResponse.json({ error: 'All fields are required' }, { status: 400 });
        }

        const mentorExists = await Mentor.findOne({ MUJid: mentor_id });
            
        if (!mentorExists) {
            return NextResponse.json({ 
                error: 'Mentor not found',
                meetings: [],
                totalMeetings: 0
            }, { status: 404 });
        }

        const [startYear, endYear] = year.split('-').map(Number);

        const academicSession = await AcademicSession.findOne({
            start_year: startYear,
            end_year: endYear
        }).select({
            'sessions': {
                $elemMatch: {
                    'name': session,
                    'semesters': {
                        $elemMatch: {
                            'semester_number': parseInt(semester),
                            'sections': {
                                $elemMatch: {
                                    'name': section,
                                }
                            }
                        }
                    }
                }
            }
        });

        if (!academicSession || !academicSession.sessions || !academicSession.sessions.length) {
            return NextResponse.json({ error: 'Academic session not found' }, { status: 404 });
        }

        const targetSession = academicSession.sessions[0];
        const targetSemester = targetSession.semesters?.find(s => s.semester_number === parseInt(semester));
        const targetSection = targetSemester?.sections?.find(s => s.name === section);

        if (!targetSection) {
            return NextResponse.json({ error: 'Section not found' }, { status: 404 });
        }

        

        const newMeeting = {
            meeting_id,
            meeting_topic,
            date,
            time,
            semester,
            section,
            session,
            year,
            mentor_id
        };

        // Add the meeting to the section
        targetSection.meetings.push(newMeeting);

        await AcademicSession.findOneAndUpdate(
            { start_year: startYear },
            { $set: { 'sessions.$[session].semesters.$[semester].sections.$[section]': targetSection } },
            { arrayFilters: [{ 'session.name': session }, { 'semester.semester_number': parseInt(semester) }, { 'section.name': section }] }
        );

        console.log('Meeting added successfully');

        return NextResponse.json({ message: 'Meeting added successfully' }, { status: 201 });
    } catch (error) {
        console.error('Error adding meeting:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}