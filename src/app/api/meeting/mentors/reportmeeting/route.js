import { AcademicSession } from "@/lib/db/academicSessionSchema";
import { NextResponse } from "next/server";
import { connect } from "../../../../../lib/dbConfig";

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

    const { mentor_id, meeting_id, meeting_notes, presentMentees } =
      await request.json();

    const filteredPresentMentees = presentMentees.filter(
      (mentee) => mentee !== ""
    );
    // Validate required fields (feedback is optional)
    if (
      !meeting_notes.TopicOfDiscussion ||
      !meeting_notes.TypeOfInformation ||
      !meeting_notes.NotesToStudent ||
      !meeting_notes.outcome ||
      !meeting_notes.closureRemarks
    ) {
      return NextResponse.json(
        { error: "Required fields are missing" },
        { status: 400 }
      );
    }

    const academicSession = await AcademicSession.findOneAndUpdate(
      {
        "sessions.semesters.sections.meetings.meeting_id": meeting_id,
        "sessions.semesters.sections.meetings.mentorMUJid": mentor_id,
      },
      {
        $set: {
          "sessions.$[session].semesters.$[semester].sections.$[section].meetings.$[meeting].meeting_notes":
            meeting_notes,
          "sessions.$[session].semesters.$[semester].sections.$[section].meetings.$[meeting].isReportFilled": true,
          "sessions.$[session].semesters.$[semester].sections.$[section].meetings.$[meeting].present_mentees":
            filteredPresentMentees,
        },
      },
      {
        arrayFilters: [
          { "session.semesters.sections.meetings.meeting_id": meeting_id },
          { "semester.sections.meetings.meeting_id": meeting_id },
          { "section.meetings.meeting_id": meeting_id },
          { "meeting.meeting_id": meeting_id },
        ],
        new: true,
      }
    );

    if (!academicSession) {
      return NextResponse.json(
        { error: "Meeting not found or update failed" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { message: "Meeting notes updated successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error updating meeting notes:", error);
    return NextResponse.json(
      { error: "Error updating meeting notes", details: error.message },
      { status: 500 }
    );
  }
}
