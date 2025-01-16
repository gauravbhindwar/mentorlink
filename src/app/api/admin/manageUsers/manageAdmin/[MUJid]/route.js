import { connect } from "@/lib/dbConfig";
import { Admin } from "@/lib/db/adminSchema";
import { NextResponse } from "next/server";

export async function PATCH(req, context) {
  try {
    const params = await Promise.resolve(context.params);
    const MUJid = params.MUJid;
    
    if (!MUJid) {
      return NextResponse.json({
        error: "MUJid parameter is required"
      }, { status: 400 });
    }

    await connect();
    const updateData = await req.json();

    // Check for existing admin first
    const existingAdmin = await Admin.findOne({ MUJid });
    
    if (!existingAdmin) {
      // Check for email duplicate before creating
      const emailExists = await Admin.findOne({ email: updateData.email });
      if (emailExists) {
        return NextResponse.json({
          error: "Email already exists in admin collection"
        }, { status: 409 });
      }
    }

    // Ensure only admin/superadmin roles are included
    const adminRoles = updateData.role.filter(role => 
      ['admin', 'superadmin'].includes(role)
    );

    const updatedAdmin = await Admin.findOneAndUpdate(
      { MUJid },
      { 
        $set: {
          ...updateData,
          role: adminRoles 
        }
      },
      { new: true, upsert: true }
    );

    return NextResponse.json({
      message: "Admin updated successfully",
      admin: updatedAdmin
    }, { status: 200 });

  } catch (error) {
    console.error("Error updating admin:", error);
    return NextResponse.json({
      error: "Error updating admin: " + (error.message || "Unknown error")
    }, { status: 500 });
  }
}
