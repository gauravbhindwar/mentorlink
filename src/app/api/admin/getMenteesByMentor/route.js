import { connect } from "../../../../lib/dbConfig";
import { Mentee } from "../../../../lib/db/menteeSchema";
import { NextResponse } from "next/server";

export async function GET(req) {
  try {
    await connect();

    const { searchParams } = new URL(req.url);
    const mentorMujid = searchParams.get('mentorMujid');
    const semester = parseInt(searchParams.get('semester'));

    if (!mentorMujid || !semester) {
      return NextResponse.json(
        { error: "Invalid parameters. Mentor MUJID, semester, and valid section (A-Z) are required" },
        { status: 400 }
      );
    }

    const mentees = await Mentee.find({ 
      mentorMujid: mentorMujid,
      semester: semester
    }).select('name MUJid email semester academicYear academicSession yearOfRegistration phone');

    return NextResponse.json({ mentees }, { status: 200 });

  } catch (error) {
    console.error("Error fetching mentees:", error);
    return NextResponse.json(
      { error: "Failed to fetch mentees" },
      { status: 500 }
    );
  }
}
