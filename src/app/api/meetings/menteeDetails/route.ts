import { NextResponse } from 'next/server';
import { AcademicSession } from '@/lib/db/academicSessionSchema';
import { connect } from '@/lib/dbConfig';

export async function GET(request: Request) {
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

    const academicSession = await AcademicSession.findOne({ 
      start_year: parseInt(year),
      'sessions.name': session
    });

    if (!academicSession) {
      return NextResponse.json(
        { error: 'Academic session not found' },
        { status: 404 }
      );
    }

    const result = await academicSession.getMeetingWithMenteeDetails(mentorId, meetingId);
    
    // Format the response
    const response = {
      meeting: result.meeting,
      mentee_details: result.mentee_details.map((mentee: {
        MUJid: string;
        name: string;
        email: string;
        section: string;
        semester: number;
        academicYear: number;
      }) => ({
        mujId: mentee.MUJid,
        name: mentee.name,
        email: mentee.email,
        section: mentee.section,
        semester: mentee.semester,
        academicYear: mentee.academicYear
      }))
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch mentee details' },
      { status: 500 }
    );
  }
}