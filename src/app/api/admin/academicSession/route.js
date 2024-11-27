import { NextResponse } from "next/server";
import { AcademicSession } from "@/lib/db/academicSessionSchema";
import { Mentee } from "@/lib/db/menteeSchema";
import { connect } from "@/lib/dbConfig";

async function assignMenteesToSection(
  sessionName,
  semesterNumber,
  sectionName
) {
  try {
    console.log("Searching mentees with criteria:", {
      academicSession: sessionName,
      semester: semesterNumber,
      section: sectionName,
    });

    const mentees = await Mentee.find({
      academicSession: sessionName,
      semester: semesterNumber,
      section: sectionName,
    }).select("MUJid name email phone mentorMujid parents");

    console.log(`Found ${mentees.length} mentees for section ${sectionName}`);

    if (mentees.length === 0) {
      console.log(
        "No mentees found. Current database state:",
        await Mentee.find({}).select("academicSession semester section").lean()
      );
    }

    return mentees.map((mentee) => ({
      mentee_id: mentee.MUJid,
      name: mentee.name,
      email: mentee.email,
      phone: mentee.phone,
      mentor_id: mentee.mentorMujid,
      parents: {
        father: mentee.parents?.father || {},
        mother: mentee.parents?.mother || {},
        guardian: mentee.parents?.guardian || null,
      },
      assigned_at: new Date(),
    }));
  } catch (error) {
    console.error("Error in assignMenteesToSection:", error);
    return [];
  }
}

async function getLastSessionData() {
  try {
    const lastAcademicSession = await AcademicSession.findOne()
      .sort({ created_at: -1 })
      .limit(1);

    if (!lastAcademicSession || !lastAcademicSession.sessions.length) {
      console.log("No previous academic session found");
      return null;
    }

    const lastSession =
      lastAcademicSession.sessions[lastAcademicSession.sessions.length - 1];
    console.log("Last session found:", lastSession.name);

    return {
      sessionName: lastSession.name,
      semesters: lastSession.semesters.map((sem) => ({
        semester_number: sem.semester_number,
        sections: sem.sections.map((sec) => sec.name),
      })),
    };
  } catch (error) {
    console.error("Error fetching last session:", error);
    return null;
  }
}

