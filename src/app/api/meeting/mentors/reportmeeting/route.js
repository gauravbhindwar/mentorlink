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
      return NextResponse.json({ meetings: ["a"] }, { status: 200 });
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

export async function POST(request) {
  const { mentor_id, meeting_id, meeting_notes } = await request.json();

  try {
    const academicSession = await AcademicSession.findOneAndUpdate(
      {
        "sessions.semesters.sections.meetings.meeting_id": meeting_id,
        "sessions.semesters.sections.meetings.mentor_id": mentor_id,
      },
      {
        $set: {
          "sessions.$[session].semesters.$[semester].sections.$[section].meetings.$[meeting].meeting_notes":
            meeting_notes,
        },
      },
      {
        arrayFilters: [
          { "session.semesters.sections.meetings.meeting_id": meeting_id },
          { "semester.sections.meetings.meeting_id": meeting_id },
          { "section.meetings.meeting_id": meeting_id },
          { "meeting.meeting_id": meeting_id },
        ],
        new: true,
      }
    );

    if (!academicSession) {
      return NextResponse.json(
        { error: "Meeting not found or update failed" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { message: "Meeting notes updated successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error updating meeting notes:", error);
    return NextResponse.json(
      { error: "Error updating meeting notes" },
      { status: 500 }
    );
  }
}
