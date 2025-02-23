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

    // Check if any current session exists
    const currentSessionExists = await AcademicSession.findOne({ isCurrent: true });

    // Check if academic session already exists
    const existingSession = await AcademicSession.findOne({
      start_year: data.start_year,
      end_year: data.end_year,
      'sessions.name': data.sessions[0].name
    });

    if (existingSession) {
      return NextResponse.json(
        { error: "Academic session already exists for this period" },
        { status: 409 }
      );
    }

    // Create new academic session without sections
    const newSession = new AcademicSession({
      start_year: data.start_year,
      end_year: data.end_year,
      sessions: data.sessions,
      isCurrent: !currentSessionExists, // Set as current if no current session exists
      created_at: new Date(),
      updated_at: new Date()
    });

    await newSession.save();

    return NextResponse.json(
      { message: "Academic session created successfully", isCurrent: !currentSessionExists },
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

export async function GET() {
  try {
    await connect();
    
    // Select only necessary fields and lean() for faster queries
    const sessions = await AcademicSession.find({}, {
      'start_year': 1,
      'end_year': 1,
      'sessions.name': 1,
      'sessions.semesters.semester_number': 1,
      'archivedAt': 1,
      'isCurrent': 1
    })
    .lean()
    .exec();

    // Pre-calculate the sort order to avoid multiple comparisons
    const getSortPriority = (session) => {
      if (session.isCurrent) return 0;
      if (!session.archivedAt) return 1;
      return 2;
    };

    const sortedSessions = sessions.sort((a, b) => {
      const priorityA = getSortPriority(a);
      const priorityB = getSortPriority(b);
      
      if (priorityA !== priorityB) return priorityA - priorityB;
      return b.start_year - a.start_year;
    });

    return NextResponse.json(sortedSessions);
  } catch (error) {
    console.error("Error fetching academic sessions:", error);
    return NextResponse.json(
      { error: "Error fetching academic sessions" },
      { status: 500 }
    );
  }
}
