import { connect } from "../../../../../lib/dbConfig";
import { Mentor } from "../../../../../lib/db/mentorSchema";
import { Mentee } from "../../../../../lib/db/menteeSchema";
import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    await connect();
    const { fromMentorId, toMentorEmail, academicYear, academicSession } = await req.json();

    // Validate input
    if (!fromMentorId || !toMentorEmail || !academicYear || !academicSession) {
      return NextResponse.json({ 
        success: false, 
        message: "Missing required fields" 
      }, { status: 400 });
    }

    // Get target mentor by email with academic year/session restrictions
    const toMentor = await Mentor.findOne({ 
      email: toMentorEmail,
      academicYear,
      academicSession
    });

    if (!toMentor) {
      return NextResponse.json({ 
        success: false, 
        message: "Target mentor not found in the same academic year and session" 
      }, { status: 404 });
    }

    // Update mentees assigned to the source mentor within same academic year/session
    const updateResult = await Mentee.updateMany(
      { 
        mentorMujid: fromMentorId,
        academicYear,
        academicSession
      },
      { 
        $set: { 
          mentorMujid: toMentor.MUJid,
          mentorEmailid: toMentor.email
        }
      }
    );

    return NextResponse.json({
      success: true,
      message: `Successfully transferred ${updateResult.modifiedCount} mentees`,
      updatedCount: updateResult.modifiedCount
    });

  } catch (error) {
    console.error("Transfer error:", error);
    return NextResponse.json({ 
      success: false, 
      message: error.message || "Error transferring mentees" 
    }, { status: 500 });
  }
}
