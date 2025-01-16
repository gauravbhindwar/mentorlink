import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { AcademicSession } from '../../../../lib/dbModels';
import { Mentor } from '../../../../lib/db/mentorSchema';
import { connect } from '../../../../lib/dbConfig';

export async function GET(request: Request) {
    try {
        await connect();
        const { searchParams } = new URL(request.url);
        const year = searchParams.get('year');
        const session = searchParams.get('session');
        const semester = searchParams.get('semester');
        const section = searchParams.get('section');

        if (!year || !session || !semester) {
            return NextResponse.json(
                { error: 'Missing required parameters' },
                { status: 400 }
            );
        }

        await mongoose.connect(process.env.MONGODB_URI as string);

        // Base match conditions
        const matchStage: mongoose.FilterQuery<mongoose.Document> = {
            'sessions.name': session,
            'sessions.semesters.semester_number': parseInt(semester)
        };

        // Add section filter if provided
        if (section) {
            matchStage['sessions.semesters.sections.name'] = section.toUpperCase();
        }

        // First get mentor IDs with meeting counts
        const mentorMeetingCounts = await AcademicSession.aggregate([
            {
                $match: {
                    'start_year': parseInt(year)
                }
            },
            { $unwind: '$sessions' },
            { $unwind: '$sessions.semesters' },
            { $unwind: '$sessions.semesters.sections' },
            { $unwind: '$sessions.semesters.sections.meetings' },
            {
                $match: matchStage
            },
            {
                $group: {
                    _id: '$sessions.semesters.sections.meetings.mentor_id',
                    meetingCount: { $sum: 1 }
                }
            }
        ]);

        // Get unique mentor IDs
        const mentorIds = mentorMeetingCounts.map(m => m._id);

        // Fetch mentor details from Mentor schema
        const mentors = await Mentor.find({
            MUJid: { $in: mentorIds }
        }).select('MUJid name email phone_number');

        // Combine mentor details with meeting counts
        const mentorMeetings = mentors.map(mentor => {
            const meetingInfo = mentorMeetingCounts.find(m => m._id === mentor.MUJid);
            return {
                MUJid: mentor.MUJid,
                mentorName: mentor.name,
                mentorEmail: mentor.email,
                mentorPhone: mentor.phone_number,
                meetingCount: meetingInfo?.meetingCount || 0
            };
        });

        if (mentorMeetings.length === 0) {
            return NextResponse.json(
                { message: 'No meetings found for the selected criteria' },
                { status: 404 }
            );
        }

        return NextResponse.json(mentorMeetings);

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
