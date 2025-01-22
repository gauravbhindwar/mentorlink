import { connect } from "../../../../../lib/dbConfig";
import { Mentor } from "../../../../../lib/dbModels";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    await connect();

    // Get latest mentor MUJid
    const latestMentor = await Mentor.findOne({})
      .sort({ MUJid: -1 })
      .select('MUJid')
      .lean(); // Add lean() for better performance

    let nextMentorId = 1;
    if (latestMentor?.MUJid) {
      // Extract number from MUJid and ensure it's handled correctly
      const match = latestMentor.MUJid.match(/\d+/);
      if (match) {
        nextMentorId = parseInt(match[0], 10) + 1;
      }
    }

    // Ensure padding is consistent
    const nextMUJid = `MUJ${String(nextMentorId).padStart(5, '0')}`;

    // Verify this ID doesn't exist (double-check)
    const exists = await Mentor.findOne({ MUJid: nextMUJid });
    if (exists) {
      // If exists, increment until we find an available ID
      while (await Mentor.findOne({ MUJid: `MUJ${String(nextMentorId).padStart(5, '0')}` })) {
        nextMentorId++;
      }
      return NextResponse.json({ 
        nextMUJid: `MUJ${String(nextMentorId).padStart(5, '0')}` 
      });
    }

    return NextResponse.json({ nextMUJid });
  } catch (error) {
    console.error("Error generating next MUJid:", error);
    return NextResponse.json(
      { error: "Error generating next MUJid" },
      { status: 500 }
    );
  }
}