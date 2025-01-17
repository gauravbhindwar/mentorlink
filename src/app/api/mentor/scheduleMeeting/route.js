import { NextResponse } from "next/server";
// import { AcademicSession } from "@/lib/db/academicSessionSchema";
import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri);

export async function POST(request) {
  try {
    const data = await request.json();

    // Connect to the database
    await client.connect();
    const database = client.db("mentorlink");
    const academicSessions = database.collection("academicsessions");

    // Find the appropriate session, semester, and section
    const session = await academicSessions.findOne({
      start_year: data.year.split("-")[0],
      end_year: data.year.split("-")[1],
      "sessions.name": data.session,
      "sessions.semesters.semester_number": data.semester,
      "sessions.semesters.sections.name": data.section,
    });

    if (!session) {
      throw new Error("Session, semester, or section not found");
    }

    // Add the meeting to the appropriate section
    const result = await academicSessions.updateOne(
      {
        start_year: data.year.split("-")[0],
        end_year: data.year.split("-")[1],
        "sessions.name": data.session,
        "sessions.semesters.semester_number": data.semester,
        "sessions.semesters.sections.name": data.section,
      },
      {
        $push: {
          "sessions.$[session].semesters.$[semester].sections.$[section].meetings":
            {
              meeting_id: data.meeting_id,
              mentor_id: data.mentor_id,
              mentee_ids: data.mentee_ids || [],
              meeting_date: new Date(data.meeting_date),
              meeting_time: data.meeting_time,
              meeting_notes: {
                TopicOfDiscussion: data.TopicOfDiscussion,
                TypeOfInformation: data.TypeOfInformation,
                NotesToStudent: data.NotesToStudent,
                feedbackFromMentee: data.feedbackFromMentee,
                outcome: data.outcome,
                closureRemarks: data.closureRemarks,
              },
              scheduledAT: {
                scheduleDate: new Date(),
                scheduleTime: new Date()
                  .toLocaleTimeString("en-US", {
                    hour: "2-digit",
                    minute: "2-digit",
                    hour12: true,
                  })
                  .toUpperCase(),
              },
              created_at: new Date(),
              updated_at: new Date(),
            },
        },
      },
      {
        arrayFilters: [
          { "session.name": data.session },
          { "semester.semester_number": data.semester },
          { "section.name": data.section },
        ],
      }
    );

    if (result.modifiedCount === 0) {
      throw new Error("Failed to add meeting");
    }

    return NextResponse.json({
      success: true,
      message: "Meeting scheduled successfully",
    });
  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to schedule meeting" },
      { status: 500 }
    );
  } finally {
    await client.close();
  }
}
