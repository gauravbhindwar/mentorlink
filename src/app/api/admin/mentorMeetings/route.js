import { NextResponse } from 'next/server';
import { connect } from '../../../../lib/dbConfig';
import { Meeting } from '../../../../lib/db/meetingSchema';
import { Mentor } from '../../../../lib/db/mentorSchema';

export async function GET(request) {
    try {
        await connect();
        const { searchParams } = new URL(request.url);
        const mentorId = searchParams.get('mentorId');
        const year = searchParams.get('year');
        const session = searchParams.get('session');
        const semester = searchParams.get('semester');

        if (!mentorId || !year || !session || !semester) {
            return NextResponse.json(
                { error: 'Missing required parameters', success: false },
                { status: 400 }
            );
        }

        // Verify the mentor exists
        const mentor = await Mentor.findOne({ MUJid: mentorId });
        if (!mentor) {
            return NextResponse.json(
                { error: 'Mentor not found', success: false },
                { status: 404 }
            );
        }

        // Find mentor's meeting document
        const academicYear = `${parseInt(year) - 1}-${year}`; // Convert to academic year format
        const meetingDoc = await Meeting.findOne({
            mentorMUJid: mentorId,
            'academicDetails.academicYear': academicYear,
            'academicDetails.academicSession': session
        });

        if (!meetingDoc) {
            return NextResponse.json({
                meetings: [],
                success: true,
                message: 'No meetings found'
            });
        }

        // Extract meetings for the specified semester
        const semesterMeetings = meetingDoc.meetings
            .filter(meeting => meeting.semester === parseInt(semester))
            .map(meeting => ({
                meeting_id: meeting.meeting_id,
                semester: meeting.semester,
                meeting_date: meeting.meeting_date,
                meeting_time: meeting.meeting_time,
                isReportFilled: meeting.isReportFilled,
                meeting_notes: meeting.meeting_notes,
                mentee_count: meeting.mentee_ids.length,
                present_mentees: meeting.present_mentees || [],
                scheduledAT: meeting.scheduledAT
            }))
            .sort((a, b) => new Date(a.meeting_date) - new Date(b.meeting_date));

        return NextResponse.json({
            meetings: semesterMeetings,
            success: true
        });

    } catch (error) {
        console.error('Error fetching mentor meetings:', error);
        return NextResponse.json(
            { error: 'Failed to fetch mentor meetings', success: false, details: error.message },
            { status: 500 }
        );
    }
}
