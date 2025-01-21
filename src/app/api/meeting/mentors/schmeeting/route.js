import { connect } from "../../../../../lib/dbConfig";
import { AcademicSession } from "../../../../../lib/db/academicSessionSchema";
import { Mentor } from "../../../../../lib/db/mentorSchema";
import { Mentee } from "../../../../../lib/db/menteeSchema";
import { NextResponse } from "next/server";

export async function GET(request) {
  await connect();

  const { searchParams } = new URL(request.url);
  const year = searchParams.get("year");
  const session = searchParams.get("session");
  const semester = searchParams.get("semester");
  const mentor_id = searchParams.get("mentor_id");
  const section = searchParams.get("section");

  if (!year || !session || !semester || !mentor_id) {
    return NextResponse.json(
      { error: "Year, session, semester and mentor_id are required" },
      { status: 400 }
    );
  }

  try {
    const [startYear, endYear] = year.split("-").map(Number);
    console.log("Parsing params:", {
      startYear,
      endYear,
      session,
      semester,
      section,
      mentor_id,
    });

    // First find academic session
    let academicSession;

    if (section) {
      // If section is provided, use the existing query
      academicSession = await AcademicSession.findOne({
        start_year: startYear,
      }).select({
        sessions: {
          $elemMatch: {
            name: session,
            semesters: {
              $elemMatch: {
                semester_number: parseInt(semester),
                sections: {
                  $elemMatch: {
                    name: section,
                    "meetings.mentorMUJid": mentor_id,
                  },
                },
              },
            },
          },
        },
      });
    } else {
      // If no section is provided, search across all sections in the semester
      academicSession = await AcademicSession.findOne({
        start_year: startYear,
      }).select({
        sessions: {
          $elemMatch: {
            name: session,
            semesters: {
              $elemMatch: {
                semester_number: parseInt(semester),
              },
            },
          },
        },
      });
    }

    if (
      !academicSession ||
      !academicSession.sessions ||
      !academicSession.sessions.length
    ) {
      // Check if mentor exists
      const mentorExists = await Mentor.findOne({ MUJid: mentor_id });

      if (!mentorExists) {
        return NextResponse.json(
          {
            error: "Mentor not found",
            meetings: [],
            totalMeetings: 0,
          },
          { status: 404 }
        );
      }

      return NextResponse.json(
        {
          meetings: [],
          totalMeetings: 0,
        },
        { status: 200 }
      );
    }

    // Get the relevant sessions data
    const targetSession = academicSession.sessions[0];
    const targetSemester = targetSession.semesters?.find(
      (s) => s.semester_number === parseInt(semester)
    );
    // console.log("Target semester:", targetSemester.sections[0]);
    // console.log("isSection:", section.trim() !== "");
    // console.log("Section1:", section);
    // console.log("Target section:", typeof section);
    let meetings = [];

    if (section && section.trim() !== "") {
      // If section is provided, get meetings for that specific section
      const targetSection = targetSemester?.sections?.find(
        (s) => s.name === section
      );
      // console.log("Target sections:", targetSection);
      meetings =
        targetSection?.meetings?.filter((m) => m.mentorMUJid === mentor_id) ||
        [];
    } else {
      // If no section is provided, collect meetings from all sections
      meetings =
        targetSemester?.sections?.reduce((allMeetings, section) => {
          const sectionMeetings =
            section.meetings?.filter((m) => m.mentorMUJid === mentor_id) || [];
          return [...allMeetings, ...sectionMeetings];
        }, []) || [];
    }

    return NextResponse.json(
      {
        meetings,
        totalMeetings: meetings.length,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching mentor meetings:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  await connect();

  try {
    const body = await request.json();
    const {
      mentor_id,
      meeting_id,
      TopicOfDiscussion,
      meeting_date,
      meeting_time,
      semester,
      section,
      session,
      year,
      isMeetingOnline,
      venue,
    } = body;

    if (
      !mentor_id ||
      !meeting_id ||
      !TopicOfDiscussion ||
      !meeting_date ||
      !meeting_time ||
      !semester ||
      !session ||
      !year ||
      !venue
    ) {
      return NextResponse.json(
        { error: "All fields except section are required" },
        { status: 400 }
      );
    }

    const mentorExists = await Mentor.findOne({ MUJid: mentor_id });

    if (!mentorExists) {
      return NextResponse.json(
        {
          error: "Mentor not found",
          meetings: [],
          totalMeetings: 0,
        },
        { status: 404 }
      );
    }

    // Get mentees based on whether section is provided or not
    let mentees;
    if (section) {
      mentees = await Mentee.find({
        mentorMujid: mentor_id,
        semester: parseInt(semester),
        academicSession: session,
        academicYear: year,
        section: section,
      });
    } else {
      // Get all mentees for this mentor across all sections
      mentees = await Mentee.find({
        mentorMujid: mentor_id,
        semester: parseInt(semester),
        academicSession: session,
        academicYear: year,
      });
    }

    if (!mentees || mentees.length === 0) {
      return NextResponse.json(
        { error: "No mentees found for given criteria" },
        { status: 404 }
      );
    }

    // Get unique sections from mentees
    const uniqueSections = [
      ...new Set(mentees.map((mentee) => mentee.section)),
    ];
    const mentee_ids = mentees.map((mentee) => mentee.MUJid);

    const [startYear, endYear] = year.split("-").map(Number);

    // Find the academic session
    const academicSession = await AcademicSession.findOne({
      start_year: startYear,
      end_year: endYear,
    });

    if (!academicSession) {
      return NextResponse.json(
        { error: "Academic session not found" },
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
      (s) => s.semester_number === parseInt(semester)
    );
    if (!targetSemester) {
      return NextResponse.json(
        { error: "Semester not found" },
        { status: 404 }
      );
    }

    // Create the new meeting object
    const newMeeting = {
      meeting_id,
      meeting_notes: {
        TopicOfDiscussion,
        isMeetingOnline,
        venue,
      },
      meeting_date,
      meeting_time,
      semester,
      sections: uniqueSections, // Store all sections involved
      session,
      year,
      mentorMUJid: mentor_id,
      mentee_ids,
    };

    // Add the meeting to all involved sections
    for (const sectionName of uniqueSections) {
      const targetSection = targetSemester.sections.find(
        (s) => s.name === sectionName
      );

      if (targetSection) {
        targetSection.meetings.push({
          ...newMeeting,
          section: sectionName, // Add section-specific identifier
        });

        await AcademicSession.findOneAndUpdate(
          { start_year: startYear },
          {
            $set: {
              "sessions.$[session].semesters.$[semester].sections.$[section]":
                targetSection,
            },
          },
          {
            arrayFilters: [
              { "session.name": session },
              { "semester.semester_number": parseInt(semester) },
              { "section.name": sectionName },
            ],
          }
        );
      }
    }

    return NextResponse.json(
      {
        message: "Meeting scheduled successfully",
        sections: uniqueSections,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error adding meeting:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