export async function PATCH(request) {
  try {
    await connect();
    const data = await request.json();

    // Validate session name format
    const sessionNameRegex = /^(JULY-DECEMBER|JANUARY-JUNE) \d{4}$/;
    if (!sessionNameRegex.test(data.sessions[0].name)) {
      return NextResponse.json(
        { error: "Invalid session name format" },
        { status: 400 }
      );
    }

    // Find existing academic year
    const existingYear = await AcademicSession.findOne({
      start_year: data.start_year,
      end_year: data.end_year,
    });

    if (!existingYear) {
      return NextResponse.json(
        { error: "Academic year not found" },
        { status: 404 }
      );
    }

    // Check if session already exists
    const sessionExists = existingYear.sessions.some(
      (session) => session.name === data.sessions[0].name
    );

    if (sessionExists) {
      return NextResponse.json(
        { error: "Session already exists" },
        { status: 400 }
      );
    }

    // Update academic year with new session
    const updatedSession = await AcademicSession.findOneAndUpdate(
      { _id: existingYear._id },
      {
        $push: {
          sessions: {
            name: data.sessions[0].name,
            semesters: data.sessions[0].semesters.map((semester) => ({
              semester_number: semester.semester_number,
              start_date: new Date("2025-01-01"),
              end_date: new Date("2025-06-30"),
              sections: semester.sections.map((section) => ({
                name: section.name.toUpperCase(),
                mentees_assigned: [],
                meetings: [],
              })),
            })),
          },
        },
        updated_at: new Date(),
      },
      { new: true }
    );

    // After creating/updating the session, fetch and assign mentees
    for (const semester of data.sessions[0].semesters) {
      for (const section of semester.sections) {
        const menteesToAssign = await assignMenteesToSection(
          data.sessions[0].name,
          semester.semester_number,
          section.name
        );

        if (menteesToAssign.length > 0) {
          await AcademicSession.findOneAndUpdate(
            {
              _id: existingYear._id,
              "sessions.name": data.sessions[0].name,
              "sessions.semesters.semester_number": semester.semester_number,
              "sessions.semesters.sections.name": section.name.toUpperCase(),
            },
            {
              $addToSet: {
                "sessions.$[session].semesters.$[semester].sections.$[section].mentees_assigned":
                  {
                    $each: menteesToAssign,
                  },
              },
            },
            {
              arrayFilters: [
                { "session.name": data.sessions[0].name },
                { "semester.semester_number": semester.semester_number },
                { "section.name": section.name.toUpperCase() },
              ],
            }
          );
        }
      }
    }

    // Process archive similarly to POST
    const tempSession = new AcademicSession();
    const archiveResult = await tempSession.archivePreviousSession(
      data.sessions[0].name
    );

    if (archiveResult.success && archiveResult.assignmentData?.length > 0) {
      // Process archived mentees
      // ...existing archive processing code...
    }

    return NextResponse.json({
      success: true,
      message: "Academic session updated successfully",
      data: updatedSession,
      archiveStats: archiveResult.success
        ? {
            totalMentees: archiveResult.totalMentees,
            totalMentors: archiveResult.totalMentors,
          }
        : null,
    });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    await connect();
    const data = await request.json();

    // Check if academic year exists
    const existingYear = await AcademicSession.findOne({
      start_year: data.start_year,
      end_year: data.end_year,
    });

    if (existingYear) {
      // Convert to PATCH request if year exists
      const patchRequest = new Request(request.url, {
        method: "PATCH",
        headers: request.headers,
        body: JSON.stringify(data),
      });
      return PATCH(patchRequest);
    }

    // Validate session name format
    const sessionNameRegex = /^(JULY-DECEMBER|JANUARY-JUNE) \d{4}$/;
    if (!sessionNameRegex.test(data.sessions[0].name)) {
      return NextResponse.json(
        {
          error: "Invalid session name format",
        },
        { status: 400 }
      );
    }

    // Check existing session
    const existingSession = await AcademicSession.findOne({
      start_year: data.start_year,
      "sessions.name": data.sessions[0].name,
    });

    if (existingSession) {
      return NextResponse.json(
        {
          error: "Session already exists",
        },
        { status: 400 }
      );
    }

    // Create new session
    const academicSession = await AcademicSession.create({
      start_year: data.start_year,
      end_year: data.end_year,
      sessions: [
        {
          name: data.sessions[0].name,
          semesters: data.sessions[0].semesters.map((semester) => ({
            semester_number: semester.semester_number,
            start_date: new Date("2025-01-01"),
            end_date: new Date("2025-06-30"),
            sections: semester.sections.map((section) => ({
              name: section.name.toUpperCase(),
              mentees_assigned: [],
              meetings: [],
            })),
          })),
        },
      ],
    });

    // Get last session data for mentee assignment
    const lastSessionData = await getLastSessionData();
    console.log("Last session data:", lastSessionData);

    if (lastSessionData) {
      // Assign mentees from last session data
      for (const semester of lastSessionData.semesters) {
        console.log(`Processing semester ${semester.semester_number}`);
        for (const sectionName of semester.sections) {
          console.log(`Processing section ${sectionName}`);

          const menteesToAssign = await assignMenteesToSection(
            lastSessionData.sessionName,
            semester.semester_number,
            sectionName
          );

          console.log(
            `Found ${menteesToAssign.length} mentees from last session`
          );

          if (menteesToAssign.length > 0) {
            await AcademicSession.findOneAndUpdate(
              { _id: academicSession._id },
              {
                $addToSet: {
                  "sessions.$[session].semesters.$[semester].sections.$[section].mentees_assigned":
                    {
                      $each: menteesToAssign,
                    },
                },
              },
              {
                arrayFilters: [
                  { "session.name": data.sessions[0].name },
                  { "semester.semester_number": semester.semester_number },
                  { "section.name": sectionName },
                ],
              }
            );
            console.log(
              `Updated section ${sectionName} with ${menteesToAssign.length} mentees`
            );
          }
        }
      }
    }

    // Archive process
    const tempSession = new AcademicSession();
    const archiveResult = await tempSession.archivePreviousSession(
      data.sessions[0].name
    );

    if (archiveResult.success && archiveResult.assignmentData?.length > 0) {
      // Process archived mentees
      for (const mentorData of archiveResult.assignmentData) {
        for (const semesterData of mentorData.assignments) {
          for (const sectionData of semesterData.sections) {
            await AcademicSession.findOneAndUpdate(
              { _id: academicSession._id },
              {
                $push: {
                  "sessions.$[session].semesters.$[semester].sections.$[section].mentees_assigned":
                    {
                      $each: sectionData.mentees_assigned,
                    },
                },
              },
              {
                arrayFilters: [
                  { "session.name": data.sessions[0].name },
                  { "semester.semester_number": semesterData.semester_number },
                  { "section.name": sectionData.name },
                ],
                new: true,
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
      message: "Academic session created successfully",
      data: finalSession,
      archiveStats: archiveResult.success
        ? {
            totalMentees: archiveResult.totalMentees,
            totalMentors: archiveResult.totalMentors,
          }
        : null,
    });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 }
    );
  }
}
