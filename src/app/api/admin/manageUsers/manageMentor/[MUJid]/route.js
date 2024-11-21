import { connect } from "@/lib/dbConfig";
import { Mentor } from "@/lib/db/mentorSchema";
import { NextResponse } from "next/server";

// Add PATCH method
export async function PATCH(req, { params }) {
  try {
    if (!params?.MUJid) {
      return NextResponse.json({
        error: "MUJid parameter is required"
      }, { status: 400 });
    }

    await connect();
    const updateData = await req.json();

    if (!updateData || Object.keys(updateData).length === 0) {
      return NextResponse.json({
        error: "Update data is required"
      }, { status: 400 });
    }

    // Clean the update data
    const cleanedData = Object.fromEntries(
      Object.entries(updateData).filter(([_, v]) => v != null && v !== '')
    );

    const updatedMentor = await Mentor.findOneAndUpdate(
      { MUJid: params.MUJid },
      { $set: cleanedData },
      { new: true }
    );

    if (!updatedMentor) {
      return NextResponse.json({
        error: "Mentor not found"
      }, { status: 404 });
    }

    return NextResponse.json({
      message: "Mentor updated successfully",
      mentor: updatedMentor
    }, { status: 200 });

  } catch (error) {
    console.error("Error updating mentor:", error);
    return NextResponse.json({
      error: "Error updating mentor: " + (error.message || "Unknown error")
    }, { status: 500 });
  }
}

export async function GET(req, { params }) {
  try {
    if (!params || !params.MUJid) {
      return NextResponse.json(
        { error: "MUJid parameter is required" },
        { status: 400 }
      );
    }

    await connect();
    const { MUJid } = params;

    const mentor = await Mentor.findOne({ MUJid });
    if (!mentor) {
      return NextResponse.json(
        { error: "Mentor not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ mentor }, { status: 200 });
  } catch (error) {
    console.error("Error fetching mentor:", error);
    return NextResponse.json(
      { error: "Error fetching mentor details" },
      { status: 500 }
    );
  }
}