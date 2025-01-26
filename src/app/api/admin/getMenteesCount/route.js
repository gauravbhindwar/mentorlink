import { connect } from "../../../../lib/dbConfig";
import { Mentee } from "../../../../lib/db/menteeSchema";
import { NextResponse } from "next/server";

export async function GET(req) {
  try {
    await connect();

    const { searchParams } = new URL(req.url);
    const mentorMujid = searchParams.get('mentorMujid');

    if (!mentorMujid) {
      return NextResponse.json(
        { error: "Mentor MUJID is required" },
        { status: 400 }
      );
    }

    // Aggregate mentees by semester
    const menteeCounts = await Mentee.aggregate([
      { 
        $match: { 
          mentorMujid: mentorMujid 
        } 
      },
      {
        $group: {
          _id: "$semester",
          count: { $sum: 1 }
        }
      }
    ]);

    // Convert array to object with semester as key
    const counts = menteeCounts.reduce((acc, curr) => {
      acc[curr._id] = curr.count;
      return acc;
    }, {});

    return NextResponse.json({ counts }, { status: 200 });

  } catch (error) {
    console.error("Error fetching mentee counts:", error);
    return NextResponse.json(
      { error: "Failed to fetch mentee counts" },
      { status: 500 }
    );
  }
}
