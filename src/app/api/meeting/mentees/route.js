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
    const academicYear = searchParams.get("year");
    const academicSession = searchParams.get("session");

    if (!mentorId || !semester || !academicYear || !academicSession) {
      return NextResponse.json(
        { message: "Missing required parameters" },
        { status: 400 }
      );
    }
    let mentees = [];
    // Use Mentee model instead of direct collection access
    if (section !== "") {
      mentees = await Mentee.find({
        mentorMujid: mentorId,
        semester: parseInt(semester),
        section: section.toUpperCase(),
        academicYear: academicYear,
        academicSession: academicSession,
      });
    } else {
      mentees = await Mentee.find({
        mentorMujid: mentorId,
        semester: parseInt(semester),
        academicYear: academicYear,
        academicSession: academicSession,
        // section: section.toUpperCase(),
      });
    }
    // console.log(mentees);
    if (mentees.length === 0) {
      return NextResponse.json(
        { message: "No mentees found for given criteria" },
        { status: 200 }
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
