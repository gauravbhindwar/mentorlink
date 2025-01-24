import { NextResponse } from "next/server";
import { Meeting } from "@/lib/db/meetingSchema";
import { connect } from "@/lib/dbConfig";

export async function POST(request) {
  try {
    await connect();
    const data = await request.json();

    // Find or create mentor's meetings document
    const mentorMeetings = await Meeting.findOrCreateMentorMeetings(
      data.mentor_id,
      {
        academicYear: data.year,
        academicSession: data.session
      }
    );

    // Add new meeting without sections
    await mentorMeetings.addMeeting({
      meeting_id: data.meeting_id,
      semester: data.semester,
      meeting_date: new Date(data.meeting_date),
      meeting_time: data.meeting_time,
      mentee_ids: data.mentee_ids || [],
      meeting_notes: {
        TopicOfDiscussion: data.TopicOfDiscussion,
        TypeOfInformation: data.TypeOfInformation,
        NotesToStudent: data.NotesToStudent,
        feedbackFromMentee: data.feedbackFromMentee,
        outcome: data.outcome,
        closureRemarks: data.closureRemarks,
        isMeetingOnline: data.isMeetingOnline,
        venue: data.venue
      },
      scheduledAT: {
        scheduleDate: new Date(),
        scheduleTime: new Date().toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: true
        })
      }
    });

    return NextResponse.json({
      success: true,
      message: "Meeting scheduled successfully"
    });
  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to schedule meeting" },
      { status: 500 }
    );
  }
}

export async function GET(request) {
  try {
    await connect();
    
    const { searchParams } = new URL(request.url);
    const mentorId = searchParams.get("mentor_id");
    const semester = searchParams.get("semester");
    const session = searchParams.get("session");
    const year = searchParams.get("year");

    if (!mentorId || !semester || !session || !year) {
      return NextResponse.json({ error: "Missing required parameters" }, { status: 400 });
    }

    // Find meetings without section requirement
    const meetings = await Meeting.find({
      mentorMUJid: mentorId,
      semester: parseInt(semester),
      'academicDetails.academicYear': year,
      'academicDetails.academicSession': session,
    });

    return NextResponse.json({ meetings });
  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch meetings" },
      { status: 500 }
    );
  }
}
