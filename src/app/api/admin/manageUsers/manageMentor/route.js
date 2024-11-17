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

// POST request with better error handling
export async function POST(req) {
  try {
    await connect();
    let data = await req.json();
    
    // Handle both single object and array of objects
    const mentorsToCreate = Array.isArray(data) ? data : [data];
    
    // Validate all mentors
    const validationErrors = [];
    mentorsToCreate.forEach((mentor, index) => {
      const { error } = mentorSchema.validate(mentor);
      if (error) validationErrors.push(`Mentor ${index + 1}: ${error.message}`);
    });
    
    if (validationErrors.length > 0) {
      return NextResponse.json({ error: validationErrors }, { status: 400 });
    }

    // Check for duplicates
    const existingMentors = await Mentor.find({
      $or: mentorsToCreate.map(m => ({ 
        $or: [
          { email: m.email }, 
          { MUJid: m.MUJid }
        ]
      }))
    });

    if (existingMentors.length > 0) {
      return NextResponse.json({
        error: "Duplicate entries found for email or MUJid"
      }, { status: 409 });
    }

    const createdMentors = await Mentor.insertMany(mentorsToCreate);
    
    // Handle admin roles
    const adminsToCreate = mentorsToCreate.filter(m => 
      m.role.some(r => ['admin', 'superadmin'].includes(r))
    );
    
    if (adminsToCreate.length > 0) {
      await Admin.insertMany(adminsToCreate);
    }

    return NextResponse.json({ 
      message: "Mentors created successfully",
      mentors: createdMentors 
    }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
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

// PATCH request to partially update a mentor's details
export async function PATCH(req) {
  try {
    await connect().catch((err) => {
      console.error("Database connection failed:", err);
      throw new Error("Database connection failed");
    });
    const requestBody = await req.json().catch(() => null);

    if (!requestBody) {
      return createErrorResponse("Invalid JSON input", 400);
    }

    const { MUJid, ...updateData } = requestBody;

    if (!MUJid) {
      return createErrorResponse("MUJid is required for updating", 400);
    }

    // Partial validation for PATCH, applying defaults only for provided fields
    const schema = mentorSchema.fork(Object.keys(updateData), (schema) =>
      schema.optional()
    );

    const { error } = schema.validate(updateData);
    if (error) {
      return createErrorResponse(error.details[0].message, 400);
    }

    const updatedMentor = await Mentor.findOneAndUpdate(
      { MUJid },
      updateData,
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
    console.error("Error partially updating mentor:", error);
    return createErrorResponse(error.message || "Something went wrong on the server", 500);
  }
}
