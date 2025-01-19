import { connect } from "../../../../../../lib/dbConfig";
import { Mentor, Admin } from "../../../../../../lib/dbModels";
import { NextResponse } from "next/server";

export async function PATCH(request, { params }) {
  try {
    await connect();
    const { mujid } = params;
    const data = await request.json();

    // Remove MUJid from update data if present
    const { MUJid, ...updateData } = data;

    // Validate required fields
    if (!mujid) {
      return NextResponse.json({ error: "MUJid is required" }, { status: 400 });
    }

    // Find existing mentor
    const existingMentor = await Mentor.findOne({ MUJid: mujid });
    if (!existingMentor) {
      return NextResponse.json({ error: "Mentor not found" }, { status: 404 });
    }

    // Extract updatable fields (excluding MUJid)
    const updateFields = {
      ...updateData,
      updated_at: new Date()
    };

    // Update mentor in Mentor collection
    const updatedMentor = await Mentor.findOneAndUpdate(
      { MUJid: mujid },
      { $set: updateFields },
      { new: true }
    );

    // Handle admin role changes
    const wasAdmin = existingMentor.role.some(r => ['admin', 'superadmin'].includes(r));
    const isNowAdmin = data.role.some(r => ['admin', 'superadmin'].includes(r));
    const adminRoles = data.role.filter(r => ['admin', 'superadmin'].includes(r));

    if (isNowAdmin) {
      // Update or create admin record
      await Admin.findOneAndUpdate(
        { MUJid: mujid },
        { 
          ...updateFields,
          role: adminRoles 
        },
        { upsert: true, new: true }
      );
    } else if (wasAdmin && !isNowAdmin) {
      // Remove from Admin collection if admin roles were removed
      await Admin.deleteOne({ MUJid: mujid });
    }

    return NextResponse.json({
      mentor: updatedMentor,
      success: true,
      message: "Mentor updated successfully"
    });

  } catch (error) {
    console.error("Error updating mentor:", error);
    return NextResponse.json(
      { error: error.message || "Error updating mentor" },
      { status: 500 }
    );
  }
}
