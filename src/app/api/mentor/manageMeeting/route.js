import { NextResponse } from "next/server";
import { Meeting } from "../../../../lib/db/meetingSchema";
import { Mentee } from "../../../../lib/db/menteeSchema";
import { connect } from "../../../../lib/dbConfig";

export async function GET(request) {
  try {
    await connect();

    const { searchParams } = new URL(request.url);
    const mentorId = searchParams.get("mentorId");
    const academicYear = searchParams.get("academicYear");
    const session = searchParams.get("session");
    const semester = searchParams.get("semester");

    if (!mentorId || !academicYear || !session) {
      return NextResponse.json(
        { error: "Missing required parameters" },
        { status: 400 }
      );
    }

    // Find all mentees for this mentor
    const mentees = await Mentee.find({
      mentorMujid: mentorId,
      academicYear: academicYear,
      academicSession: session,
      ...(semester && { semester: parseInt(semester) })
    });

    // Create base query for meetings
    const query = {
      mentorMUJid: mentorId,
      'academicDetails.academicYear': academicYear,
      'academicDetails.academicSession': session,
    };

    // Find meetings document
    const meetingsDoc = await Meeting.findOne(query);
    
    if (!meetingsDoc) {
      return NextResponse.json({ meetings: [] }, { status: 200 });
    }

    // Filter meetings by semester if provided
    let filteredMeetings = meetingsDoc.meetings;
    if (semester) {
      filteredMeetings = meetingsDoc.meetings.filter(
        meeting => meeting.semester === parseInt(semester)
      );
    }

    // Map meetings with mentee details
    const updatedMeetings = filteredMeetings.map(meeting => {
      const semesterMentees = mentees.filter(mentee => 
        mentee.semester === meeting.semester
      );

      // Update the meeting's mentee_ids in the database
      Meeting.updateOne(
        { 
          'mentorMUJid': mentorId,
          'meetings._id': meeting._id 
        },
        { 
          $set: { 
            'meetings.$.mentee_ids': semesterMentees.map(m => m.MUJid),
            'meetings.$.present_mentees': meeting.present_mentees || []
          } 
        }
      ).exec();

      return {
        meeting: {
          ...meeting.toObject(),
          mentee_ids: semesterMentees.map(m => m.MUJid),
          present_mentees: meeting.present_mentees || []
        },
        semester: meeting.semester,
        sessionName: meetingsDoc.academicDetails.academicSession,
        menteeDetails: semesterMentees
      };
    });

    return NextResponse.json({ meetings: updatedMeetings }, { status: 200 });
  } catch (error) {
    console.error("Error fetching meetings:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
