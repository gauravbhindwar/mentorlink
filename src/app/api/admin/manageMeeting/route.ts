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
        const page = parseInt(searchParams.get('page') || '0');
        const limit = parseInt(searchParams.get('limit') || '5');

        // Validation and base pipeline setup
        const matchStage: mongoose.FilterQuery<mongoose.Document> = {
            start_year: { $lte: parseInt(year!) },
            end_year: { $gte: parseInt(year!) }
        };

        const aggregationPipeline: PipelineStage[] = [
            { $match: matchStage },
            { $unwind: '$sessions' },
            { 
                $match: {
                    'sessions.name': session?.trim()
                }
            },
            { $unwind: '$sessions.semesters' },
            ...(semester ? [{
                $match: {
                    'sessions.semesters.semester_number': parseInt(semester!)
                }
            }] : []),
            { $unwind: '$sessions.semesters.sections' },
            ...(section ? [{
                $match: {
                    'sessions.semesters.sections.name': section.toUpperCase()
                }
            }] : []),
            { $unwind: '$sessions.semesters.sections.meetings' },
            {
                $group: {
                    _id: {
                        mentorMUJid: '$sessions.semesters.sections.meetings.mentorMUJid',
                        meeting_id: '$sessions.semesters.sections.meetings.meeting_id'
                    },
                    meetingData: { $first: '$sessions.semesters.sections.meetings' }
                }
            },
            {
                $group: {
                    _id: '$_id.mentorMUJid',
                    meetingCount: { $sum: 1 },
                    uniqueMeetings: { 
                        $addToSet: {
                            meeting_id: '$_id.meeting_id',
                            date: '$meetingData.meeting_date'
                        }
                    }
                }
            },
            {
                $sort: { _id: 1 }
            }
        ];

        // Facet pipeline to get both total count and paginated results in one query
        const facetPipeline = [
            ...aggregationPipeline,
            {
                $facet: {
                    metadata: [{ $count: "total" }],
                    data: [
                        { $skip: page * limit },
                        { $limit: limit }
                    ]
                }
            }
        ];

        interface AggregationResult {
            _id: string;
            meetingCount: number;
            uniqueMeetings: { meeting_id: string; date: Date }[];
        }

        const [result] = await AcademicSession.aggregate(facetPipeline);
        
        const total = result.metadata[0]?.total || 0;
        const mentorIds = result.data.map((m: AggregationResult) => m._id).filter(Boolean);

        // If no meetings found, return empty result with pagination
        if (mentorIds.length === 0) {
            return NextResponse.json({
                meetings: [],
                total: 0,
                page,
                limit
            });
        }

        // Fetch unique mentor details
        const mentors = await Mentor.find({
            MUJid: { $in: mentorIds }
        }).select('MUJid name email phone_number').lean();

        // Combine mentor details with unique meeting counts
        const mentorMeetings = mentors.map(mentor => {
            const meetingInfo = result.data.find((m: AggregationResult) => m._id === mentor.MUJid);
            return {
                MUJid: mentor.MUJid,
                mentorName: mentor.name,
                mentorEmail: mentor.email,
                mentorPhone: mentor.phone_number,
                meetingCount: meetingInfo?.meetingCount || 0,
                meetings: meetingInfo?.uniqueMeetings || []
            };
        });

        return NextResponse.json({
            meetings: mentorMeetings,
            total,
            page,
            limit
        });

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
