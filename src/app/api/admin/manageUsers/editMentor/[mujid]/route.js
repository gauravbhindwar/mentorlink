import { connect } from "../../../../../../lib/dbConfig";
import { Mentor, Admin, Mentee } from "../../../../../../lib/dbModels";
import { NextResponse } from "next/server";

export async function PATCH(request) {
  try {
    await connect();
    const url = new URL(request.url);
    const segments = url.pathname.split("/");
    const mujid = segments[segments.length - 1];

    const data = await request.json();
    const { ...updateData } = data;

    if (typeof updateData.role === 'string') {
      updateData.role = [updateData.role];
    }

    // Validate required fields
    if (!mujid) {
      return NextResponse.json({ error: "MUJid is required" }, { status: 400 });
    }

    // Find existing mentor
    const existingMentor = await Mentor.findOne({ MUJid: mujid });
    if (!existingMentor) {
      return NextResponse.json({ error: "Mentor not found" }, { status: 404 });
    }

    // Check email uniqueness if email is being updated
    if (updateData.email && updateData.email !== existingMentor.email) {
      const emailExists = await Mentor.findOne({
        email: updateData.email,
        MUJid: { $ne: mujid } // Exclude current mentor from check
      });

      if (emailExists) {
        return NextResponse.json({
          error: "Email already exists",
          conflictingMentor: {
            name: emailExists.name,
            email: emailExists.email,
            MUJid: emailExists.MUJid
          }
        }, { status: 409 });
      }

      // Update mentee records with new mentor email
      await Mentee.updateMany(
        { mentorMujid: mujid },
        { $set: { mentorEmailid: updateData.email } }
      );
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
    const wasAdmin = existingMentor.role.includes('admin');
    const isNowAdmin = updateData.role.includes('admin');
    const adminRoles = updateData.role.filter(r => ['admin'].includes(r));

    if (isNowAdmin) {
      await Admin.findOneAndUpdate(
        { MUJid: mujid },
        { 
          ...updateFields,
          role: adminRoles 
        },
        { upsert: true, new: true }
      );
    } else if (wasAdmin && !isNowAdmin) {
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
