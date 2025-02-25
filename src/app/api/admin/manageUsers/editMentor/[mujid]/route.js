import { connect } from "../../../../../../lib/dbConfig";
import { Mentor, Admin, Mentee } from "../../../../../../lib/dbModels";
import { NextResponse } from "next/server";

export async function PATCH(request) {
  try {
    await connect();
    const url = new URL(request.url);
    const segments = url.pathname.split("/");
    const mujid = segments[segments.length - 1];

    // Validate required fields
    if (!mujid) {
      return NextResponse.json({ error: "MUJid is required" }, { status: 400 });
    }

    // Find existing mentor first
    const existingMentor = await Mentor.findOne({ MUJid: mujid });
    if (!existingMentor) {
      return NextResponse.json({ error: "Mentor not found" }, { status: 404 });
    }

    const data = await request.json();
    
    // Clean update data by removing any _id field
    const { ...cleanData } = data;
    
    // Find all mentors with the same email (case-insensitive)
    const relatedMentors = await Mentor.find({
      email: { $regex: new RegExp(`^${cleanData.email}$`, 'i') }
    });

    // If multiple records found, sync their active status
    if (relatedMentors.length > 1) {
      console.log(`Found ${relatedMentors.length} related mentor records`);
      
      // Update all related mentor records with the same active status
      await Promise.all(relatedMentors.map(mentor => 
        Mentor.findByIdAndUpdate(mentor._id, {
          $set: {
            isActive: Boolean(cleanData.isActive),
            updated_at: new Date()
          }
        })
      ));

      // Also update any admin records for these mentors
      if (cleanData.role?.includes('admin')) {
        await Admin.updateMany(
          { MUJid: { $in: relatedMentors.map(m => m.MUJid) } },
          { 
            $set: { 
              isActive: Boolean(cleanData.isActive),
              updated_at: new Date()
            } 
          }
        );
      }
    }

    // Always ensure isActive is properly set as boolean
    const updateData = {
      ...cleanData,
      isActive: cleanData.hasOwnProperty('isActive') ? Boolean(cleanData.isActive) : existingMentor.isActive,
      updated_at: new Date()
    };

    // Log the values for debugging after we have existingMentor
    // console.log('Update request:', {
    //   mujid,
    //   currentStatus: existingMentor.isActive,
    //   requestedStatus: updateData.isActive,
    //   rawData: data
    // });

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

    // Update mentor in Mentor collection
    const updatedMentor = await Mentor.findOneAndUpdate(
      { MUJid: mujid },
      { $set: updateData },
      { new: true }
    );

    // Handle admin role changes
    if (updateData.role?.includes('admin')) {
      const adminData = {
        ...updateData,
        MUJid: mujid,
      };
      delete adminData._id;

      await Admin.findOneAndUpdate(
        { MUJid: mujid },
        { $set: adminData },
        { upsert: true, new: true }
      );
    } else if (existingMentor.role.includes('admin')) {
      // Remove from Admin collection if admin role was removed
      await Admin.deleteOne({ MUJid: mujid });
    }

    return NextResponse.json({
      mentor: updatedMentor,
      success: true,
      message: "Mentor updated successfully",
      statusUpdate: {
        previous: existingMentor.isActive,
        current: updatedMentor.isActive,
        relatedRecordsUpdated: relatedMentors.length > 1
      }
    });

  } catch (error) {
    console.error("Error updating mentor:", error);
    return NextResponse.json(
      { error: error.message || "Error updating mentor" },
      { status: 500 }
    );
  }
}
