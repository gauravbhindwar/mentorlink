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
    const { meeting_id, mentor_id, presentMentees, totalMentees } =
      await req.json();

    if (
      !meeting_id ||
      !Array.isArray(presentMentees) ||
      !Array.isArray(totalMentees) ||
      !mentor_id
    ) {
      return NextResponse.json(
        { error: "Invalid request data" },
        { status: 400 }
      );
    }

    // Update present_mentees in Meeting schema
    await Meeting.updateOne(
      { mentor_id: mentor_id },
      { "meetings.meeting_id": meeting_id },
      {
        $set: {
          "meetings.$.present_mentees": presentMentees,
          "meetings.$.isReportFilled": true,
        },
      }
    );

    // Update meetingsAttended for all mentees in totalMentees
    const updatePromises = totalMentees.map(async (mujId) => {
      const updateOperation = presentMentees.includes(mujId)
        ? { $addToSet: { meetingsAttended: meeting_id } } // Add meeting_id if present
        : { $pull: { meetingsAttended: meeting_id } }; // Remove meeting_id if absent

      return Mentee.updateOne({ MUJid: mujId }, updateOperation);
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
