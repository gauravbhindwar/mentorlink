import { NextResponse } from "next/server";
import { connect } from "@/lib/dbConfig";
import { Meeting } from "@/lib/db/meetingSchema";
export async function GET(request) {
  try {
    await connect();

    const url = new URL(request.url);
    const mentor_id = url.searchParams.get("mentor_id");
    const semester = url.searchParams.get("semester");
    const section = url.searchParams.get("section");
    const session = url.searchParams.get("session");
    const year = url.searchParams.get("year");

    if (!mentor_id || !semester || !year) {
      return NextResponse.json(
        { error: "Missing required query parameters" },
        { status: 400 }
      );
    }

    const startYear = parseInt(year.split("-")[0]);
    const endYear = parseInt(year.split("-")[1]);

    if (isNaN(startYear) || isNaN(endYear)) {
      throw new Error("Invalid year format");
    }

    let query = {
      start_year: startYear,
      end_year: endYear,
      "sessions.name": session,
      "sessions.semesters.semester_number": parseInt(semester),
      "sessions.semesters.sections.meetings.mentorMUJid": mentor_id,
    };

    if (section) {
      query["sessions.semesters.sections.name"] = section;
    }

    const academicSession = await AcademicSession.findOne(query);

    if (!academicSession) {
      return NextResponse.json(
        { error: "No meetings found2" },
        { status: 404 }
      );
    }

    const targetSession = academicSession.sessions.find(
      (s) => s.name === session
    );
    if (!targetSession) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    const targetSemester = targetSession.semesters.find(
      (sem) => sem.semester_number === parseInt(semester)
    );
    if (!targetSemester) {
      return NextResponse.json(
        { error: "Semester not found" },
        { status: 404 }
      );
    }

    let meetings = [];
    if (section) {
      // If section is provided, get meetings for that specific section
      const targetSection = targetSemester.sections.find(
        (sec) => sec.name === section
      );
      if (!targetSection) {
        return NextResponse.json(
          { error: "Section not found" },
          { status: 404 }
        );
      }
      meetings = targetSection.meetings.filter(
        (meeting) => meeting.mentorMUJid === mentor_id
      );
    } else {
      // If no section is provided, get all meetings from all sections
      targetSemester.sections.forEach((section) => {
        const sectionMeetings = section.meetings.filter(
          (meeting) => meeting.mentorMUJid === mentor_id
        );
        meetings = meetings.concat(sectionMeetings);
      });
    }

    if (!meetings.length) {
      return NextResponse.json({ error: "No meetings found" }, { status: 400 });
    }

    return NextResponse.json({ meetings }, { status: 200 });
  } catch (error) {
    console.error("Error fetching meetings:", error);
    return NextResponse.json(
      { error: "Error fetching meetings", details: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    await connect();
    
    const { mentor_id, meeting_id, meeting_notes, presentMentees } = await request.json();

    // Find the meeting document and update the specific meeting
    const updatedMeeting = await Meeting.findOneAndUpdate(
      {
        mentorMUJid: mentor_id,
        'meetings.meeting_id': meeting_id
      },
      {
        $set: {
          'meetings.$.meeting_notes': meeting_notes,
          'meetings.$.present_mentees': presentMentees,
          'meetings.$.isReportFilled': true
        }
      },
      { new: true }
    );

    if (!updatedMeeting) {
      return NextResponse.json(
        { error: "Meeting not found" },
        { status: 404 }
      );
    }

    // Get the updated meeting details
    const updatedMeetingDetails = updatedMeeting.meetings.find(
      m => m.meeting_id === meeting_id
    );

    return NextResponse.json(
      { message: "Meeting notes updated successfully", meeting: updatedMeetingDetails },
      { status: 200 }
    );

  } catch (error) {
    console.error("Error updating meeting notes:", error);
    return NextResponse.json(
      { error: "Failed to update meeting notes" },
      { status: 500 }
    );
  }
}
