import { connect } from "../../../../../lib/dbConfig";
import { Mentee, Mentor } from "../../../../../lib/dbModels";
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
  menteePersonalDetails: Joi.object({
    name: Joi.string().regex(/^[a-zA-Z\s]+$/).required(),
    email: Joi.string().email().required(),
    phone: Joi.string().required(),
    fatherName: Joi.string().regex(/^[a-zA-Z\s]+$/).required(),
    motherName: Joi.string().regex(/^[a-zA-Z\s]+$/).required(),
    dateOfBirth: Joi.date().required(),
    parentsPhone: Joi.string().required(),
    parentsEmail: Joi.string().email().required(),
  }).required(),
  mentorMujid: Joi.string().alphanum().required(),
});

// Utility function to handle errors
const createErrorResponse = (message, statusCode = 400) => {
  return NextResponse.json({ error: message }, { status: statusCode });
};

// POST request to create a new mentee
export async function POST(req) {
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
      menteePersonalDetails,
      mentorMujid,
    } = requestBody;

    const { error } = menteeSchema.validate({
      mujid,
      yearOfRegistration,
      menteePersonalDetails,
      mentorMujid,
    });
    if (error) {
      return createErrorResponse(error.details[0].message, 400);
    }

    // Check if the mentee already exists by mujid or email
    const existingMentee = await Mentee.findOne({
      $or: [
        { mujid },
        { "menteePersonalDetails.email": menteePersonalDetails.email },
      ],
    });
    if (existingMentee) {
      return createErrorResponse(
        "Mentee with this mujid or email already exists",
        400
      );
    }

    // Check if the mentor exists
    const mentor = await Mentor.findOne({ mujid: mentorMujid });
    if (!mentor) {
      return createErrorResponse("Mentor with this mujid not found", 400);
    }

    const newMentee = new Mentee({
      mujid,
      yearOfRegistration,
      menteePersonalDetails,
      mentorMujid,
    });

    try {
      await newMentee.save();
    } catch (error) {
      console.error("Error saving new mentee:", error);
      return createErrorResponse("Error saving new mentee", 500);
    }

    return NextResponse.json(
      { message: "Mentee added successfully" },
      { status: 201 }
    );
  } catch (error) {
    console.error("Server error:", error);
    return createErrorResponse("Something went wrong on the server", 500);
  }
}

// PUT request to update a mentee's details
export async function PUT(req) {
  try {
    await connect();
    let requestBody;
    try {
      requestBody = await req.json();
    } catch (err) {
      return createErrorResponse("Invalid JSON input");
    }

    const { mujid, ...updateData } = requestBody;

    if (!mujid) {
      return createErrorResponse("mujid is required for updating");
    }

    const { error } = menteeSchema.validate(updateData, { allowUnknown: true });
    if (error) {
      return createErrorResponse(error.details[0].message);
    }

    try {
      const updatedMentee = await Mentee.findOneAndUpdate({ mujid }, updateData, {
        new: true,
      });
      if (!updatedMentee) {
        return createErrorResponse("Mentee not found", 404);
      }
      return NextResponse.json({ message: "Mentee updated successfully", updatedMentee });
    } catch (error) {
      return createErrorResponse("Error updating mentee", 500);
    }
  } catch (error) {
    return createErrorResponse("Something went wrong on the server", 500);
  }
}

// PATCH request to partially update a mentee's details
export async function PATCH(req) {
  try {
    await connect();
    let requestBody;
    try {
      requestBody = await req.json();
    } catch (err) {
      return createErrorResponse("Invalid JSON input");
    }

    const { mujid, ...updateData } = requestBody;

    if (!mujid) {
      return createErrorResponse("mujid is required for updating");
    }

    const { error } = menteeSchema.validate(updateData, { allowUnknown: true });
    if (error) {
      return createErrorResponse(error.details[0].message);
    }

    try {
      const updatedMentee = await Mentee.findOneAndUpdate({ mujid }, updateData, {
        new: true,
      });
      if (!updatedMentee) {
        return createErrorResponse("Mentee not found", 404);
      }
      return NextResponse.json({ message: "Mentee updated successfully", updatedMentee });
    } catch (error) {
      return createErrorResponse("Error updating mentee", 500);
    }
  } catch (error) {
    return createErrorResponse("Something went wrong on the server", 500);
  }
}

// DELETE request to delete a mentee by mujid
export async function DELETE(req) {
  try {
    await connect();

    // Parse request body
    let requestBody;
    try {
      requestBody = await req.json();
    } catch (err) {
      return createErrorResponse("Invalid JSON input");
    }

    const { mujid } = requestBody;

    if (!mujid) {
      return createErrorResponse("mujid is required for deletion");
    }

    // Delete the mentee
    const deletedMentee = await Mentee.findOneAndDelete({ mujid });

    if (!deletedMentee) {
      return createErrorResponse("Mentee not found", 404);
    }

    return NextResponse.json(
      { message: "Mentee deleted successfully", deletedMentee },
      { status: 200 }
    );
  } catch (error) {
    return createErrorResponse("Failed to delete mentee", 500);
  }
}