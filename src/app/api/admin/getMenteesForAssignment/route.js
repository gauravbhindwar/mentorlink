import { connect } from "../../../../lib/dbConfig";
import { Mentee } from "../../../../lib/db/menteeSchema";
import { Mentor } from "../../../../lib/db/mentorSchema";
import { NextResponse } from "next/server";

export async function GET(req) {
  try {
    await connect();
    const { searchParams } = new URL(req.url);
    const semester = parseInt(searchParams.get('semester'));
    const academicYear = searchParams.get('academicYear');
    const academicSession = searchParams.get('academicSession');

    if (!semester|| !academicYear || !academicSession) {
      return NextResponse.json(
        { error: "All parameters are required" },
        { status: 400 }
      );
    }

    // Find all mentees matching criteria
    const mentees = await Mentee.find({
      semester,
      academicYear,
      academicSession
    }).select('name MUJid email  semester mentorMujid mentorEmailid phone');

    // Get mentor details for assigned mentees
    const mentorsDetails = await Mentor.find({
      MUJid: { 
        $in: mentees
          .filter(m => m.mentorMujid)
          .map(m => m.mentorMujid)
      }
    }).select('name MUJid email');

    // Combine mentee and mentor information
    const menteesList = mentees.map(mentee => ({
      ...mentee.toObject(),
      assignedMentor: mentorsDetails.find(m => m.MUJid === mentee.mentorMujid)
    }));

    return NextResponse.json({ mentees: menteesList }, { status: 200 });

  } catch (error) {
    console.error("Error fetching mentees:", error);
    return NextResponse.json(
      { error: "Failed to fetch mentees" },
      { status: 500 }
    );
  }
}
