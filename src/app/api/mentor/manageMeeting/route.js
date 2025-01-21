import { NextResponse } from "next/server";
import { AcademicSession } from "../../../../lib/db/academicSessionSchema";
import { Mentee } from "../../../../lib/db/menteeSchema";
import { connect } from "../../../../lib/dbConfig";

export async function GET(request) {
  try {
    await connect();

    // Get mentorId from query params
    const { searchParams } = new URL(request.url);
    const mentorId = searchParams.get("mentorId");
    const academicYear = searchParams.get("academicYear");
    const session = searchParams.get("session");

    if (!mentorId || !academicYear || !session) {
      return NextResponse.json(
        { error: "Missing required parameters" },
        { status: 400 }
      );
    }

    // Find academic session
    const academicSessionDoc = await AcademicSession.findOne({
      "sessions.name": session,
      start_year: parseInt(academicYear),
    });

    if (!academicSessionDoc) {
      return NextResponse.json(
        { error: "Academic session not found" },
        { status: 404 }
      );
    }

    // Aggregate meetings for the mentor
    const meetings = await AcademicSession.aggregate([
      { $unwind: "$sessions" },
      { $unwind: "$sessions.semesters" },
      { $unwind: "$sessions.semesters.sections" },
      { $unwind: "$sessions.semesters.sections.meetings" },
      {
        $match: {
          "sessions.name": session,
          start_year: parseInt(academicYear),
          "sessions.semesters.sections.meetings.mentorMUJid": mentorId,
        },
      },
      {
        $project: {
          _id: 0,
          meeting: "$sessions.semesters.sections.meetings",
          section: "$sessions.semesters.sections.name",
          semester: "$sessions.semesters.semester_number",
          sessionName: "$sessions.name",
        },
      },
    ]);

    // Now enhance each meeting with mentee details
    const meetingsWithMenteeDetails = await Promise.all(
      meetings.map(async (meeting) => {
        const menteeDetails = await Promise.all(
          meeting.meeting.mentee_ids.map(async (menteeId) => {
            const mentee = await Mentee.findOne(
              { MUJid: menteeId },
              {
                name: 1,
                email: 1,
                MUJid: 1,
                phone: 1,
                section: 1,
                semester: 1,
                academicYear: 1,
                academicSession: 1,
                _id: 0,
              }
            ).lean();

            return (
              mentee || {
                MUJid: menteeId,
                name: "Not Found",
                email: "Not Found",
                phone: "Not Found",
                section: "Not Found",
                semester: "Not Found",
                academicYear: "Not Found",
                academicSession: "Not Found",
              }
            );
          })
        );

        return {
          ...meeting,
          menteeDetails,
        };
      })
    );

    return NextResponse.json(
      { meetings: meetingsWithMenteeDetails },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching meetings:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
