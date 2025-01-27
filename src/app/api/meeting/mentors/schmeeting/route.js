import { NextResponse } from "next/server";
import { connect } from "@/lib/dbConfig";
import { Meeting } from "@/lib/db/meetingSchema";

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

    // Find meetings for this mentor and semester
    const mentorMeetings = await Meeting.findOne({
      mentorMUJid: mentorId,
      'academicDetails.academicYear': year,
      'academicDetails.academicSession': session
    });

    // Get meetings for specific semester
    const semesterMeetings = mentorMeetings?.meetings?.filter(
      meeting => meeting.semester === parseInt(semester)
    ) || [];

    return NextResponse.json({ meetings: semesterMeetings });
  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json({ error: "Failed to fetch meetings" }, { status: 500 });
  }
}

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
    const checkMeeting = mentorMeetings.meetings.find(meeting => meeting.meeting_id === data.meeting_id);
    if (checkMeeting) {
      return NextResponse.json({ success: false, message: "Meeting already exists" }, { status: 400 });
    }
    // Create new meeting data
    const newMeeting = {
      meeting_id: data.meeting_id,
      semester: parseInt(data.semester),
      meeting_date: new Date(data.meeting_date),
      meeting_time: data.meeting_time,
      meeting_notes: {
        TopicOfDiscussion: data.TopicOfDiscussion,
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
    };

    // Add meeting to mentor's meetings array
    await mentorMeetings.addMeeting(newMeeting);

    return NextResponse.json({
      success: true,
      message: "Meeting scheduled successfully",
      meetingId: data.meeting_id
    });

  } catch (error) {
    console.error("Error scheduling meeting:", error);
    return NextResponse.json(
      { success: false, message: "Failed to schedule meeting", error: error.message },
      { status: 500 }
    );
  }
}
