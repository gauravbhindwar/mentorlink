import { connect } from "@/lib/dbConfig";
import { Mentor } from "@/lib/db/mentorSchema";
import { Admin } from "@/lib/db/adminSchema";
import { NextResponse } from "next/server";

export async function PATCH(request) {
  try {
    await connect();
    
    // Get MUJid from URL path instead of params
    const MUJid = request.url.split('/').pop();
    
    if (!MUJid) {
      return NextResponse.json({
        error: "MUJid parameter is required"
      }, { status: 400 });
    }

    const updateData = await request.json();

    // Check for duplicate email first
    if (updateData.email) {
      const existingMentorWithEmail = await Mentor.findOne({ 
        email: updateData.email,
        MUJid: { $ne: MUJid } // Exclude current mentor
      });

      if (existingMentorWithEmail) {
        return NextResponse.json({ 
          error: "Email already exists for another mentor",
          status: 'DUPLICATE_EMAIL'
        }, { status: 409 });
      }
    }

    // Clean the update data and remove immutable fields
    const cleanedData = Object.fromEntries(
      Object.entries(updateData)
        .filter(([value]) => value != null && value !== '')
        .filter(([key]) => !['_id', 'MUJid'].includes(key)) // Exclude immutable fields
    );

    // Get current mentor data to check role changes
    const currentMentor = await Mentor.findOne({ MUJid });
    if (!currentMentor) {
      return NextResponse.json({ error: "Mentor not found" }, { status: 404 });
    }

    // Update mentor
    const updatedMentor = await Mentor.findOneAndUpdate(
      { MUJid },
      { $set: cleanedData },
      { new: true }
    );

    // Handle admin roles if role is being updated
    if (updateData.role) {
      const wasAdmin = currentMentor.role.some(r => ['admin', 'superadmin'].includes(r));
      const isNowAdmin = updateData.role.some(r => ['admin', 'superadmin'].includes(r));
      const adminRoles = updateData.role.filter(r => ['admin', 'superadmin'].includes(r));

      if (isNowAdmin) {
        // Update or create admin record, excluding immutable fields
        const adminData = { ...cleanedData };
        delete adminData._id; // Ensure _id is removed
        
        await Admin.findOneAndUpdate(
          { MUJid },
          { 
            ...adminData,
            role: adminRoles 
          },
          { upsert: true, new: true }
        );
      } else if (wasAdmin && !isNowAdmin) {
        // Remove from Admin collection if admin roles were removed
        await Admin.deleteOne({ MUJid });
      }
    }

    return NextResponse.json({
      success: true,
      message: "Mentor updated successfully",
      mentor: updatedMentor
    });

  } catch (error) {
    console.error("Error updating mentor:", error);
    if (error.code === 11000) {
      return NextResponse.json({ 
        error: "Email already exists for another mentor",
        status: 'DUPLICATE_EMAIL'
      }, { status: 409 });
    }
    return NextResponse.json({
      error: error.message || "Error updating mentor"
    }, { status: 500 });
  }
}

// Update GET handler to use params correctly
export async function GET(request) {
  try {
    // Get MUJid from URL path instead of params
    const MUJid = request.url.split('/').pop();
    
    if (!MUJid) {
      return NextResponse.json(
        { error: "MUJid parameter is required" },
        { status: 400 }
      );
    }

    await connect();

    const mentor = await Mentor.findOne({ MUJid });
    if (!mentor) {
      return NextResponse.json(
        { error: "Mentor not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ mentor });
  } catch (error) {
    console.error("Error fetching mentor:", error);
    return NextResponse.json(
      { error: "Error fetching mentor details" },
      { status: 500 }
    );
  }
}