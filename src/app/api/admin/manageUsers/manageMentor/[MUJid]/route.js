import { connect } from "@/lib/dbConfig";
import { Mentor } from "@/lib/db/mentorSchema";
import { Admin } from "@/lib/db/adminSchema";
import { NextResponse } from "next/server";

export async function PATCH(req, context) {
  try {
    // Properly await the params
    const params = await Promise.resolve(context.params);
    const MUJid = params.MUJid;
    
    if (!MUJid) {
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
      Object.entries(updateData).filter(([v]) => v != null && v !== '')
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

    // Handle admin roles
    const wasAdmin = currentMentor.role.some(r => ['admin', 'superadmin'].includes(r));
    const isNowAdmin = updateData.role?.some(r => ['admin', 'superadmin'].includes(r));

    if (isNowAdmin) {
      try {
        // First check if admin exists
        const existingAdmin = await Admin.findOne({ MUJid });
        const adminRoles = updateData.role.filter(r => ['admin', 'superadmin'].includes(r));

        if (existingAdmin) {
          // Update existing admin
          await Admin.findOneAndUpdate(
            { MUJid },
            { 
              $set: {
                ...updateData,
                role: adminRoles
              }
            },
            { new: true }
          );
        } else {
          // Check for email duplicate before creating
          const emailExists = await Admin.findOne({ email: updateData.email });
          if (emailExists) {
            return NextResponse.json({
              error: "Email already exists in admin collection"
            }, { status: 409 });
          }
          // Create new admin
          await Admin.create({
            ...updateData,
            role: adminRoles
          });
        }
      } catch (adminError) {
        console.error("Admin update error:", adminError);
        return NextResponse.json({
          error: "Error updating admin record",
          details: adminError.message
        }, { status: 500 });
      }
    } else if (wasAdmin && !isNowAdmin) {
      // Remove from Admin collection if admin roles were removed
      await Admin.deleteOne({ MUJid });
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

export async function GET(req, context) {
  try {
    // Properly await the params
    const params = await Promise.resolve(context.params);
    const MUJid = params.MUJid;
    
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

    return NextResponse.json({ mentor }, { status: 200 });
  } catch (error) {
    console.error("Error fetching mentor:", error);
    return NextResponse.json(
      { error: "Error fetching mentor details" },
      { status: 500 }
    );
  }
}