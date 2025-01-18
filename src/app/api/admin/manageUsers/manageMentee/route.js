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
    .allow(""),
  yearOfRegistration: Joi.number().required(),
  section: Joi.string().required(),
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
      email: Joi.string().email().allow("", null),
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
    // Clean up parent data to ensure empty objects if not provided
    menteeData = {
      ...menteeData,
      parents: {
        father: menteeData.parents?.father || {},
        mother: menteeData.parents?.mother || {},
        guardian: menteeData.parents?.guardian || {},
      },
    };

    // Normalize academic session casing
    if (menteeData.academicSession) {
      menteeData.academicSession = menteeData.academicSession.toUpperCase();
    }

    console.log("API Request:", menteeData?.mentorMujid);
    let mentorMUJid = menteeData.mentorMujid;
    if (!mentorMUJid) {
      return createErrorResponse("Mentor MUJid is required", 400);
    }

    // Check if the mentor exists
    const mentorExists = await Mentor.findOne({ MUJid: mentorMUJid });
    if (!mentorExists) {
      return createErrorResponse(
        "Mentor not found with the provided MUJid",
        404
      );
    }

    // Validate the data against the schema
    const { error, value } = menteeSchema.validate(menteeData, {
      abortEarly: false, // Get all errors, not just the first one
      stripUnknown: true, // Remove unknown fields
    });

    if (error) {
      const errorMessages = error.details.map((detail) => detail.message);
      return createErrorResponse(errorMessages, 400);
    }

    // Check for existing mentee
    const existingMentee = await Mentee.findOne({
      $or: [{ email: menteeData.email }, { MUJid: menteeData.MUJid }],
    });

    if (existingMentee) {
      return createErrorResponse(
        "Mentee already exists with this email or MUJid",
        400
      );
    }

    // Create new mentee using validated data
    const newMentee = new Mentee(value);
    await newMentee.save();

    return NextResponse.json(
      { message: "Mentee added successfully" },
      { status: 201 }
    );
  } catch (error) {
    console.log("Server error:", error);
    return createErrorResponse("Something went wrong on the server", 500);
  }
}

// Modify the GET handler to support batch loading
export async function GET(req) {
  try {
    await connect();
    const { searchParams } = new URL(req.url);
    console.log("API - Received params:", Object.fromEntries(searchParams.entries()));

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
          section: 1,
          semester: 1,
          academicYear: 1,
          academicSession: 1,
          mentorMujid: 1,
          mentorEmailid: '$mentor.email',
          parents: 1
        }
      }
    ]);

    console.log("API - Found mentees count:", mentees.length);
    console.log("API - Sample mentee:", mentees[0]);

    const transformedMentees = mentees.map(mentee => ({
      ...mentee,
      _id: mentee._id.toString(),
      MUJid: mentee.MUJid?.toUpperCase() || '',
      mentorMujid: mentee.mentorMujid?.toUpperCase() || '',
      mentorEmailid: mentee.mentorEmailid || ''
    }));

    console.log("API - Transformed mentees sample:", transformedMentees[0]);
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
      section: Joi.string(),
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
          email: Joi.string().email().allow("", null),
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
    console.log("Server error:", error);
    return createErrorResponse("Something went wrong on the server", 500);
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
    console.log("Server error:", error);
    return createErrorResponse("Something went wrong on the server", 500);
  }
}
