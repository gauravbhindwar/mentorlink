import { NextResponse } from 'next/server';
import { connect } from '../../../../lib/dbConfig';
import { Meeting } from '../../../../lib/db/meetingSchema';

export async function GET(req) {
    try {
        await connect();
        const { searchParams } = new URL(request.url);
        const mentorId = searchParams.get('mentorId');
        const meetingId = searchParams.get('meetingId');
        const year = searchParams.get('year');
        const session = searchParams.get('session');

        if (!mentorId || !meetingId || !year || !session) {
            return NextResponse.json(
                { error: 'Missing required parameters' },
                { status: 400 }
            );
        }

        const meetingDetails = await Meeting.getMeetingWithMenteeDetails(
            mentorId,
            meetingId,
            year,
            session
        );

        if (!meetingDetails) {
            return NextResponse.json({
                success: false,
                message: 'No meeting found',
                mentee_details: [],
                meeting_notes: {}
            });
        }

        return NextResponse.json({
            success: true,
            mentee_details: meetingDetails.mentee_details || [],
            meeting_notes: meetingDetails.meeting_notes || {}
        });

    } catch (error) {
        console.error('Database error:', error);
        return NextResponse.json({
            success: false,
            error: 'Failed to fetch meeting details',
            mentee_details: [],
            meeting_notes: {}
        }, { status: 500 });
    }
}