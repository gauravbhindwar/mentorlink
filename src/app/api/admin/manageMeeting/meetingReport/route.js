import { NextResponse } from 'next/server';
import { connect } from '../../../../../lib/dbConfig';
import { Meeting } from '../../../../../lib/db/meetingSchema';

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

        const meetings = await Meeting.getMentorMeetings(
            mentorMUJid,
            year,
            session,
            parseInt(semester)
        );
        console.log("meetings", meetings);
        
        if (!meetings || meetings.length === 0) {
            return NextResponse.json(
                { error: 'No meetings found for the given parameters', success: false },
                { status: 404 }
            );
        }

        // Calculate attendance for each mentee
        const menteeAttendance = {};
        meetings.forEach(meeting => {
            const presentMentees = meeting.meetingData.present_mentees || [];
            meeting.menteeDetails.forEach(mentee => {
                if (!menteeAttendance[mentee.MUJid]) {
                    menteeAttendance[mentee.MUJid] = {
                        total: meetings.length,
                        attended: 0,
                        name: mentee.name,
                        mentorRemarks: mentee.mentorRemarks
                    };
                }
                if (presentMentees.includes(mentee.MUJid)) {
                    menteeAttendance[mentee.MUJid].attended++;
                }
            });
        });

        const processedMeetings = meetings.map(meeting => ({
            ...meeting.meetingData,
            mentorName: meeting._id.mentorName,
            menteeDetails: meeting.menteeDetails.map(mentee => ({
                ...mentee,
                meetingsAttended: menteeAttendance[mentee.MUJid]?.attended || 0,
                totalMeetings: meetings.length
            }))
        }));

        const reportData = {
            mentorMUJid,
            academicYear: year,
            academicSession: session,
            semester,
            mentorName: meetings[0]?.mentorName || 'Unknown',
            meetings: processedMeetings,
            menteeAttendance
        };
        console.log('reportData', reportData);
        console.log("Mentees:", reportData.meetings[0]?.menteeDetails || []);
        console.log("Present Mentees:", reportData.meetings[0]?.present_mentees || []);
        console.log("Meeting Notes:", reportData.meetings[0]?.meeting_notes || {});
        console.log("Meeting Remarks:", reportData.meetings[0]?.meeting_remarks || {});

        const presentMenteesWithDetails = meetings.flatMap(meeting => {
            if (!meeting.present_mentees || !meeting.menteeDetails) {
                return [];
            }
            return meeting.present_mentees.map(menteeId => {
                const mentee = meeting.menteeDetails.find(m => m.MUJid === menteeId);
                return {
                    id: menteeId,
                    name: mentee ? mentee.name : 'Unknown'
                };
            });
        });
        // console.log("Present Mentees with Details:", presentMenteesWithDetails);

        return NextResponse.json({
            reportData,
            presentMenteesWithDetails,
            menteeAttendance,
            success: true
        });

    } catch (error) {
       return NextResponse.json(
        { error: 'Failed to fetch meetings report', success: false, details: error.message },
        { status: 500 }
    );
    }
}
