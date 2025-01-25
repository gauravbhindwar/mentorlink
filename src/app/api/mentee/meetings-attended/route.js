import { connect } from "../../../../lib/dbConfig";
import { Mentee } from "../../../../lib/dbModels";
import { Meeting } from "../../../../lib/db/meetingSchema";
import { NextResponse } from "next/server";

export async function PUT(req) {
  try {
    const { MUJid, mentorRemarks } = await req.json();
    await connect();

    const updatedMentee = await Mentee.findOneAndUpdate(
      { MUJid: MUJid },
      { mentorRemarks: mentorRemarks },
      { new: true }
    );

    if (!updatedMentee) {
      return NextResponse.json({ error: "Mentee not found" }, { status: 404 });
    }

    return NextResponse.json(
      { message: "Remarks updated successfully" },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    await connect();
    const { meeting_id, presentMentees, totalMentees } = await req.json();

    if (!meeting_id || !Array.isArray(presentMentees) || !Array.isArray(totalMentees)) {
      return NextResponse.json(
        { error: "Invalid request data" },
        { status: 400 }
      );
    }

    // Update present_mentees in Meeting schema
    await Meeting.updateOne(
      { "meetings.meeting_id": meeting_id },
      { 
        $set: { 
          "meetings.$.present_mentees": presentMentees,
          "meetings.$.isReportFilled": true 
        } 
      }
    );

    // Update meetings_attended count for all mentees
    const updatePromises = totalMentees.map(menteeId => {
      const isPresent = presentMentees.includes(menteeId);
      
      return Mentee.findOneAndUpdate(
        { MUJid: menteeId },
        {
          $inc: { 
            meetingsCount: isPresent ? 1 : 0 
          }
        },
        { new: true }
      );
    });

    await Promise.all(updatePromises);

    return NextResponse.json(
      { message: "Attendance updated successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error updating attendance:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
