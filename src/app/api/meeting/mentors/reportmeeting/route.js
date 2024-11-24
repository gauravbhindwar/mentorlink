import { AcademicSession } from "@/lib/db/academicSessionSchema";
import { NextResponse } from "next/server";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const mentorId = searchParams.get("mentor_id");
  const semester = parseInt(searchParams.get("semester"));
  const section = searchParams.get("section");
  const session = searchParams.get("session");
  const year = searchParams.get("year");

  try {
    const academicSession = await AcademicSession.findOne({
      start_year: parseInt(year.split("-")[0]),
      end_year: parseInt(year.split("-")[1]),
      "sessions.name": session,
      "sessions.semesters.semester_number": semester,
      "sessions.semesters.sections.name": section,
      "sessions.semesters.sections.meetings.mentor_id": mentorId,
    });

    if (!academicSession) {
      return NextResponse.json({ meetings: [] }, { status: 200 });
    }

    const meetings = academicSession.sessions
      .flatMap((session) => session.semesters)
      .flatMap((semester) => semester.sections)
      .flatMap((section) => section.meetings)
      .filter((meeting) => meeting.mentor_id === mentorId);

    return NextResponse.json({ meetings }, { status: 200 });
  } catch (error) {
    console.error("Error fetching reported meetings:", error);
    return NextResponse.json(
      { error: "Error fetching reported meetings" },
      { status: 500 }
    );
  }
}
