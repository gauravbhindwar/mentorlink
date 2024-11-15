import { connect } from "../../../../../lib/dbConfig";
import { Mentee, MentorMenteeRelationship } from "../../../../../lib/dbModels";
import { NextResponse } from "next/server";
import Joi from "joi";
import xlsx from "xlsx";

// Define the Joi schema for validation
const menteeSchema = Joi.object({
  name: Joi.string().required(),
  email: Joi.string().email().required(),
  MUJid: Joi.string().pattern(/^[A-Z0-9]+$/).required(),
  phone_number: Joi.string().pattern(/^\d{10}$/).required(),
  address: Joi.string().optional(),
  dob: Joi.date().required(),
  gender: Joi.string().optional(),
  profile_picture: Joi.string().optional(),
  yearOfRegistration: Joi.number()
    .integer()
    .min(1900)
    .max(new Date().getFullYear())
    .required(),
  parents: Joi.object({
    father: Joi.object({
      name: Joi.string().required(),
      email: Joi.string().email().required(),
      phone: Joi.string().required(),
      alternatePhone: Joi.string().optional()
    }),
    mother: Joi.object({
      name: Joi.string().required(),
      email: Joi.string().email().required(),
      phone: Joi.string().optional(),
      alternatePhone: Joi.string().optional()
    }),
    guardian: Joi.object({
      name: Joi.string().optional(),
      email: Joi.string().email().optional(),
      phone: Joi.string().optional(),
      relation: Joi.string().optional()
    })
  }).required()
});

// Utility function to handle errors
const createErrorResponse = (message, statusCode = 400) => {
  return NextResponse.json({ error: message }, { status: statusCode });
};

// POST request to create new mentees
export async function POST(req) {
  try {
    await connect();
    const requestBody = await req.json().catch(() => null);

    if (!Array.isArray(requestBody)) {
      return createErrorResponse("Request body must be an array of mentees", 400);
    }

    const validationErrors = [];
    const menteesToSave = [];

    for (const menteeData of requestBody) {
      const { error } = menteeSchema.validate(menteeData);
      if (error) {
        validationErrors.push({ MUJid: menteeData.MUJid, error: error.details[0].message });
        continue;
      }

      const existingMentee = await Mentee.findOne({ 
        $or: [{ email: menteeData.email }, { MUJid: menteeData.MUJid }] 
      });
      if (existingMentee) {
        validationErrors.push({ MUJid: menteeData.MUJid, error: "Mentee already exists" });
        continue;
      }

      menteesToSave.push(menteeData);
    }

    if (validationErrors.length > 0) {
      return createErrorResponse(validationErrors, 400);
    }

    try {
      await Mentee.insertMany(menteesToSave);
    } catch (error) {
      console.error("Error saving new mentees:", error);
      return createErrorResponse("Error saving new mentees", 500);
    }

    return NextResponse.json({ message: "Mentees added successfully" }, { status: 201 });
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
    const year = searchParams.get('year');
    const term = searchParams.get('term');
    const semester = searchParams.get('semester');
    const section = searchParams.get('section');
    const mentorMujid = searchParams.get('mentorMujid');

    const filters = {};
    if (year) filters.year = parseInt(year, 10);
    if (term) filters.term = term;
    if (semester) filters.semester = semester;
    if (section) filters.section = section;
    if (mentorMujid) filters.mentorMujid = mentorMujid;

    console.log('Filters applied:', filters);

    const mentees = await Mentee.find(filters);
    console.log('Mentees found:', mentees);
    if (!mentees.length) {
      return createErrorResponse("No mentees found", 404);
    }

    return NextResponse.json(mentees, { status: 200 });
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

// PATCH request to update specific fields of a mentee by MUJid
export async function PATCH(req) {
  try {
    await connect();
    let requestBody;
    try {
      requestBody = await req.json();
    } catch (err) {
      return createErrorResponse("Invalid JSON input", 400);
    }

    const { MUJid, ...updateFields } = requestBody;

    if (!MUJid) {
      return createErrorResponse("MUJid is required", 400);
    }

    // Validate only the fields that are being updated
    const schema = Joi.object(updateFields).unknown(true);
    const { error } = schema.validate(updateFields);
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

    const { MUJid } = requestBody;

    if (!MUJid) {
      return createErrorResponse("MUJid is required", 400);
    }

    const deletedMentee = await Mentee.findOneAndDelete({ MUJid });
    if (!deletedMentee) {
      return createErrorResponse("Mentee not found", 404);
    }

    return NextResponse.json({ message: "Mentee deleted successfully" }, { status: 200 });
  } catch (error) {
    console.error("Server error:", error);
    return createErrorResponse("Something went wrong on the server", 500);
  }
}