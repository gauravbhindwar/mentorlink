import { connect } from "@/lib/dbConfig";
import { Mentee } from "@/lib/dbModels";
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

    // Get all mentees for this mentor
    const mentees = await Mentee.find({ mentorMujid });

    // Group mentees by semester
    const semesterCounts = mentees.reduce((acc, mentee) => {
      const semester = mentee.semester || 'Unknown';
      acc[semester] = (acc[semester] || 0) + 1;
      return acc;
    }, {});

    // Sort by semester number
    const sortedCounts = Object.entries(semesterCounts)
      .sort(([a], [b]) => parseInt(a) - parseInt(b))
      .reduce((obj, [key, value]) => {
        obj[key] = value;
        return obj;
      }, {});

    return NextResponse.json({
      counts: sortedCounts,
      total: mentees.length
    });

  } catch (error) {
    console.error("Error getting mentee counts:", error);
    return NextResponse.json({ 
      error: "Failed to get mentee counts" 
    }, { status: 500 });
  }
}
