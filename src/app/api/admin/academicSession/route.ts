import { NextResponse } from 'next/server';
import { AcademicSession } from '@/lib/db/academicSessionSchema';
import { connect } from "@/lib/dbConfig";

export async function POST(request: Request) {
  try {
    await connect();
    const data = await request.json();

    // Validate session name format
    const sessionNameRegex = /^(JULY-DECEMBER|JANUARY-JUNE) \d{4}$/;
    if (!sessionNameRegex.test(data.sessions[0].name)) {
      return NextResponse.json({ 
        error: 'Invalid session name format. Must be JULY-DECEMBER YYYY or JANUARY-JUNE YYYY' 
      }, { status: 400 });
    }

    // Check if the academic session already exists
    const existingSession = await AcademicSession.findOne({ 
      start_year: data.start_year,
      'sessions.name': data.sessions[0].name
    });

    if (existingSession) {
      return NextResponse.json({ 
        error: 'Session already exists for this academic year' 
      }, { status: 400 });
    }

    // Structure the data according to schema
    const sessionData = {
      start_year: data.start_year,
      end_year: data.end_year,
      sessions: [{
        name: data.sessions[0].name,
        semesters: data.sessions[0].semesters.map(
          (semester: { semester_number: number, sections: { name: string }[] }) => ({
            semester_number: semester.semester_number,
            sections: semester.sections.map(section => ({
              name: section.name.toUpperCase(),
              meetings: []
            }))
          })
        )
      }],
      created_at: new Date(),
      updated_at: new Date()
    };

    // Create new session or update existing academic year
    const academicSession = await AcademicSession.findOneAndUpdate(
      { start_year: data.start_year },
      { 
        $setOnInsert: { start_year: data.start_year, end_year: data.end_year },
        $push: { sessions: sessionData.sessions[0] },
        $set: { updated_at: new Date() }
      },
      { upsert: true, new: true }
    );

    return NextResponse.json({ 
      message: 'Academic session created successfully',
      data: academicSession 
    }, { status: 200 });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Error creating academic session';
    return NextResponse.json({ 
      error: errorMessage 
    }, { status: 500 });
  }
}
