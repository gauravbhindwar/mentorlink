import { connect } from "../../../../../lib/dbConfig";
import { AcademicSession } from "../../../../../lib/db/academicSessionSchema";
import { Mentor } from "../../../../../lib/db/mentorSchema";
import { NextResponse } from "next/server";

export async function GET(request) {
    await connect();

    const { searchParams } = new URL(request.url);
    const year = searchParams.get("year");
    const session = searchParams.get("session");
    const semester = searchParams.get("semester");
    const mentor_id = searchParams.get("mentor_id");
    const section = searchParams.get("section");

    if (!year || !session || !semester || !mentor_id || !section) {
        return NextResponse.json(
            { error: "All parameters are required" },
            { status: 400 }
        );
    }

    try {
        const [startYear] = year.split("-").map(Number);

        // First check if mentor exists in the correct academic year and session
        const mentorExists = await Mentor.findOne({
            'academicRecords': {
                $elemMatch: {
                    'academicYear': year,
                    'sessions': {
                        $elemMatch: {
                            'sessionName': session.split(' ')[0],
                            'mentorInfo.MUJid': mentor_id
                        }
                    }
                }
            }
        });

        if (!mentorExists) {
            return NextResponse.json(
                {
                    error: "Mentor not found for this academic year and session",
                    meetings: [],
                    totalMeetings: 0,
                },
                { status: 404 }
            );
        }

        // Find academic session with meetings
        const academicSession = await AcademicSession.findOne({
            start_year: startYear,
            'sessions.name': session,
            'sessions.semesters.semester_number': parseInt(semester),
            'sessions.semesters.sections.name': section.toUpperCase()
        });

        if (!academicSession) {
            return NextResponse.json({
                meetings: [],
                totalMeetings: 0,
            });
        }

        const targetSession = academicSession.sessions.find(s => s.name === session);
        const targetSemester = targetSession?.semesters?.find(
            s => s.semester_number === parseInt(semester)
        );
        const targetSection = targetSemester?.sections?.find(
            s => s.name === section.toUpperCase()
        );

        const meetings = targetSection?.meetings?.filter(m => m.mentor_id === mentor_id) || [];

        return NextResponse.json({
            meetings,
            totalMeetings: meetings.length,
        });

    } catch (error) {
        console.error("Error fetching mentor meetings:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(request) {
    await connect();

    try {
        const body = await request.json();
        const {
            mentor_id,
            meeting_id,
            TopicOfDiscussion,
            meeting_date,
            meeting_time,
            semester,
            section,
            session,
            year,
        } = body;

        if (!mentor_id || !meeting_id || !TopicOfDiscussion || !meeting_date || 
            !meeting_time || !semester || !section || !session || !year) {
            return NextResponse.json(
                { error: "All fields are required" },
                { status: 400 }
            );
        }

        // Verify mentor exists in the correct academic year and session
        const mentorExists = await Mentor.findOne({
            'academicRecords': {
                $elemMatch: {
                    'academicYear': year,
                    'sessions': {
                        $elemMatch: {
                            'sessionName': session.split(' ')[0],
                            'mentorInfo.MUJid': mentor_id
                        }
                    }
                }
            }
        });

        if (!mentorExists) {
            return NextResponse.json(
                { error: "Mentor not found for this academic year and session" },
                { status: 404 }
            );
        }

        const [startYear, endYear] = year.split("-").map(Number);

        // Create new meeting object according to schema
        const newMeeting = {
            meeting_id,
            mentor_id,
            mentee_ids: [], // Add mentee IDs if needed
            meeting_date: new Date(meeting_date),
            meeting_time,
            meeting_notes: {
                TopicOfDiscussion,
                TypeOfInformation: '',
                NotesToStudent: '',
                feedbackFromMentee: '',
                outcome: '',
                closureRemarks: ''
            },
            created_at: new Date(),
            updated_at: new Date()
        };

        // Update academic session with new meeting
        const result = await AcademicSession.findOneAndUpdate(
            { 
                start_year: startYear,
                'sessions.name': session,
                'sessions.semesters.semester_number': parseInt(semester),
                'sessions.semesters.sections.name': section.toUpperCase()
            },
            {
                $push: {
                    'sessions.$[sess].semesters.$[sem].sections.$[sec].meetings': newMeeting
                }
            },
            {
                arrayFilters: [
                    { 'sess.name': session },
                    { 'sem.semester_number': parseInt(semester) },
                    { 'sec.name': section.toUpperCase() }
                ],
                new: true
            }
        );

        if (!result) {
            return NextResponse.json(
                { error: "Failed to add meeting" },
                { status: 400 }
            );
        }

        return NextResponse.json(
            { message: "Meeting added successfully" },
            { status: 200 }
        );
    } catch (error) {
        console.error("Error adding meeting:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
