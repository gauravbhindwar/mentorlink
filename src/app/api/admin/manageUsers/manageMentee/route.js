import { connect } from "../../../../../lib/dbConfig";
import { Mentee } from "../../../../../lib/dbModels";
import { Mentor } from "../../../../../lib/dbModels";
import { NextResponse } from "next/server";
import Joi from "joi";

// Update the schema validation to enforce consistent casing
const menteeSchema = Joi.object({
  name: Joi.string().required(),
  email: Joi.string().email().required(),
  MUJid: Joi.string()
    .pattern(/^[A-Z0-9]+$/)
    .required(),
  phone: Joi.string()
    .pattern(/^\d{10}$/)
    .allow("", null)
    .optional(),
  yearOfRegistration: Joi.number().required(),
  semester: Joi.number().min(1).max(8).required(),
  academicYear: Joi.string()
    .custom((value, helpers) => {
      // Normalize academic year format (e.g., "2023-2024")
      if (!/^\d{4}-\d{4}$/.test(value)) {
        return helpers.error('string.academicYear');
      }
      return value;
    })
    .required()
    .messages({
      'string.academicYear': 'Academic year must be in format YYYY-YYYY'
    }),
  academicSession: Joi.string()
    .custom((value, helpers) => {
      // Normalize academic session format (e.g., "JULY-DECEMBER 2023" or "JANUARY-JUNE 2024")
      const normalized = value.toUpperCase();
      if (!/^(JULY-DECEMBER \d{4}|JANUARY-JUNE \d{4})$/.test(normalized)) {
        return helpers.error('string.academicSession');
      }
      return normalized;
    })
    .required()
    .messages({
      'string.academicSession': 'Academic session must be in format "JULY-DECEMBER YYYY" or "JANUARY-JUNE YYYY"'
    }),
  mentorMujid: Joi.string().required(),
  parents: Joi.object({
    father: Joi.object({
      name: Joi.string().allow("", null),
      email: Joi.string().email().allow("", null),
      phone: Joi.string().allow("", null),
      alternatePhone: Joi.string().allow("", null),
    }).allow(null),
    mother: Joi.object({
      name: Joi.string().allow("", null),
      email: Joi.string().email().allow("", null),
      phone: Joi.string().allow("", null),
      alternatePhone: Joi.string().allow("", null),
    }).allow(null),
    guardian: Joi.object({
      name: Joi.string().allow("", null),
      email: Joi.string().allow("", null),
      phone: Joi.string().allow("", null),
      relation: Joi.string().allow("", null),
    }).allow(null),
  })
    .optional()
    .default({}),
}).unknown(true);

// Utility function to handle errors
const createErrorResponse = (message, statusCode = 400) => {
  return NextResponse.json({ error: message }, { status: statusCode });
};

// Update POST handler to clean data before validation
export async function POST(req) {
  try {
    await connect();
    let menteeData = await req.json();
    
    // Clean phone data
    if (menteeData.phone === "") {
      menteeData.phone = null;
    }

    // Normalize and clean data
    menteeData = {
      ...menteeData,
      MUJid: menteeData.MUJid?.toUpperCase(),
      mentorMujid: menteeData.mentorMujid?.toUpperCase(),
      academicSession: menteeData.academicSession?.toUpperCase(),
      phone: menteeData.phone || null, // Ensure phone is null if empty/undefined
      parents: menteeData.parents || {
        father: { name: null, email: null, phone: null, alternatePhone: null },
        mother: { name: null, email: null, phone: null, alternatePhone: null },
        guardian: { name: null, email: null, phone: null, relation: null }
      }
    };

    // Check for required mentor fields first
    if (!menteeData.mentorMujid) {
      return createErrorResponse("Mentor MUJid is required", 400);
    }

    // Check if the mentor exists before other validations
    const mentorExists = await Mentor.findOne({ MUJid: menteeData.mentorMujid });
    if (!mentorExists) {
      return createErrorResponse(`Mentor not found with MUJid: ${menteeData.mentorMujid}`, 404);
    }

    // Set mentorEmailid from found mentor
    menteeData.mentorEmailid = mentorExists.email;

    // Validate other required fields
    const requiredFields = ['MUJid', 'name', 'email', 'yearOfRegistration', 'semester', 'academicYear', 'academicSession'];
    const missingFields = requiredFields.filter(field => !menteeData[field]);
    
    if (missingFields.length > 0) {
      return createErrorResponse(`Missing required fields: ${missingFields.join(', ')}`, 400);
    }

    // Check for existing mentee
    const existingMentee = await Mentee.findOne({
      $or: [
        { MUJid: menteeData.MUJid },
        { email: menteeData.email }
      ]
    });

    if (existingMentee) {
      const field = existingMentee.MUJid === menteeData.MUJid ? 'MUJid' : 'email';
      return createErrorResponse(`Mentee already exists with this ${field}`, 409);
    }

    // Create new mentee
    const newMentee = new Mentee({
      ...menteeData,
      created_at: new Date(),
      updated_at: new Date()
    });

    await newMentee.save();

    return NextResponse.json(
      { 
        message: "Mentee added successfully",
        mentee: newMentee
      },
      { status: 201 }
    );

  } catch (error) {
    console.error("Server error:", error);
    return createErrorResponse(
      error.name === 'ValidationError' 
        ? error.message 
        : error.code === 11000 
          ? "A mentee with this MUJid or email already exists"
          : "Error creating mentee: " + error.message,
      500
    );
  }
}

