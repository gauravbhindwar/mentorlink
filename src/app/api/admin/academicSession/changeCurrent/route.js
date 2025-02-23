import { NextResponse } from "next/server";
import { connect } from "@/lib/dbConfig";
import { AcademicSession } from "@/lib/db/academicSessionSchema";

export async function PUT(request) {
  try {
    await connect();
    const { academicYear, sessionName } = await request.json();

    // First, unset current session
    await AcademicSession.updateMany(
      { isCurrent: true },
      { $set: { isCurrent: false } }
    );

    // Then set new current session
    const [startYear, endYear] = academicYear.split('-').map(Number);
    const result = await AcademicSession.findOneAndUpdate(
      {
        start_year: startYear,
        end_year: endYear,
        'sessions.name': sessionName
      },
      { $set: { isCurrent: true } },
      { new: true }
    );

    if (!result) {
      return NextResponse.json(
        { error: "Session not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: "Current session changed successfully",
      data: result
    });
  } catch (error) {
    console.error("Error changing current session:", error);
    return NextResponse.json(
      { error: "Error changing current session" },
      { status: 500 }
    );
  }
}
