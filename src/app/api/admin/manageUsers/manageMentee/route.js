import { connect } from "../../../../../lib/dbConfig";
import { Mentee, Mentor, year } from "../../../../../lib/dbModels";
import { NextResponse } from "next/server";
import Joi from "joi";

// Define the Joi schema for validation
const menteeSchema = Joi.object({
  mujid: Joi.string().alphanum().required(),
  yearOfRegistration: Joi.number()
    .integer()
    .min(1900)
    .max(new Date().getFullYear())
    .required(),
  year: Joi.number().integer().min(1900).max(new Date().getFullYear()).required(),
  term: Joi.string().valid("odd", "even").required(),
  semester: Joi.number().integer().min(1).max(8).required(),
  section: Joi.string().required(),
  name: Joi.string().regex(/^[a-zA-Z\s]+$/).required(),
  email: Joi.string().email().required(),
  phone: Joi.string().required(),
  fatherName: Joi.string().regex(/^[a-zA-Z\s]+$/).required(),
  motherName: Joi.string().regex(/^[a-zA-Z\s]+$/).required(),
  dateOfBirth: Joi.string().regex(/^\d{2}-\d{2}-\d{4}$/).required(),
  parentsPhone: Joi.string().required(),
  parentsEmail: Joi.string().email().required(),
  mentorMujid: Joi.string().alphanum().required(),
});

// Utility function to handle errors
const createErrorResponse = (message, statusCode = 400) => {
  return NextResponse.json({ error: message }, { status: statusCode });
};

// POST request to create new mentees
export async function POST(req) {
  try {
    await connect();
    let requestBody;
    try {
      requestBody = await req.json();
    } catch (err) {
      return createErrorResponse("Invalid JSON input", 400);
    }

    if (!Array.isArray(requestBody)) {
      return createErrorResponse("Request body must be an array of mentees", 400);
    }

    const validationErrors = [];
    const menteesToSave = [];

    for (const menteeData of requestBody) {
      const {
        mujid,
        yearOfRegistration,
        year,
        term,
        semester,
        section,
        name,
        email,
        phone,
        fatherName,
        motherName,
        dateOfBirth,
        parentsPhone,
        parentsEmail,
        mentorMujid
      } = menteeData;

      const { error } = menteeSchema.validate({
        mujid,
        yearOfRegistration,
        year,
        term,
        semester,
        section,
        name,
        email,
        phone,
        fatherName,
        motherName,
        dateOfBirth,
        parentsPhone,
        parentsEmail,
        mentorMujid
      });

      if (error) {
        validationErrors.push({ mujid, error: error.details[0].message });
        continue;
      }

      // Check if the mentee already exists by mujid or email
      const existingMentee = await Mentee.findOne({ $or: [{ mujid }, { email }] });
      if (existingMentee) {
        validationErrors.push({ mujid, error: "Mentee with this mujid or email already exists" });
        continue;
      }

      // Check if the mentor exists
      const mentor = await Mentor.findOne({ mujid: mentorMujid });
      if (!mentor) {
        validationErrors.push({ mujid, error: "Mentor with this mujid not found" });
        continue;
      }

      menteesToSave.push({
        mujid,
        yearOfRegistration,
        year,
        term,
        semester,
        section,
        name,
        email,
        phone,
        fatherName,
        motherName,
        dateOfBirth,
        parentsPhone,
        parentsEmail,
        mentorMujid
      });
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
    const section = searchParams.get('section'); // add section parameter
    const mentorMujid = searchParams.get('mentorMujid'); // updated parameter name

    const filters = {};
    if (year) filters.year = parseInt(year, 10); // parse year as integer
    if (term) filters.term = term;
    if (semester) filters.semester = semester;
    if (section) filters.section = section; // add section filter
    if (mentorMujid) filters.mentorMujid = mentorMujid;

    console.log('Filters applied:', filters); // Add this line to log the filters

    const mentees = await Mentee.find(filters);
    console.log('Mentees found:', mentees); // Add this line to log the mentees found
    if (!mentees.length) {
      return createErrorResponse("No mentees found", 404);
    }

    return NextResponse.json(mentees, { status: 200 });
  } catch (error) {
    console.error("Server error:", error);
    return createErrorResponse("Something went wrong on the server", 500);
  }
}

// PUT request to update a mentee by mujid
export async function PUT(req) {
  try {
    await connect();
    let requestBody;
    try {
      requestBody = await req.json();
    } catch (err) {
      return createErrorResponse("Invalid JSON input", 400);
    }

    const {
      mujid,
      yearOfRegistration,
      year,
      term,
      semester,
      section,
      name,
      email,
      phone,
      fatherName,
      motherName,
      dateOfBirth,
      parentsPhone,
      parentsEmail,
      mentorMujid,
    } = requestBody;

    const { error } = menteeSchema.validate({
      mujid,
      yearOfRegistration,
      year,
      term,
      semester,
      section,
      name,
      email,
      phone,
      fatherName,
      motherName,
      dateOfBirth,
      parentsPhone,
      parentsEmail,
      mentorMujid,
    });
    if (error) {
      return createErrorResponse(error.details[0].message, 400);
    }

    const updatedMentee = await Mentee.findOneAndUpdate(
      { mujid },
      {
        yearOfRegistration,
        year,
        term,
        semester,
        section,
        name,
        email,
        phone,
        fatherName,
        motherName,
        dateOfBirth,
        parentsPhone,
        parentsEmail,
        mentorMujid,
      },
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

// PATCH request to update specific fields of a mentee by mujid
export async function PATCH(req) {
  try {
    await connect();
    let requestBody;
    try {
      requestBody = await req.json();
    } catch (err) {
      return createErrorResponse("Invalid JSON input", 400);
    }

    const { mujid, ...updateFields } = requestBody;

    if (!mujid) {
      return createErrorResponse("Mujid is required", 400);
    }

    // Validate only the fields that are being updated
    const schema = Joi.object(updateFields).unknown(true);
    const { error } = schema.validate(updateFields);
    if (error) {
      return createErrorResponse(error.details[0].message, 400);
    }

    const updatedMentee = await Mentee.findOneAndUpdate(
      { mujid },
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

// DELETE request to delete a mentee by mujid
export async function DELETE(req) {
  try {
    await connect();
    const { searchParams } = new URL(req.url);
    const mujid = searchParams.get('mujid');

    if (!mujid) {
      return createErrorResponse("Mujid is required", 400);
    }

    const deletedMentee = await Mentee.findOneAndDelete({ mujid });
    if (!deletedMentee) {
      return createErrorResponse("Mentee not found", 404);
    }

    return NextResponse.json({ message: "Mentee deleted successfully" }, { status: 200 });
  } catch (error) {
    console.error("Server error:", error);
    return createErrorResponse("Something went wrong on the server", 500);
  }
}