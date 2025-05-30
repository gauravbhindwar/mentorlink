import { connect } from "../../../../../lib/dbConfig";
import { Mentor, Admin } from "../../../../../lib/dbModels";
import { NextResponse } from "next/server";
// Utility function to handle errors
const createErrorResponse = (message, statusCode = 400) => {
  return NextResponse.json({ error: message }, { status: statusCode });
};

// Update POST request handler
export async function POST(req) {
  try {
    await connect();
    const data = await req.json();

    // Check if mentor with email already exists
    const existingMentor = await Mentor.findOne({ email: data.email });
    if (existingMentor) {
      return NextResponse.json({ 
        error: "Mentor with this email already exists",
        existingMentor 
      }, { status: 409 });
    }

    // Generate new MUJid
    const latestMentor = await Mentor.findOne({}).sort({ MUJid: -1 }).select('MUJid');
    let nextMentorId = 1;
    if (latestMentor?.MUJid) {
      const match = latestMentor.MUJid.match(/\d+/);
      if (match) {
        nextMentorId = parseInt(match[0]) + 1;
      }
    }

    // Create new mentor
    const newMentor = new Mentor({
      ...data,
      MUJid: `MUJ${String(nextMentorId).padStart(5, '0')}`,
      isFirstTimeLogin: true,
      created_at: new Date(),
      updated_at: new Date()
    });

    await newMentor.save();

    // If admin role is assigned, create admin record
    if (data.role?.includes('admin') || data.role?.includes('superadmin')) {
      await Admin.create({
        ...data,
        MUJid: newMentor.MUJid,
        role: data.role.filter(r => ['admin', 'superadmin'].includes(r))
      });
    }

    return NextResponse.json({ mentor: newMentor }, { status: 201 });
  } catch (error) {
    console.error("Error creating mentor:", error);
    return NextResponse.json({ 
      error: error.message || "Error creating mentor" 
    }, { status: 500 });
  }
}

// Update GET request to include better filtering
export async function GET(req) {
  try {
    await connect();
    const { searchParams } = new URL(req.url);
    const academicYear = searchParams.get("academicYear");
    const academicSession = searchParams.get("academicSession");
    const searchEmail = searchParams.get("email"); // Get email parameter directly
    // const batchSize = parseInt(searchParams.get("batchSize")) || 50;
    const offset = parseInt(searchParams.get("offset")) || 0;

    // Create base query object
    const query = {};
    if (academicYear) query.academicYear = academicYear;
    if (academicSession) query.academicSession = academicSession;
    
    // If searching by exact email (for duplicate check)
    if (searchEmail) {
      query.email = searchEmail.toLowerCase(); // Exact match, case-insensitive
    }

    // Get total count for pagination
    const totalCount = await Mentor.countDocuments(query);

    // Get mentors with exact match if searching by email
    const mentors = await Mentor.find(query)
      .select('-password -otp -otpExpires -isOtpUsed')
      .skip(offset)
      .sort({ email: 1 });

    if (!mentors || mentors.length === 0) {
      return NextResponse.json({ 
        message: "No mentors found",
        mentors: [],
        total: 0
      }, { status: 200 });
    }

    return NextResponse.json({ 
      mentors,
      total: totalCount
    });
  } catch (error) {
    console.error("Error fetching mentors:", error);
    return NextResponse.json(
      { error: "Error fetching mentors" },
      { status: 500 }
    );
  }
}

// Update the DELETE handler
export async function DELETE(req) {
  try {
    await connect();
    const { MUJid, roles } = await req.json();

    if (!MUJid || !roles || roles.length === 0) {
      return NextResponse.json({ message: "Mentor deleted successfully" });
    }

    // If only removing admin/superadmin roles
    if (roles.includes('admin') || roles.includes('superadmin')) {
      // Remove from Admin collection
      await Admin.deleteOne({ MUJid });
      
      // Update roles in Mentor collection
      await Mentor.updateOne(
        { MUJid },
        { 
          $pull: { role: { $in: roles } },
          $set: { role: remainingRoles }
        }
      );

      return NextResponse.json({ 
        message: "Roles deleted successfully",
        remainingRoles
      });
    }

    return NextResponse.json({ message: "No changes made" });

  } catch (error) {
    console.error("Error deleting:", error);
    return createErrorResponse(error.message || "Failed to delete", 500);
  }
}

