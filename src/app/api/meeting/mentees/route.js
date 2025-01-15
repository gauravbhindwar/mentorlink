import { NextResponse } from "next/server";
import { connect } from "../../../../lib/dbConfig";
import { Mentee } from "../../../../lib/dbModels";

export async function GET(request) {
  try {
    await connect();

    const { searchParams } = new URL(request.url);
    const mentorId = searchParams.get("mentorId");
    const semester = searchParams.get("semester");
    const section = searchParams.get("section");

    if (!mentorId || !semester || !section) {
      return NextResponse.json(
        { message: "Missing required parameters" },
        { status: 400 }
      );
    }

    // Use Mentee model instead of direct collection access
    const mentees = await Mentee.find({
      mentorMujid: mentorId,
      semester: parseInt(semester),
      section: section.toUpperCase(),
    });
    // console.log(mentees);
    if (!mentees.length) {
      return NextResponse.json(
        { message: "No mentees found for given criteria" },
        { status: 404 }
      );
    }

    return NextResponse.json(mentees);
  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json(
      { message: "Failed to fetch mentees" },
      { status: 500 }
    );
  }
}
