import { NextResponse } from "next/server";
import { connect } from "@/lib/dbConfig";
import { AcademicSession } from "@/lib/db/academicSessionSchema";

export async function POST(request) {
  try {
    await connect();
    const data = await request.json();

    // Validate required fields
    if (!data.start_year || !data.end_year || !data.sessions) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Create new academic session without sections
    const newSession = new AcademicSession({
      start_year: data.start_year,
      end_year: data.end_year,
      sessions: data.sessions,
    });

    await newSession.save();

    return NextResponse.json(
      { message: "Academic session created successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error creating academic session:", error);
    return NextResponse.json(
      { error: error.message || "Error creating academic session" },
      { status: 500 }
    );
  }
}