// Modify the GET handler to support batch loading
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const academicYear = searchParams.get("academicYear")?.trim();
    const academicSession = searchParams.get("academicSession")?.trim();

    // Return early if either parameter is missing or empty
    if (!academicYear || !academicSession) {
      return NextResponse.json({ error: "Both academicYear and academicSession are required" }, { status: 400 });
    }
    // console.log("API - Received params:", Object.fromEntries(searchParams.entries()));

    await connect();
    // console.log("API - Received params:", Object.fromEntries(searchParams.entries()));

    let filters = {};

    // Required filters with normalized casing
    if (!searchParams.get("academicYear") || !searchParams.get("academicSession")) {
      return NextResponse.json([], { status: 200 }); // Return empty array instead of error
    }

    filters.academicYear = searchParams.get("academicYear").trim();
    filters.academicSession = searchParams.get("academicSession").trim().toUpperCase();

    // Find mentees and populate mentor data
    const mentees = await Mentee.aggregate([
      { $match: filters },
      {
        $lookup: {
          from: 'mentors',
          localField: 'mentorMujid',
          foreignField: 'MUJid',
          as: 'mentor'
        }
      },
      { $unwind: { path: '$mentor', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          _id: 1,
          name: 1,
          email: 1,
          MUJid: 1,
          phone: 1,
          yearOfRegistration: 1,
          semester: 1,
          academicYear: 1,
          academicSession: 1,
          mentorMujid: 1,
          mentorEmailid: '$mentor.email',
          parents: 1
        }
      }
    ]);

    // console.log("API - Found mentees count:", mentees.length);
    // console.log("API - Sample mentee:", mentees[0]);

    const transformedMentees = mentees.map(mentee => ({
      ...mentee,
      _id: mentee._id.toString(),
      MUJid: mentee.MUJid?.toUpperCase() || '',
      mentorMujid: mentee.mentorMujid?.toUpperCase() || '',
      mentorEmailid: mentee.mentorEmailid || ''
    }));

    // console.log("API - Transformed mentees sample:", transformedMentees[0]);
    return NextResponse.json(transformedMentees, { status: 200 });

  } catch (error) {
    console.error("API Error:", error);
    return createErrorResponse("Something went wrong on the server", 500);
  }
}

