import { connect } from "../../../../../lib/dbConfig";
import { Mentor, Admin } from "../../../../../lib/dbModels";
import { NextResponse } from "next/server";
import Joi from "joi";

// Updated schema with proper validations
const mentorSchema = Joi.object({
  name: Joi.string().required(),
  email: Joi.string().email().required(),
  MUJid: Joi.string().required(),
  phone_number: Joi.string().required(),
  address: Joi.string().allow('', null),
  gender: Joi.string().valid('male', 'female', 'other').allow('', null),
  profile_picture: Joi.string().allow('', null),
  role: Joi.array().items(Joi.string().valid('mentor', 'admin', 'superadmin')).default(['mentor']),
  academicYear: Joi.string()
    .pattern(/^\d{4}-\d{4}$/)
    .custom((value, helpers) => {
      const [startYear, endYear] = value.split('-').map(Number);
      if (endYear !== startYear + 1) {
        return helpers.error('any.invalid');
      }
      return value;
    })
    .allow('', null),
  academicSession: Joi.string()
    .pattern(/^(JULY-DECEMBER|JANUARY-JUNE)\s\d{4}$/)
    .allow('', null)
});

// Utility function to handle errors
const createErrorResponse = (message, statusCode = 400) => {
  return NextResponse.json({ error: message }, { status: statusCode });
};

// Update POST request handler
export async function POST(req) {
  try {
    await connect();
    const mentorData = await req.json();
    
    if (!mentorData || Object.keys(mentorData).length === 0) {
      return NextResponse.json({
        error: "Invalid mentor data provided"
      }, { status: 400 });
    }

    // Check if mentor already exists
    const existingMentor = await Mentor.findOne({ 
      $or: [
        { MUJid: mentorData.MUJid },
        { email: mentorData.email }
      ]
    });

    if (existingMentor) {
      // Safe access to existing mentor data
      const duplicateData = {
        MUJid: existingMentor?.MUJid || '',
        name: existingMentor?.name || '',
        email: existingMentor?.email || '',
        phone_number: existingMentor?.phone_number || '',
        gender: existingMentor?.gender || '',
        role: Array.isArray(existingMentor?.role) ? existingMentor.role : ['mentor'],
        academicYear: existingMentor?.academicYear || '',
        academicSession: existingMentor?.academicSession || ''
      };

      return NextResponse.json({
        error: "Mentor already exists",
        existingMentor: duplicateData,
        duplicateField: mentorData.MUJid === existingMentor.MUJid ? 'MUJid' : 'email'
      }, { status: 409 });
    }

    // Validate mentor data
    const { error } = mentorSchema.validate(mentorData);
    if (error) {
      return NextResponse.json({ 
        error: error.details[0].message 
      }, { status: 400 });
    }

    // Create new mentor
    const newMentor = new Mentor(mentorData);
    const savedMentor = await newMentor.save();

    // Handle admin roles if present
    if (mentorData.role?.includes('admin') || mentorData.role?.includes('superadmin')) {
      await Admin.create(mentorData);
    }

    return NextResponse.json({ 
      message: "Mentor created successfully",
      mentor: savedMentor 
    }, { status: 201 });

  } catch (error) {
    console.error('Error in POST:', error);
    return NextResponse.json({ 
      error: "Failed to create mentor: " + (error.message || "Unknown error")
    }, { status: 500 });
  }
}

// Update GET request to include better filtering
export async function GET(req) {
  try {
    await connect();

    // Get search parameters from URL
    const { searchParams } = new URL(req.url);
    const academicYear = searchParams.get('academicYear');
    const academicSession = searchParams.get('academicSession');
    const MUJid = searchParams.get('MUJid');

    // Build query object
    const query = {};
    if (academicYear) query.academicYear = academicYear;
    if (academicSession) query.academicSession = academicSession;
    if (MUJid) query.MUJid = new RegExp(MUJid, 'i'); // Case-insensitive search for MUJid

    // Fetch mentors based on query
    const mentors = await Mentor.find(query).sort({ created_at: -1 });

    return NextResponse.json({ mentors }, { status: 200 });
  } catch (error) {
    console.error("Error fetching mentors:", error);
    return NextResponse.json(
      { error: "Failed to fetch mentors" },
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
