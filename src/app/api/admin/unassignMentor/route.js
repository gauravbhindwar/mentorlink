import { connect } from "@/lib/dbConfig";
import { Mentee } from "@/lib/db/menteeSchema";
import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    await connect();
    const { mentee_MUJid, mentor_MUJid } = await req.json();

    if (!mentee_MUJid || !mentor_MUJid) {
      return NextResponse.json(
        { error: "Mentee MUJid and Mentor MUJid are required" },
        { status: 400 }
      );
    }

    // Use findOneAndUpdate instead of find and save
    const result = await Mentee.findOneAndUpdate(
      { 
        MUJid: mentee_MUJid,
        mentorMujid: mentor_MUJid
      },
      { 
        $set: { mentorMujid: null }
      },
      {
        new: true,
        runValidators: false // Skip validation since we're setting to null
      }
    );

    if (!result) {
      return NextResponse.json(
        { error: "Mentee not found or not assigned to this mentor" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { message: "Mentee unassigned successfully" },
      { status: 200 }
    );

  } catch (error) {
    console.error("Error unassigning mentee:", error);
    return NextResponse.json(
      { error: "Failed to unassign mentee", details: error.message },
      { status: 500 }
    );
  }
}
