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

    console.log("Request Body:", requestBody);

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
    console.log(newMentee)
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