import { connect } from "../../../../../lib/dbConfig";
import { Mentee } from "../../../../../lib/dbModels";
import { NextResponse } from "next/server";
import Joi from "joi";

// Update the schema validation
const menteeSchema = Joi.object({
  name: Joi.string().required(),
  email: Joi.string().email().required(),
  MUJid: Joi.string().pattern(/^[A-Z0-9]+$/).required(),
  phone: Joi.string().pattern(/^\d{10}$/).allow(''),
  yearOfRegistration: Joi.number().required(),
  section: Joi.string().required(),
  semester: Joi.number().min(1).max(8).required(),
  academicYear: Joi.string().required(),
  academicSession: Joi.string().required(),
  mentorMujid: Joi.string().required(),
  parents: Joi.object({
    father: Joi.object({
      name: Joi.string().allow('', null),
      email: Joi.string().email().allow('', null),
      phone: Joi.string().allow('', null),
      alternatePhone: Joi.string().allow('', null)
    }).allow(null),
    mother: Joi.object({
      name: Joi.string().allow('', null),
      email: Joi.string().email().allow('', null),
      phone: Joi.string().allow('', null),
      alternatePhone: Joi.string().allow('', null)
    }).allow(null),
    guardian: Joi.object({
      name: Joi.string().allow('', null),
      email: Joi.string().allow('', null),
      phone: Joi.string().allow('', null),
      relation: Joi.string().allow('', null)
    }).allow(null)
  }).optional().default({})
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
        guardian: menteeData.parents?.guardian || {}
      }
    };

    // Validate the data against the schema
    const { error, value } = menteeSchema.validate(menteeData, {
      abortEarly: false, // Get all errors, not just the first one
      stripUnknown: true // Remove unknown fields
    });

    if (error) {
      const errorMessages = error.details.map(detail => detail.message);
      return createErrorResponse(errorMessages, 400);
    }

    // Check for existing mentee
    const existingMentee = await Mentee.findOne({
      $or: [
        { email: menteeData.email },
        { MUJid: menteeData.MUJid }
      ]
    });

    if (existingMentee) {
      return createErrorResponse("Mentee already exists with this email or MUJid", 400);
    }

    // Create new mentee using validated data
    const newMentee = new Mentee(value);
    await newMentee.save();

    return NextResponse.json({ message: "Mentee added successfully" }, { status: 201 });
  } catch (error) {
    console.error("Server error:", error);
    return createErrorResponse("Something went wrong on the server", 500);
  }
}

// GET request to read mentees based on filters
export async function GET(req) {
  try {
    await connect();
    const { searchParams } = new URL(req.url);
    
    // Required filters
    const academicYear = searchParams.get('academicYear');
    const academicSession = searchParams.get('academicSession');
    const semester = searchParams.get('semester');

    // Optional filters
    const section = searchParams.get('section');

    if (section) {
      // This regex matches a section format with a single uppercase letter followed by an optional digit
      const sectionRegex = /^[A-Z][0-9]?$/;
      if (!sectionRegex.test(section)) {
        return createErrorResponse("Invalid section format", 400);
      }
    }

    if (!academicYear || !academicSession || !semester|| !section) {
      return createErrorResponse("Academic year, session, semester and section are required", 400);
    }

    const filters = {
      academicYear,
      academicSession,
      semester: parseInt(semester, 10),
      section
    };

    console.log('API Filters:', filters);

    const mentees = await Mentee.find(filters);
    
    // Transform the data before sending
    const transformedMentees = mentees.map(mentee => ({
      // _id: mentee._id.toString(),
      MUJid: mentee.MUJid?.toUpperCase() || '',
      mentorMujid: mentee.mentorMujid?.toUpperCase() || '',
      name: mentee.name || '',
      email: mentee.email || '',
      phone: mentee.phone || '',
      semester: mentee.semester || '',
      section: mentee.section || '',
      yearOfRegistration: mentee.yearOfRegistration || '',
      phone: mentee.phone || '',
      email: mentee.email || '',
      alternatePhone: mentee.alternatePhone || '',
      parents: {
        father: {
          name: mentee.parents?.father?.name || '',
          email: mentee.parents?.father?.email || '',
          phone: mentee.parents?.father?.phone || '',
          alternatePhone: mentee.parents?.father?.alternatePhone || ''
        },
        mother: {
          name: mentee.parents?.mother?.name || '',
          email: mentee.parents?.mother?.email || '',
          phone: mentee.parents?.mother?.phone || '',
          alternatePhone: mentee.parents?.mother?.alternatePhone || ''
        },
        guardian: {
          name: mentee.parents?.guardian?.name || '',
          email: mentee.parents?.guardian?.email || '',
          phone: mentee.parents?.guardian?.phone || '',
          relation: mentee.parents?.guardian?.relation || ''
        }
        }
    }));

    console.log('API Response:', transformedMentees);

    if (!transformedMentees.length) {
      return createErrorResponse("No mentees found", 404);
    }

    return NextResponse.json(transformedMentees, { status: 200 });
  } catch (error) {
    console.error("Server error:", error);
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

    return NextResponse.json({ message: "Mentee updated successfully" }, { status: 200 });
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
      phone: Joi.string().pattern(/^\d{10}$/).allow(''),
      yearOfRegistration: Joi.number(),
      section: Joi.string(),
      semester: Joi.number().min(1).max(8),
      academicYear: Joi.string().required(),  // Make these required to prevent removal
      academicSession: Joi.string().required(), // Make these required to prevent removal
      mentorMujid: Joi.string(),
      parents: Joi.object({
        father: Joi.object({
          name: Joi.string().allow('', null),
          email: Joi.string().email().allow('', null),
          phone: Joi.string().allow('', null),
          alternatePhone: Joi.string().allow('', null)
        }),
        mother: Joi.object({
          name: Joi.string().allow('', null),
          email: Joi.string().email().allow('', null),
          phone: Joi.string().allow('', null),
          alternatePhone: Joi.string().allow('', null)
        }),
        guardian: Joi.object({
          name: Joi.string().allow('', null),
          email: Joi.string().allow('', null),
          phone: Joi.string().allow('', null),
          relation: Joi.string().allow('', null)
        })
      })
    }).unknown(true);

    // Merge existing data with update fields to ensure required fields are present
    const mergedData = {
      ...existingMentee.toObject(),
      ...updateFields
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
          updated_at: new Date() // Add timestamp for update
        }
      },
      { 
        new: true,
        runValidators: true // Ensure mongoose validators run
      }
    );

    if (!updatedMentee) {
      return createErrorResponse("Error updating mentee", 500);
    }

    return NextResponse.json(updatedMentee, { status: 200 });
  } catch (error) {
    console.error("Server error:", error);
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
      MUJid: { $in: MUJids.map(id => id.trim().toUpperCase()) } 
    });

    if (result.deletedCount === 0) {
      return createErrorResponse("No mentees found with the provided MUJids", 404);
    }

    return NextResponse.json({ 
      message: `Successfully deleted ${result.deletedCount} mentee(s)`,
      deletedCount: result.deletedCount 
    }, { status: 200 });
  } catch (error) {
    console.error("Server error:", error);
    return createErrorResponse("Something went wrong on the server", 500);
  }
}