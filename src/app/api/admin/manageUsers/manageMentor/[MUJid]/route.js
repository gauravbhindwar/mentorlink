import { connect } from "../../../../../../lib/dbConfig";
import { Mentor, Admin } from "../../../../../../lib/dbModels";
import { NextResponse } from "next/server";

// Add PATCH method
export async function PATCH(req, context) {
  try {
    const params = await context.params;
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

    const existingMentor = await Mentor.findOne({ MUJid: params.MUJid });
    const existingAdmin = await Admin.findOne({ MUJid: params.MUJid });

    let updatedUser;
    const isAdminRole = cleanedData.role?.includes('admin') || cleanedData.role?.includes('superadmin');
    const isMentorRole = cleanedData.role?.includes('mentor');

    // Handle role transition
    if (isAdminRole) {
      // Update or create in Admin collection
      updatedUser = await Admin.findOneAndUpdate(
        { MUJid: params.MUJid },
        { $set: cleanedData },
        { new: true, upsert: true }
      );
    }

    if (isMentorRole) {
      // Update or create in Mentor collection
      updatedUser = await Mentor.findOneAndUpdate(
        { MUJid: params.MUJid },
        { $set: cleanedData },
        { new: true, upsert: true }
      );
    }

    // Remove from collections if roles are not present
    if (!isMentorRole && existingMentor) {
      await Mentor.deleteOne({ MUJid: params.MUJid });
    }
    if (!isAdminRole && existingAdmin) {
      await Admin.deleteOne({ MUJid: params.MUJid });
    }

    if (!updatedUser) {
      return NextResponse.json({
        error: "User not found and no role specified for creation"
      }, { status: 404 });
    }

    return NextResponse.json({
      message: "User updated successfully",
      user: updatedUser
    }, { status: 200 });

  } catch (error) {
    console.error("Error updating user:", error);
    return NextResponse.json({
      error: "Error updating user: " + (error.message || "Unknown error")
    }, { status: 500 });
  }
}

export async function GET(req, context) {
  try {
    const params = await context.params;
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