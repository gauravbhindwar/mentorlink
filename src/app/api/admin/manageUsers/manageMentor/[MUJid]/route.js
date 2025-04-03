import { connect } from "@/lib/dbConfig";
import { Mentor } from "@/lib/db/mentorSchema";
import { NextResponse } from "next/server";

export async function PATCH(request) {
  try {
    await connect();
    
    // Get mujid from URL path
    const mujid = request.url.split('/').pop();
    
    if (!mujid) {
      return NextResponse.json({
        error: "MUJid parameter is required"
      }, { status: 400 });
    }

    const updateData = await request.json();

    // Get current mentor data
    const currentMentor = await Mentor.findOne({ MUJid: mujid });
    if (!currentMentor) {
      return NextResponse.json({ error: "Mentor not found" }, { status: 404 });
    }

  

    // Check for duplicate email only if email is being changed
    if (updateData.email && updateData.email !== currentMentor.email) {
      const existingMentorWithEmail = await Mentor.findOne({ 
        email: updateData.email,
        MUJid: { $ne: mujid } // Exclude current mentor
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
        .filter(([, value]) => value != null && value !== '')
        .filter(([key]) => !['_id', 'MUJid'].includes(key)) // Exclude immutable fields
    );

    // Ensure isActive is always a boolean
    if ('isActive' in cleanedData) {
      cleanedData.isActive = Boolean(cleanedData.isActive);
    }
    
    // Update mentor - no Admin collection interaction
    const updatedMentor = await Mentor.findOneAndUpdate(
      { MUJid: mujid },
      { $set: cleanedData },
      { new: true }
    );

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

// If there was a GET handler for this endpoint, include it here
export async function GET(request) {
  try {
    // Get mujid from URL path
    const mujid = request.url.split('/').pop();
    
    if (!mujid) {
      return NextResponse.json(
        { error: "MUJid parameter is required" },
        { status: 400 }
      );
    }

    await connect();

    const mentor = await Mentor.findOne({ MUJid: mujid });
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
