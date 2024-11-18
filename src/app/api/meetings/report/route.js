import { connect } from "../../../../lib/dbConfig";
import { AcademicSession } from "../../../../lib/db/academicSessionSchema";
import { NextResponse } from "next/server";

export async function GET(request) {
    await connect();

    const { searchParams } = new URL(request.url);
    const year = searchParams.get('year');
    const session = searchParams.get('session');
    const semester = searchParams.get('semester');
    const section = searchParams.get('section');
    const mentorMUJid = searchParams.get('mentorMUJid');

    if (!year || !session || !semester || !section || !mentorMUJid) {
        return NextResponse.json({ error: 'All parameters are required' }, { status: 400 });
    }

    try {
        const academicSession = await AcademicSession.findOne({
            start_year: parseInt(year),
            'sessions.name': session
        });

        if (!academicSession) {
            return NextResponse.json({ error: 'No academic session found' }, { status: 404 });
        }

        const targetSession = academicSession.sessions.find(
            s => s.name === session
        );

        const targetSemester = targetSession.semesters.find(
            s => s.semester_number === parseInt(semester)
        );

        if (!targetSemester) {
            return NextResponse.json({ error: 'Semester not found' }, { status: 404 });
        }

        const targetSection = targetSemester.sections.find(
            s => s.name === section.toUpperCase()
        );

        if (!targetSection) {
            return NextResponse.json({ error: 'Section not found' }, { status: 404 });
        }

        // Filter meetings by mentor MUJid
        const mentorMeetings = targetSection.meetings.filter(
            m => m.mentor_id === mentorMUJid.toUpperCase()
        );

        return NextResponse.json(mentorMeetings);
    } catch (error) {
        console.error('Error fetching meeting report:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}