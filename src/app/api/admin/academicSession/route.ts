import { NextResponse } from 'next/server';
import { AcademicSession } from '@/lib/db/academicSessionSchema';
import { Mentee } from '@/lib/db/menteeSchema';
import { connect } from "@/lib/dbConfig";

export async function assignMenteesToNewSession(
  previousSessionName: string,
  newSessionName: string
) {
  try {
    // Connect to database
    await connect();

    // Fetch previous session details
    const previousSession = await AcademicSession.findOne({
      'sessions.name': previousSessionName,
    });

    if (!previousSession) {
      console.error(`Previous session "${previousSessionName}" not found.`);
      return { success: false, message: 'Previous session not found' };
    }

    // Fetch mentees from the previous session
    const previousMentees = await Mentee.find({ academicSession: previousSessionName });

    if (previousMentees.length === 0) {
      console.log(`No mentees found in previous session "${previousSessionName}".`);
      return { success: true, message: 'No mentees to assign' };
    }

    console.log(`Found ${previousMentees.length} mentees in previous session`);

    // Fetch new session details
    const newSession = await AcademicSession.findOne({
      'sessions.name': newSessionName,
    });

    if (!newSession) {
      console.error(`New session "${newSessionName}" not found.`);
      return { success: false, message: 'New session not found' };
    }

    // Process mentees and assign them to the appropriate sections
    for (const mentee of previousMentees) {
      const { semester, section } = mentee;

      const updateResult = await AcademicSession.updateOne(
        {
          _id: newSession._id,
          'sessions.name': newSessionName,
          'sessions.semesters.semester_number': semester,
          'sessions.semesters.sections.name': section.toUpperCase(),
        },
        {
          $push: {
            'sessions.$[session].semesters.$[semester].sections.$[section].mentees_assigned': mentee._id,
          },
        },
        {
          arrayFilters: [
            { 'session.name': newSessionName },
            { 'semester.semester_number': semester },
            { 'section.name': section.toUpperCase() },
          ],
        }
      );

      if (updateResult.modifiedCount === 0) {
        console.warn(`Mentee "${mentee.name}" could not be assigned to a section in the new session.`);
      } else {
        console.log(`Assigned mentee "${mentee.name}" to semester ${semester}, section ${section}`);
      }
    }

    return { success: true, message: 'Mentees assigned successfully' };
  } catch (error) {
    console.error('Error during mentee assignment:', error);
    return { success: false, message: 'Error during mentee assignment', error };
  }
}

export async function POST(request: Request) {
  try {
    await connect();
    const data = await request.json();

    // Validate session name format
    const sessionNameRegex = /^(JULY-DECEMBER|JANUARY-JUNE) \d{4}$/;
    if (!sessionNameRegex.test(data.sessions[0].name)) {
      return NextResponse.json({ 
        error: 'Invalid session name format' 
      }, { status: 400 });
    }

    // Check existing session
    const existingSession = await AcademicSession.findOne({ 
      start_year: data.start_year,
      'sessions.name': data.sessions[0].name
    });

    if (existingSession) {
      return NextResponse.json({ 
        error: 'Session already exists' 
      }, { status: 400 });
    }

    // Create new session
    const academicSession = await AcademicSession.create({
      start_year: data.start_year,
      end_year: data.end_year,
      sessions: [{
        name: data.sessions[0].name,
        semesters: data.sessions[0].semesters.map(
          (semester: { semester_number: number, sections: { name: string }[] }) => ({
            semester_number: semester.semester_number,
            start_date: new Date("2025-01-01"),
            end_date: new Date("2025-06-30"),
            sections: semester.sections.map(section => ({
              name: section.name.toUpperCase(),
              mentees_assigned: [],
              meetings: []
            }))
          })
        )
      }]
    });

    // Archive process
    const tempSession = new AcademicSession();
    const archiveResult = await tempSession.archivePreviousSession(data.sessions[0].name);

    if (archiveResult.success && archiveResult.assignmentData?.length > 0) {
      // Process archived mentees
      for (const mentorData of archiveResult.assignmentData) {
        for (const semesterData of mentorData.assignments) {
          for (const sectionData of semesterData.sections) {
            await AcademicSession.findOneAndUpdate(
              { _id: academicSession._id },
              {
                $push: {
                  'sessions.$[session].semesters.$[semester].sections.$[section].mentees_assigned': {
                    $each: sectionData.mentees_assigned
                  }
                }
              },
              {
                arrayFilters: [
                  { 'session.name': data.sessions[0].name },
                  { 'semester.semester_number': semesterData.semester_number },
                  { 'section.name': sectionData.name }
                ],
                new: true
              }
            );
          }
        }
      }
    }

    // Fetch final state
    const finalSession = await AcademicSession.findById(academicSession._id);

    return NextResponse.json({ 
      success: true,
      message: 'Academic session created successfully',
      data: finalSession,
      archiveStats: archiveResult.success ? {
        totalMentees: archiveResult.totalMentees,
        totalMentors: archiveResult.totalMentors
      } : null
    });

  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Internal server error'
    }, { status: 500 });
  }
}
