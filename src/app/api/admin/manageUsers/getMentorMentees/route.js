import { connect } from "../../../../../lib/dbConfig";
import { Mentee } from "../../../../../lib/db/menteeSchema";
import { NextResponse } from "next/server";

export async function GET(req) {
  try {
    await connect();
    
    // Get the URL parameters
    const url = new URL(req.url);
    const mentorMujid = url.searchParams.get('mentorMujid');
    const academicYear = url.searchParams.get('academicYear');
    const academicSession = url.searchParams.get('academicSession');
    
    // Validate required parameters
    if (!mentorMujid) {
      return NextResponse.json({ 
        success: false, 
        message: "Mentor MUJID is required" 
      }, { status: 400 });
    }

    // Build query
    const query = { mentorMujid };
    
    // Add optional filters if provided
    if (academicYear) {
      query.academicYear = academicYear;
    }
    
    if (academicSession) {
      query.academicSession = academicSession;
    }
    
    // Fetch mentees
    const mentees = await Mentee.find(query)
      .select('name email MUJid regNo phone_number semester academicYear academicSession')
      .sort({ semester: 1, name: 1 })
      .lean();
    
    return NextResponse.json({
      success: true,
      mentees
    });

  } catch (error) {
    console.error("Error fetching mentor's mentees:", error);
    
    return NextResponse.json({ 
      success: false, 
      message: error.message || "Error fetching mentees" 
    }, { status: 500 });
  }
}
