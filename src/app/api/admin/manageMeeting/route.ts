import { NextResponse } from 'next/server';
import { AcademicSession } from '../../../../lib/dbModels';
import { connect } from '../../../../lib/dbConfig';

export async function GET(request: Request) {
    try {
        await connect();
        const { searchParams } = new URL(request.url);
        const year = searchParams.get('year');
        const session = searchParams.get('session');
        const semester = searchParams.get('semester');
        const section = searchParams.get('section');

        if (!year || !session) {
            return NextResponse.json(
                { error: 'Year and session are required' },
                { status: 400 }
            );
        }

        const academicSession = await AcademicSession.findOne({
            start_year: parseInt(year)
        });

        if (!academicSession) {
            return NextResponse.json(
                { error: 'Academic session not found' },
                { status: 404 }
            );
        }

        const mentorMeetings = await academicSession.getMentorsWithMeetings({
            session,
            semester,
            section
        });

        return NextResponse.json(mentorMeetings);

    } catch (error) {
        console.error('Database error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch mentor meetings' },
            { status: 500 }
        );
    }
}
