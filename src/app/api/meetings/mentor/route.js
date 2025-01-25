import { NextResponse } from 'next/server';
import { connect } from '../../../../lib/dbConfig';
import { Meeting } from '../../../../lib/db/meetingSchema';

export async function GET(request) {
    try {
        await connect();
        const { searchParams } = new URL(request.url);
        const year = searchParams.get('year');
        const session = searchParams.get('session');
        const semester = searchParams.get('semester');
        const mentorMUJid = searchParams.get('mentorMUJid');

        if (!year || !session || !semester || !mentorMUJid) {
            return NextResponse.json(
                { error: 'Missing required parameters' },
                { status: 400 }
            );
        }

        const meetings = await Meeting.getMeetorMeetings(
            mentorMUJid,
            year,
            session,
            parseInt(semester)
        );

        return NextResponse.json({
            meetings,
            total: meetings.length,
            success: true
        });

    } catch (error) {
        console.error('Database error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch meetings', success: false },
            { status: 500 }
        );
    }
}