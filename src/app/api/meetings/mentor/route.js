import { NextResponse } from 'next/server';
import { AcademicSession } from '../../../../lib/db/academicSessionSchema';
import { connect } from '../../../../lib/dbConfig';


export async function GET(request) {
    try {
        await connect();
        const { searchParams } = new URL(request.url);
        const year = searchParams.get('year');
        const session = searchParams.get('session');
        const semester = searchParams.get('semester');
        const section = searchParams.get('section');
        const mentorMUJid = searchParams.get('mentorMUJid');

        // Validate required parameters
        if (!year || !session || !semester || !mentorMUJid) {
            return NextResponse.json(
                { 
                    error: 'Missing required parameters',
                    details: { year, session, semester, mentorMUJid }
                },
                { status: 400 }
            );
        }

        // Build match conditions
        const matchConditions = {
            start_year: { $lte: parseInt(year) },
            end_year: { $gte: parseInt(year) },
            'sessions.name': session,
            'sessions.semesters.semester_number': parseInt(semester),
            'sessions.semesters.sections.meetings.mentorMUJid': mentorMUJid
        };

        if (section) {
            matchConditions['sessions.semesters.sections.name'] = section.toUpperCase();
        }

        // Aggregate pipeline
        const pipeline = [
            { $match: { start_year: { $lte: parseInt(year) }, end_year: { $gte: parseInt(year) } } },
            { $unwind: '$sessions' },
            { $match: { 'sessions.name': session } },
            { $unwind: '$sessions.semesters' },
            { $match: { 'sessions.semesters.semester_number': parseInt(semester) } },
            { $unwind: '$sessions.semesters.sections' },
            ...(section ? [{ $match: { 'sessions.semesters.sections.name': section.toUpperCase() } }] : []),
            { $unwind: '$sessions.semesters.sections.meetings' },
            { 
                $match: { 
                    'sessions.semesters.sections.meetings.mentorMUJid': mentorMUJid 
                } 
            },
            {
                $project: {
                    _id: 0,
                    meeting_id: '$sessions.semesters.sections.meetings.meeting_id',
                    meeting_date: '$sessions.semesters.sections.meetings.meeting_date',
                    meeting_time: '$sessions.semesters.sections.meetings.meeting_time',
                    mentorMUJid: '$sessions.semesters.sections.meetings.mentorMUJid',
                    mentee_ids: '$sessions.semesters.sections.meetings.mentee_ids',
                    meeting_notes: '$sessions.semesters.sections.meetings.meeting_notes',
                    created_at: '$sessions.semesters.sections.meetings.created_at',
                    isReportFilled: '$sessions.semesters.sections.meetings.isReportFilled'
                }
            }
        ];

        const meetings = await AcademicSession.aggregate(pipeline);

        // Log for debugging
        console.log('Query params:', { year, session, semester, section, mentorMUJid });
        console.log('Found meetings:', meetings.length);

        if (meetings.length === 0) {
            return NextResponse.json(
                { 
                    message: 'No meetings found',
                    params: { year, session, semester, section, mentorMUJid }
                },
                { status: 404 }
            );
        }

        return NextResponse.json(meetings);

    } catch (error) {
        console.error('Database error:', error);
        return NextResponse.json(
            { 
                error: 'Failed to fetch meetings',
                details: error.message
            },
            { status: 500 }
        );
    }
}