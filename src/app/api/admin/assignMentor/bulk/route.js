import { connect } from "@/lib/dbConfig";
import { Mentee } from "@/lib/db/menteeSchema";
import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    await connect();
    const { assignments } = await req.json();

    if (!assignments || !Array.isArray(assignments)) {
      return NextResponse.json(
        { error: "Invalid assignments data" },
        { status: 400 }
      );
    }

    const results = await Promise.all(
      assignments.map(async (assignment) => {
        try {
          const mentee = await Mentee.findOne({ MUJid: assignment.mentee_MUJid });
          if (!mentee) {
            return { 
              MUJid: assignment.mentee_MUJid, 
              success: false, 
              error: "Mentee not found" 
            };
          }

          mentee.mentorMujid = assignment.mentor_MUJid;
          await mentee.save();
          return { MUJid: assignment.mentee_MUJid, success: true };
        } catch (error) {
          return { 
            MUJid: assignment.mentee_MUJid, 
            success: false, 
            error: error.message 
          };
        }
      })
    );

    const failures = results.filter(r => !r.success);
    if (failures.length > 0) {
      return NextResponse.json({ 
        message: "Some assignments failed",
        failures 
      }, { status: 400 });
    }

    return NextResponse.json({ 
      message: "All assignments successful" 
    }, { status: 200 });

  } catch (error) {
    console.error("Error in bulk assignment:", error);
    return NextResponse.json(
      { error: "Failed to process assignments" },
      { status: 500 }
    );
  }
}
