import { NextResponse } from "next/server";
import { connect } from "@/lib/dbConfig";
import { AcademicSession } from "@/lib/db/academicSessionSchema";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const academicYear = searchParams.get('academicYear');
    const academicSession = searchParams.get('academicSession');

    if (!academicYear || !academicSession) {
      return NextResponse.json(
        { message: "Academic year and session are required" },
        { status: 400 }
      );
    }

    await connect();
    const [startYear, endYear] = academicYear.split('-').map(Number);

    const sessionRecord = await AcademicSession.findOne({
      start_year: startYear,
      end_year: endYear,
      'sessions.name': academicSession
    });

    if (!sessionRecord) {
      return NextResponse.json({ mentors: 0, mentees: 0, meetings: 0 });
    }

    const session = sessionRecord.sessions.find(s => s.name === academicSession);
    
    // Get unique mentors from the mentors array
    const mentorSet = new Set(session.mentors.map(m => m.MUJid));
    
    // Get unique mentees from the mentors array
    const menteeSet = new Set();
    session.mentors.forEach(mentor => {
      mentor.mentees.forEach(mentee => {
        if (mentee.MUJid) menteeSet.add(mentee.MUJid);
      });
    });

    // Count total meetings
    let meetingsCount = 0;
    session.semesters.forEach(semester => {
      semester.meetingPages.forEach(page => {
        meetingsCount += page.meetings.length;
      });
    });

    return NextResponse.json({
      mentors: mentorSet.size,
      mentees: menteeSet.size,
      meetings: meetingsCount
    });

  } catch (error) {
    console.log("Error in getStats:", error);
    return NextResponse.json(
      { message: "Error fetching stats" },
      { status: 500 }
    );
  }
}
