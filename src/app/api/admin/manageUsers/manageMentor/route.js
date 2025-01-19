import { connect } from "../../../../../lib/dbConfig";
import { Mentor, Admin } from "../../../../../lib/dbModels";
import { NextResponse } from "next/server";
// import Joi from "joi";

// Updated schema with proper validations
// const mentorSchema = Joi.object({
//   name: Joi.string().required(),
//   email: Joi.string().email().required(),
//   MUJid: Joi.string().required(),
//   phone_number: Joi.string().required(),
//   address: Joi.string().allow('', null),
//   gender: Joi.string().valid('male', 'female', 'other').allow('', null),
//   profile_picture: Joi.string().allow('', null),
//   role: Joi.array().items(Joi.string().valid('mentor', 'admin', 'superadmin')).default(['mentor']),
//   academicYear: Joi.string()
//     .pattern(/^\d{4}-\d{4}$/)
//     .custom((value, helpers) => {
//       const [startYear, endYear] = value.split('-').map(Number);
//       if (endYear !== startYear + 1) {
//         return helpers.error('any.invalid');
//       }
//       return value;
//     })
//     .allow('', null),
//   academicSession: Joi.string()
//     .pattern(/^(JULY-DECEMBER|JANUARY-JUNE)\s\d{4}$/)
//     .allow('', null)
// });

// Utility function to handle errors
const createErrorResponse = (message, statusCode = 400) => {
  return NextResponse.json({ error: message }, { status: statusCode });
};

// Update POST request handler
export async function POST(req) {
  try {
    await connect();
    const data = await req.json();

    // Get latest mentor MUJid
    const latestMentor = await Mentor.findOne({})
      .sort({ MUJid: -1 })
      .select('MUJid');

    let nextMentorId = 1;
    if (latestMentor?.MUJid) {
      const match = latestMentor.MUJid.match(/\d+/);
      if (match) {
        nextMentorId = parseInt(match[0]) + 1;
      }
    }

    // Create new mentor with auto-generated MUJid
    const newMentor = new Mentor({
      email: data.email,
      MUJid: `MUJ${String(nextMentorId).padStart(5, '0')}`,
      role: ['mentor'],
      isFirstTimeLogin: true,
      academicYear: data.academicYear || null,
      academicSession: data.academicSession || null,
      created_at: new Date(),
      updated_at: new Date()
    });

    await newMentor.save();

    return NextResponse.json({ mentor: newMentor }, { status: 201 });
  } catch (error) {
    console.error("Error creating mentor:", error);
    return NextResponse.json({ error: "Error creating mentor" }, { status: 500 });
  }
}

// Update GET request to include better filtering
export async function GET(req) {
  try {
    await connect();
    const { searchParams } = new URL(req.url);
    const email = searchParams.get("email");

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const mentor = await Mentor.findOne({ email });
    return NextResponse.json({ mentor });
  } catch (error) {
    return NextResponse.json(
      { error: "Error fetching mentor" },
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
      return createErrorResponse("Invalid input", 400);
    }

    // Find the mentor first
    const mentor = await Mentor.findOne({ MUJid });
    if (!mentor) {
      return createErrorResponse("Mentor not found", 404);
    }

    // If deleting all roles or only mentor role remains, remove completely
    const remainingRoles = mentor.role.filter(role => !roles.includes(role));
    if (remainingRoles.length === 0 || (roles.includes('mentor') && remainingRoles.length === 0)) {
      await Mentor.deleteOne({ MUJid });
      await Admin.deleteOne({ MUJid });
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

// Update PATCH request handler
export async function PATCH(request) {
  try {
    await connect();
    const data = await request.json();
    const mujid = request.url.split('/').pop();

    // Get current mentor data
    const currentMentor = await Mentor.findOne({ MUJid: mujid });
    if (!currentMentor) {
      return NextResponse.json({ error: "Mentor not found" }, { status: 404 });
    }

    // Update mentor in Mentor collection
    const updatedMentor = await Mentor.findOneAndUpdate(
      { MUJid: mujid },
      { $set: data },
      { new: true, runValidators: true }
    );

    // Handle admin roles if they changed
    if (data.role) {
      const wasAdmin = currentMentor.role.some(r => ['admin', 'superadmin'].includes(r));
      const isNowAdmin = data.role.some(r => ['admin', 'superadmin'].includes(r));
      const adminRoles = data.role.filter(r => ['admin', 'superadmin'].includes(r));

      if (isNowAdmin) {
        // Update or create admin record
        await Admin.findOneAndUpdate(
          { MUJid: mujid },
          { 
            ...data,
            role: adminRoles 
          },
          { upsert: true, new: true }
        );
      } else if (wasAdmin && !isNowAdmin) {
        // Remove from Admin collection
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
