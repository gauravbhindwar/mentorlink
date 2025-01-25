import { NextResponse } from "next/server";
// import { getServerSession } from "next-auth";
// import { authOptions } from "../../../lib/authOptions";
import { Mentor } from "../../../lib/db/mentorSchema";
import { connect } from "../../../lib/dbConfig";

export async function GET(request) {
  try {
    await connect();
    // const session = await getServerSession(authOptions);

    // if (!session) {
    //   return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    // }

    // Get MUJ ID from query parameters
    const { searchParams } = new URL(request.url);
    const MUJId = searchParams.get("MUJId");
    const email = searchParams.get("email");

    // Build query object based on available parameters
    const query = {
      $or: [{ email: email }, ...(MUJId ? [{ MUJid: MUJId }] : [])],
    };

    const mentor = await Mentor.findOne(query);

    if (!mentor) {
      return NextResponse.json({ error: "Mentor not found" }, { status: 404 });
    }

    return NextResponse.json(mentor);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    await connect();
    const updateData = await request.json();

    if (!updateData.email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    // Find and update the mentor document
    const updatedMentor = await Mentor.findOneAndUpdate(
      { email: updateData.email },
      {
        ...updateData,
        updated_at: new Date(),
      },
      { new: true, runValidators: true }
    );

    if (!updatedMentor) {
      return NextResponse.json({ error: "Mentor not found" }, { status: 404 });
    }

    return NextResponse.json(updatedMentor);
  } catch (error) {
    // console.error("Update error:", error);
    return NextResponse.json(
      { error: error.message || "Error updating mentor" },
      { status: 500 }
    );
  }
}
