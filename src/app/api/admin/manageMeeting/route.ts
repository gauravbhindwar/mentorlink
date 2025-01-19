import { NextResponse } from 'next/server';
import mongoose, { PipelineStage } from 'mongoose';
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

        // Modified matching conditions
        const matchStage: mongoose.FilterQuery<mongoose.Document> = {
            start_year: { $lte: parseInt(year) },
            end_year: { $gte: parseInt(year) }
        };

        const aggregationPipeline: PipelineStage[] = [
            { $match: matchStage },
            { $unwind: '$sessions' },
            { 
                $match: {
                    'sessions.name': {
                        $regex: new RegExp(session.trim(), 'i')  // Case-insensitive match
                    }
                }
            },
            { $unwind: '$sessions.semesters' },
            {
                $match: {
                    'sessions.semesters.semester_number': parseInt(semester)
                }
            },
            { $unwind: '$sessions.semesters.sections' }
        ];

        // Add section filter if provided
        if (section) {
            aggregationPipeline.push({
                $match: {
                    'sessions.semesters.sections.name': section.toUpperCase()
                }
            });
        }

        // Add remaining pipeline stages
        aggregationPipeline.push(
            { $unwind: '$sessions.semesters.sections.meetings' },
            {
                $group: {
                    _id: '$sessions.semesters.sections.meetings.mentorMUJid',
                    meetingCount: { $sum: 1 },
                    lastMeeting: { $last: '$sessions.semesters.sections.meetings' }
                }
            } as PipelineStage,
            {
                $match: {
                    _id: { $ne: null, $exists: true }
                }
            }
        );

        // Execute aggregation with improved pipeline
        const mentorMeetingCounts = await AcademicSession.aggregate(aggregationPipeline);

        // Debug logging
        console.log('Query parameters:', {
            year,
            session,
            semester,
            section,
            matchStage,
            resultCount: mentorMeetingCounts.length
        });

        // Add more detailed debug logging
        console.log('Detailed query params:', {
            yearQuery: {
                $or: [
                    { start_year: parseInt(year) },
                    { end_year: parseInt(year) }
                ]
            },
            session: session.trim(),
            semester: parseInt(semester),
            section: section?.toUpperCase()
        });

        // Add debug logging
        console.log('Aggregation result:', JSON.stringify(mentorMeetingCounts, null, 2));

        // Debug logging
        console.log('Aggregation query:', JSON.stringify({
            year: parseInt(year),
            session,
            semester: parseInt(semester),
            section: section?.toUpperCase()
        }, null, 2));

        // Log for debugging
        console.log('Query params:', { year, session, semester, section });
        console.log('Found meetings:', mentorMeetingCounts.length);

        // Get unique mentor IDs
        const mentorIds = mentorMeetingCounts.map(m => m._id).filter(Boolean);

        if (mentorIds.length === 0) {
            return NextResponse.json(
                { message: 'No meetings found for the selected criteria' },
                { status: 404 }
            );
        }

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
            { 
                error: 'Failed to fetch mentor meetings',
                details: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        );
    } finally {
        await mongoose.disconnect();
    }
}
