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
    const { searchParams } = new URL(req.url);
    
    // Build query object
    const query = {};
    
    // Add filters
    ['academicYear', 'academicSession', 'role'].forEach(param => {
      const value = searchParams.get(param);
      if (value) {
        if (param === 'role') {
          query[param] = { $in: [value] };
        } else {
          query[param] = value;
        }
      }
    });

    // Handle MUJid search
    const MUJid = searchParams.get('MUJid');
    if (MUJid) {
      query.MUJid = new RegExp(MUJid, 'i');
    }

    const mentors = await Mentor.find(query)
      .select('-password -__v')
      .sort({ createdAt: -1 });

    return NextResponse.json({ 
      mentors,
      total: mentors.length,
      filters: query
    }, { status: 200 });

  } catch (error) {
    return createErrorResponse(error.message || "Failed to fetch mentors", 500);
  }
}

// Update DELETE request handler to handle multiple MUJIDs
export async function DELETE(req) {
  try {
    await connect();
    const requestBody = await req.json();

    if (!requestBody) {
      return createErrorResponse("Invalid JSON input", 400);
    }

    // Check if MUJids is an array or single value
    const MUJids = Array.isArray(requestBody.MUJid) 
      ? requestBody.MUJid 
      : [requestBody.MUJid];

    if (!MUJids.length) {
      return createErrorResponse("No MUJids provided for deletion", 400);
    }

    // Delete multiple mentors
    const deleteResult = await Mentor.deleteMany({ 
      MUJid: { $in: MUJids } 
    });

    if (deleteResult.deletedCount === 0) {
      return createErrorResponse("No mentors found with the provided MUJids", 404);
    }

    // Also remove from Admin collection if they were admins
    await Admin.deleteMany({ 
      MUJid: { $in: MUJids }
    });

    return NextResponse.json({
      message: `Successfully deleted ${deleteResult.deletedCount} mentor(s)`,
      deletedCount: deleteResult.deletedCount
    }, { status: 200 });

  } catch (error) {
    console.error("Error deleting mentors:", error);
    return createErrorResponse(error.message || "Failed to delete mentors", 500);
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

    // Validate updated data
    const { error } = mentorSchema.validate(mentorData);
    if (error) {
      return createErrorResponse(error.details[0].message, 400);
    }

    const oldMentor = await Mentor.findOne({ MUJid: mentorData.MUJid });
    if (!oldMentor) {
      return createErrorResponse("Mentor not found", 404);
    }

    // Update mentor
    const updatedMentor = await Mentor.findOneAndUpdate(
      { MUJid: mentorData.MUJid },
      mentorData,
      { new: true }
    );

    // Handle role changes
    const wasAdmin = oldMentor.role.includes('admin') || oldMentor.role.includes('superadmin');
    const isNowAdmin = mentorData.role.includes('admin') || mentorData.role.includes('superadmin');

    if (!wasAdmin && isNowAdmin) {
      // Add to Admin collection
      await Admin.create(mentorData);
    } else if (wasAdmin && !isNowAdmin) {
      // Remove from Admin collection
      await Admin.deleteOne({ MUJid: mentorData.MUJid });
    } else if (wasAdmin && isNowAdmin) {
      // Update Admin collection
      await Admin.findOneAndUpdate(
        { MUJid: mentorData.MUJid },
        mentorData,
        { upsert: true }
      );
    }

    return NextResponse.json({
      message: "Mentor updated successfully",
      mentor: updatedMentor
    }, { status: 200 });

  } catch (error) {
    return createErrorResponse(error.message || "Failed to update mentor", 500);
  }
}

// Update PATCH request handler
export async function PATCH(request, { params }) {
  try {
    await connect();
    const data = await request.json();
    const mujid = request.url.split('/').pop(); // Get MUJid from URL

    // Remove any MongoDB specific fields if they exist
    const { _id, id, __v, ...updateData } = data;

    const updatedMentor = await Mentor.findOneAndUpdate(
      { MUJid: mujid },
      { $set: updateData },
      { 
        new: true, // Return updated document
        runValidators: true // Run schema validators
      }
    );

    if (!updatedMentor) {
      return NextResponse.json(
        { error: "Mentor not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(updatedMentor);
  } catch (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
