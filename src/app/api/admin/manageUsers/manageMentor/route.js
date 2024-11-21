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

// GET request with improved filtering
export async function GET(req) {
  try {
    await connect();
    const { searchParams } = new URL(req.url);
    const query = {};
    
    // Add filters only if they exist in searchParams
    ['academicYear', 'academicSession'].forEach(param => {
      const value = searchParams.get(param);
      if (value) query[param] = value.toUpperCase();
    });

    const mentors = await Mentor.find(query);
    return NextResponse.json({ mentors, total: mentors.length }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE request to delete a mentor by MUJid
export async function DELETE(req) {
  try {
    await connect().catch((err) => {
      console.error("Database connection failed:", err);
      throw new Error("Database connection failed");
    });
    const requestBody = await req.json().catch(() => null);

    if (!requestBody) {
      return createErrorResponse("Invalid JSON input", 400);
    }

    const { MUJid } = requestBody;

    if (!MUJid) {
      return createErrorResponse("MUJid is required for deletion", 400);
    }

    const deletedMentor = await Mentor.findOneAndDelete({ MUJid });
    if (!deletedMentor) {
      return createErrorResponse("Mentor not found", 404);
    }

    return NextResponse.json(
      { message: "Mentor deleted successfully", deletedMentor },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting mentor:", error);
    return createErrorResponse(error.message || "Failed to delete mentor", 500);
  }
}

// PUT request to update a mentor's details
export async function PUT(req) {
  try {
    await connect().catch((err) => {
      console.error("Database connection failed:", err);
      throw new Error("Database connection failed");
    });
    const requestBody = await req.json().catch(() => null);

    if (!requestBody) {
      return createErrorResponse("Invalid JSON input", 400);
    }

    const { MUJid } = requestBody;

    if (!MUJid) {
      return createErrorResponse("MUJid is required for updating", 400);
    }

    const { error } = mentorSchema.validate(requestBody);
    if (error) {
      return createErrorResponse(error.details[0].message, 400);
    }

    const updatedMentor = await Mentor.findOneAndUpdate(
      { MUJid },
      requestBody,
      { new: true }
    );

    if (!updatedMentor) {
      return createErrorResponse("Mentor not found", 404);
    }

    return NextResponse.json(
      { message: "Mentor updated successfully", updatedMentor },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error updating mentor:", error);
    return createErrorResponse(error.message || "Something went wrong on the server", 500);
  }
}

// Update PATCH request handler
export async function PATCH(req) {
  try {
    await connect();
    const data = await req.json();
    
    if (!data || !data.MUJid) {
      return NextResponse.json({
        error: "Invalid update data or missing MUJid"
      }, { status: 400 });
    }

    const { MUJid, ...updateData } = data;

    // Remove any undefined, null, or empty values
    const cleanedData = Object.fromEntries(
      Object.entries(updateData).filter(([_, v]) => v != null && v !== '')
    );

    if (Object.keys(cleanedData).length === 0) {
      return NextResponse.json({
        error: "No valid update data provided"
      }, { status: 400 });
    }

    const updatedMentor = await Mentor.findOneAndUpdate(
      { MUJid },
      { $set: cleanedData },
      { new: true }
    );

    if (!updatedMentor) {
      return NextResponse.json({
        error: "Mentor not found"
      }, { status: 404 });
    }

    return NextResponse.json({
      message: "Mentor updated successfully",
      mentor: updatedMentor
    }, { status: 200 });

  } catch (error) {
    console.error('Error in PATCH:', error);
    return NextResponse.json({
      error: "Failed to update mentor: " + (error.message || "Unknown error")
    }, { status: 500 });
  }
}
