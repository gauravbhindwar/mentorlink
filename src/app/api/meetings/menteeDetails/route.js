import { NextResponse } from 'next/server';
import { connect } from '../../../../lib/dbConfig';
import { Meeting } from '../../../../lib/db/meetingSchema';
import { Mentee } from '../../../../lib/db/menteeSchema';

export async function GET(request) {
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

        const meeting = await Meeting.findOne({
            mentorMUJid: mentorId,
            'academicDetails.academicYear': `${parseInt(year) - 1}-${year}`,
            'academicDetails.academicSession': session,
            'meetings.meeting_id': meetingId
        });

        if (!meeting) {
            return NextResponse.json({
                success: false,
                message: 'No meeting found'
            });
        }

        const targetMeeting = meeting.meetings.find(m => m.meeting_id === meetingId);
        
        if (!targetMeeting) {
            return NextResponse.json({
                success: false,
                message: 'Meeting not found'
            });
        }

        // Only get details for present mentees
        const presentMenteesDetails = await Promise.all(
            (targetMeeting.present_mentees || []).map(async (menteeId) => {
                try {
                    const mentee = await Mentee.findOne({ MUJid: menteeId })
                        .select('name MUJid yearOfRegistration')  // Add yearOfRegistration
                        .lean();

                    return {
                        MUJid: mentee?.MUJid || menteeId,
                        name: mentee?.name || 'Unknown',
                        registrationNumber: mentee?.MUJid || 'N/A', // Include registration number
                        yearOfRegistration: mentee?.yearOfRegistration || 'N/A',
                        isPresent: true
                    };
                } catch (err) {
                    console.error(`Error fetching mentee ${menteeId}:`, err);
                    return {
                        MUJid: menteeId,
                        name: 'Unknown',
                        registrationNumber: menteeId,
                        yearOfRegistration: 'N/A',
                        isPresent: true
                    };
                }
            })
        );

        return NextResponse.json({
            success: true,
            present_mentees: presentMenteesDetails,
            meeting_notes: targetMeeting.meeting_notes || {},
            attendance: {
                total: targetMeeting.mentee_ids.length,
                present: targetMeeting.present_mentees?.length || 0,
                percentage: Math.round((targetMeeting.present_mentees?.length || 0) / targetMeeting.mentee_ids.length * 100)
            }
        });

    } catch (error) {
        console.error('Database error:', error);
        return NextResponse.json({
            success: false,
            error: 'Failed to fetch meeting details'
        }, { status: 500 });
    }
}