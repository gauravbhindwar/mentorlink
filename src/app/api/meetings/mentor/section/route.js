import { connect } from '../../../../../lib/dbConfig';
import { AcademicSession } from '../../../../../lib/db/academicSessionSchema';
import { NextResponse } from 'next/server';

export async function GET(request) {
  try {
    await connect();
    
    const { searchParams } = new URL(request.url);
    const mentorMUJid = searchParams.get('mentorMUJid');
    const academicYear = searchParams.get('academicYear');
    const academicSession = searchParams.get('academicSession');
    const semester = searchParams.get('semester');

    if (!mentorMUJid || !academicYear || !academicSession || !semester) {
      return NextResponse.json({ 
        message: 'Missing required parameters',
        section: '' 
      }, { status: 400 });
    }

    const academicSessionDoc = await AcademicSession.findOne({
      start_year: parseInt(academicYear.split('-')[0]),
      'sessions.name': academicSession,
      'sessions.semesters.semester_number': parseInt(semester),
      'sessions.semesters.sections.meetings.mentor_id': mentorMUJid
    });

    if (!academicSessionDoc) {
      return NextResponse.json({ 
        message: 'No section found',
        section: '' 
      }, { status: 200 });
    }

    // Find the relevant section
    const section = academicSessionDoc.sessions
      .find(s => s.name === academicSession)
      ?.semesters
      .find(sem => sem.semester_number === parseInt(semester))
      ?.sections
      .find(sec => sec.meetings.some(m => m.mentor_id === mentorMUJid))
      ?.name || '';

    return NextResponse.json({
      section,
      message: section ? 'Section retrieved successfully' : 'No section found'
    }, { status: 200 });

  } catch (error) {
    console.error('Error in section fetch:', error);
    return NextResponse.json({ 
      message: 'Internal server error', 
      error: error.message,
      section: ''
    }, { status: 500 });
  }
}
