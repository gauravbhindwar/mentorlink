import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { Meeting } from '../../../../lib/db/meetingSchema';
import { connect } from '../../../../lib/dbConfig';

export async function GET(request: Request) {
    try {
        await connect();
        const { searchParams } = new URL(request.url);
        const year = searchParams.get('year');
        const session = searchParams.get('session');
        const semester = searchParams.get('semester');
        const page = parseInt(searchParams.get('page') || '0');
        const limit = parseInt(searchParams.get('limit') || '5');

        const { meetings, total } = await Meeting.getMentorMeetingsData(
            year,
            session,
            semester,
            page,
            limit
        );

        return NextResponse.json({
            meetings,
            total,
            page,
            limit
        });

    } catch (error) {
        console.error('Database error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch mentor meetings' },
            { status: 500 }
        );
    } finally {
        await mongoose.disconnect();
    }
}
