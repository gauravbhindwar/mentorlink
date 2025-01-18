import { NextResponse } from "next/server";
import { AcademicSession } from "../../../../lib/db/academicSessionSchema";
import { connect } from "../../../../lib/dbConfig";

export async function GET(request) {
  try {
    await connect();
    const { searchParams } = new URL(request.url);
    const year = searchParams.get("year");
    const session = searchParams.get("session");
    const semester = searchParams.get("semester");
    const section = searchParams.get("section");
    const mentorMUJid = searchParams.get("mentorMUJid");

    if (!year || !session || !semester || !mentorMUJid) {
      return NextResponse.json(
        { error: "Missing required parameters" },
        { status: 400 }
      );
    }

    // Build match conditions
    const matchStage = {
      start_year: parseInt(year),
      "sessions.name": session,
      "sessions.semesters.semester_number": parseInt(semester),
      "sessions.semesters.sections.meetings.mentorMUJid": mentorMUJid,
    };

    if (section) {
      matchStage["sessions.semesters.sections.name"] = section.toUpperCase();
    }

    // Aggregate pipeline to get mentor's meetings
    const meetings = await AcademicSession.aggregate([
      { $match: { start_year: parseInt(year) } },
      { $unwind: "$sessions" },
      { $unwind: "$sessions.semesters" },
      { $unwind: "$sessions.semesters.sections" },
      { $unwind: "$sessions.semesters.sections.meetings" },
      {
        $match: {
          "sessions.name": session,
          "sessions.semesters.semester_number": parseInt(semester),
          "sessions.semesters.sections.meetings.mentorMUJid": mentorMUJid,
          ...(section && {
            "sessions.semesters.sections.name": section.toUpperCase(),
          }),
        },
      },
      {
        $project: {
          meeting_id: "$sessions.semesters.sections.meetings.meeting_id",
          meeting_date: "$sessions.semesters.sections.meetings.meeting_date",
          meeting_time: "$sessions.semesters.sections.meetings.meeting_time",
          mentee_ids: "$sessions.semesters.sections.meetings.mentee_ids",
          meeting_notes: "$sessions.semesters.sections.meetings.meeting_notes",
          created_at: "$sessions.semesters.sections.meetings.created_at",
          updated_at: "$sessions.semesters.sections.meetings.updated_at",
        },
      },
      { $sort: { meeting_date: -1 } },
    ]);

    return NextResponse.json(meetings);
  } catch (error) {
    console.error("Database error:", error);
    return NextResponse.json(
      { error: "Failed to fetch mentor meetings" },
      { status: 500 }
    );
  }
}
