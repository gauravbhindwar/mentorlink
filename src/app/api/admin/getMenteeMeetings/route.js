import { connect } from "../../../../lib/dbConfig";
import { AcademicSession } from "../../../../lib/db/academicSessionSchema";
import { NextResponse } from "next/server";

export async function GET(req) {
  try {
    await connect();

    const { searchParams } = new URL(req.url);
    const menteeMujid = searchParams.get('menteeMujid');

    if (!menteeMujid) {
      return NextResponse.json(
        { error: "Mentee MUJid is required" },
        { status: 400 }
      );
    }

    // Aggregate meetings across all academic sessions
    const result = await AcademicSession.aggregate([
      { $unwind: "$sessions" },
      { $unwind: "$sessions.semesters" },
      { $unwind: "$sessions.semesters.sections" },
      { $unwind: "$sessions.semesters.sections.meetings" },
      {
        $match: {
          "sessions.semesters.sections.meetings.mentee_ids": menteeMujid
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          completed: {
            $sum: {
              $cond: [
                { $eq: ["$sessions.semesters.sections.meetings.status", "completed"] },
                1,
                0
              ]
            }
          },
          scheduled: {
            $sum: {
              $cond: [
                { $eq: ["$sessions.semesters.sections.meetings.status", "scheduled"] },
                1,
                0
              ]
            }
          }
        }
      }
    ]);

    const stats = result[0] || { total: 0, completed: 0, scheduled: 0 };

    return NextResponse.json(stats, { status: 200 });

  } catch (error) {
    console.error("Error fetching mentee meetings:", error);
    return NextResponse.json(
      { error: "Failed to fetch meeting statistics" },
      { status: 500 }
    );
  }
}
