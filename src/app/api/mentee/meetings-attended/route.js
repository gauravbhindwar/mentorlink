import { connect } from "../../../../lib/dbConfig";
import { Mentee } from "../../../../lib/dbModels";
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
