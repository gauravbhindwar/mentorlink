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
        const page = searchParams.get('page');
        const limit = searchParams.get('limit');

        if (!year || !session || !semester) {
            return NextResponse.json(
                { error: 'Missing required parameters' },
                { status: 400 }
            );
        }

        const meetingsData = await Meeting.getMentorMeetingsData(
            year,
            session,
            semester,
            parseInt(page),
            parseInt(limit)
        );

        return NextResponse.json({
            meetings: meetingsData.meetings,
            total: meetingsData.total,
            success: true
        });

    } catch (error) {
        return NextResponse.json(
            { error: 'Failed to fetch meetings', success: false, details: error.message },
            { status: 500 }
        );
    }
}