// PUT request to update a mentee by MUJid
export async function PUT(req) {
  try {
    await connect();
    let requestBody;
    try {
      requestBody = await req.json();
    } catch {
      return createErrorResponse("Invalid JSON input", 400);
    }

    const { MUJid, ...updateFields } = requestBody;

    // Normalize academic session casing
    if (requestBody.academicSession) {
      requestBody.academicSession = requestBody.academicSession.toUpperCase();
    }

    if (!MUJid) {
      return createErrorResponse("MUJid is required", 400);
    }

    const { error } = menteeSchema.validate({ ...updateFields, MUJid });
    if (error) {
      return createErrorResponse(error.details[0].message, 400);
    }

    const updatedMentee = await Mentee.findOneAndUpdate(
      { MUJid },
      { $set: updateFields },
      { new: true }
    );

    if (!updatedMentee) {
      return createErrorResponse("Mentee not found", 404);
    }

    return NextResponse.json(
      { message: "Mentee updated successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Server error:", error);
    return createErrorResponse("Something went wrong on the server", 500);
  }
}

// Update PATCH handler to preserve academic fields and validate properly
export async function PATCH(req) {
  try {
    await connect();
    let requestBody;
    try {
      requestBody = await req.json();
    } catch {
      return createErrorResponse("Invalid JSON input", 400);
    }

    const { MUJid, ...updateFields } = requestBody;

    // Normalize academic session casing
    if (requestBody.academicSession) {
      requestBody.academicSession = requestBody.academicSession.toUpperCase();
    }

    if (!MUJid) {
      return createErrorResponse("MUJid is required", 400);
    }

    // First, get the existing mentee data
    const existingMentee = await Mentee.findOne({ MUJid });
    if (!existingMentee) {
      return createErrorResponse("Mentee not found", 404);
    }

    // Create a schema for the fields being updated
    const updateSchema = Joi.object({
      name: Joi.string(),
      email: Joi.string().email(),
      phone: Joi.string()
        .pattern(/^\d{10}$/)
        .allow(""),
      yearOfRegistration: Joi.number(),
      semester: Joi.number().min(1).max(8),
      academicYear: Joi.string().required(), // Make these required to prevent removal
      academicSession: Joi.string().required(), // Make these required to prevent removal
      mentorMujid: Joi.string(),
      parents: Joi.object({
        father: Joi.object({
          name: Joi.string().allow("", null),
          email: Joi.string().email().allow("", null),
          phone: Joi.string().allow("", null),
          alternatePhone: Joi.string().allow("", null),
        }),
        mother: Joi.object({
          name: Joi.string().allow("", null),
          email: Joi.string().email().allow("", null),
          phone: Joi.string().allow("", null),
          alternatePhone: Joi.string().allow("", null),
        }),
        guardian: Joi.object({
          name: Joi.string().allow("", null),
          email: Joi.string().allow("", null),
          phone: Joi.string().allow("", null),
          relation: Joi.string().allow("", null),
        }),
      }),
    }).unknown(true);

    // Merge existing data with update fields to ensure required fields are present
    const mergedData = {
      ...existingMentee.toObject(),
      ...updateFields,
    };

    // Validate the merged data
    const { error } = updateSchema.validate(mergedData);
    if (error) {
      return createErrorResponse(error.details[0].message, 400);
    }

    // Update with merged and validated data
    const updatedMentee = await Mentee.findOneAndUpdate(
      { MUJid },
      {
        $set: {
          ...updateFields,
          updated_at: new Date(), // Add timestamp for update
        },
      },
      {
        new: true,
        runValidators: true, // Ensure mongoose validators run
      }
    );

    if (!updatedMentee) {
      return createErrorResponse("Error updating mentee", 500);
    }

    return NextResponse.json(updatedMentee, { status: 200 });
  } catch (error) {
    return createErrorResponse(error.message || "Something went wrong on the server", 500);
  }
}

// DELETE request to delete a mentee by MUJid
export async function DELETE(req) {
  try {
    await connect();
    let requestBody;
    try {
      requestBody = await req.json();
    } catch {
      return createErrorResponse("Invalid JSON input", 400);
    }

    const { MUJids } = requestBody; // Changed from single MUJid to array of MUJids

    if (!MUJids || !Array.isArray(MUJids) || MUJids.length === 0) {
      return createErrorResponse("At least one MUJid is required", 400);
    }

    // Delete multiple mentees
    const result = await Mentee.deleteMany({
      MUJid: { $in: MUJids.map((id) => id.trim().toUpperCase()) },
    });

    if (result.deletedCount === 0) {
      return createErrorResponse(
        "No mentees found with the provided MUJids",
        404
      );
    }

    return NextResponse.json(
      {
        message: `Successfully deleted ${result.deletedCount} mentee(s)`,
        deletedCount: result.deletedCount,
      },
      { status: 200 }
    );
  } catch (error) {
    // console.log("Server error:", error);
    return createErrorResponse(error.message || "Something went wrong on the server", 500);
  }
}
