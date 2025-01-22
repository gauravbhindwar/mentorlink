import { connect } from "../../../../../lib/dbConfig";
import { Mentee } from "../../../../../lib/db/menteeSchema";
import { NextResponse } from "next/server";

export async function GET(req) {
  try {
    await connect();
    const { searchParams } = new URL(req.url);
    const mentorMujid = searchParams.get('mentorMujid');

    if (!mentorMujid) {
      return NextResponse.json({ 
        error: "Mentor MUJid is required" 
      }, { status: 400 });
    }

    const menteesCount = await Mentee.countDocuments({ mentorMujid });

    return NextResponse.json({
      hasMentees: menteesCount > 0,
      menteeCount: menteesCount
    });

  } catch (error) {
    console.error("Error checking mentees:", error);
    return NextResponse.json({ 
      error: "Failed to check mentees" 
    }, { status: 500 });
  }
}