// Update PUT request to handle role changes
export async function PUT(req) {
  try {
    await connect();
    const mentorData = await req.json();

    if (!mentorData || !mentorData.MUJid) {
      return createErrorResponse("Invalid mentor data or missing MUJid", 400);
    }

    // First find old mentor to check roles
    const oldMentor = await Mentor.findOne({ MUJid: mentorData.MUJid });
    if (!oldMentor) {
      return createErrorResponse("Mentor not found", 404);
    }

    // Update mentor in Mentor collection
    const updatedMentor = await Mentor.findOneAndUpdate(
      { MUJid: mentorData.MUJid },
      mentorData,
      { new: true }
    );

    // Handle admin roles
    const wasAdmin = oldMentor.role.some(r => ['admin', 'superadmin'].includes(r));
    const isNowAdmin = mentorData.role.some(r => ['admin', 'superadmin'].includes(r));
    const adminRoles = mentorData.role.filter(r => ['admin', 'superadmin'].includes(r));

    if (isNowAdmin) {
      // Check if admin record exists
      const existingAdmin = await Admin.findOne({ MUJid: mentorData.MUJid });
      
      if (existingAdmin) {
        // Update existing admin record with filtered admin roles
        await Admin.findOneAndUpdate(
          { MUJid: mentorData.MUJid },
          { 
            ...mentorData,
            role: adminRoles 
          },
          { new: true }
        );
      } else {
        // Create new admin record
        await Admin.create({
          ...mentorData,
          role: adminRoles
        });
      }
    } else if (wasAdmin && !isNowAdmin) {
      // Remove from Admin collection if admin roles were removed
      await Admin.deleteOne({ MUJid: mentorData.MUJid });
    }

    return NextResponse.json({
      message: "Mentor updated successfully",
      mentor: updatedMentor,
      roleChanges: { wasAdmin, isNowAdmin, adminRolesUpdated: wasAdmin !== isNowAdmin }
    });

  } catch (error) {
    return createErrorResponse(error.message || "Failed to update mentor", 500);
  }
}

// Update PATCH request handler to handle isActive field
export async function PATCH(request) {
  try {
    await connect();
    const data = await request.json();
    const mujid = request.url.split('/').pop();

    // Validate phone number if provided
    if (data.phone_number && !/^\d{10}$/.test(data.phone_number)) {
      return NextResponse.json(
        { error: "Phone number must be 10 digits" },
        { status: 400 }
      );
    }

    // Get current mentor data
    const currentMentor = await Mentor.findOne({ MUJid: mujid });
    if (!currentMentor) {
      return NextResponse.json({ error: "Mentor not found" }, { status: 404 });
    }

    // Update allowed fields including isActive
    const updateFields = {
      ...(data.phone_number && { phone_number: data.phone_number }),
      ...(typeof data.isActive === 'boolean' && { isActive: data.isActive }), // Add this line
      ...(Array.isArray(data.role) && { role: data.role }),
      updated_at: new Date()
    };

    // Update mentor in Mentor collection
    const updatedMentor = await Mentor.findOneAndUpdate(
      { MUJid: mujid },
      { $set: updateFields },
      { new: true }
    );

    // Handle admin roles if they changed
    if (data.role) {
      const wasAdmin = currentMentor.role.some(r => ['admin', 'superadmin'].includes(r));
      const isNowAdmin = data.role.some(r => ['admin', 'superadmin'].includes(r));
      const adminRoles = data.role.filter(r => ['admin', 'superadmin'].includes(r));

      if (isNowAdmin) {
        await Admin.findOneAndUpdate(
          { MUJid: mujid },
          { 
            ...updateFields,
            role: adminRoles,
          },
          { upsert: true, new: true }
        );
      } else if (wasAdmin && !isNowAdmin) {
        await Admin.deleteOne({ MUJid: mujid });
      }
    }

    return NextResponse.json(updatedMentor);
  } catch (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
