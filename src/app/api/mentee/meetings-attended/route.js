import { connect } from "../../../../lib/dbConfig";
import { Mentee } from "../../../../lib/dbModels";
import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    const { meeting_id, presentMentees, totalMentees } = await req.json();
    await connect();

    // console.log("Attendance updated", meeting_id, presentMentees, totalMentees);

    // Add meeting to present mentees
    for (const menteeId of presentMentees) {
      await Mentee.findOneAndUpdate(
        { MUJid: menteeId, meetingsAttended: { $ne: meeting_id } },
        {
          $push: { meetingsAttended: meeting_id },
        }
      );
    }

    // Remove meeting from absent mentees
    const absentMentees = totalMentees.filter(
      (id) => !presentMentees.includes(id)
    );
    for (const menteeId of absentMentees) {
      await Mentee.findOneAndUpdate(
        { MUJid: menteeId },
        {
          $pull: { meetingsAttended: meeting_id },
        }
      );
    }

    return NextResponse.json(
      { message: "Attendance updated successfully" },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

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

export async function GET(request) {
  try {
    await connect();
    const { searchParams } = new URL(request.url);
    const mentor_id = searchParams.get("mentor_id");

    const mentees = await Mentee.find(
      { mentorMujid: mentor_id },
      {
        MUJid: 1,
        name: 1,
        email: 1,
        phone: 1,
        section: 1,
        semester: 1,
        meetingsAttended: 1,
        academicYear: 1,
        academicSession: 1,
        parents: 1,
        mentorRemarks: 1, // Added mentorRemarks to the projection
      }
    );

    const formattedMentees = mentees.map((mentee) => ({
      ...mentee.toObject(),
      meetingsCount: mentee.meetingsAttended?.length || 0,
    }));

    return NextResponse.json(formattedMentees);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
