import { connect } from "../../../../../lib/dbConfig";
import { Mentee, Mentor } from "../../../../../lib/dbModels";
import { NextResponse } from "next/server";
import Joi from "joi";
// Define the Joi schema for validation
const menteeSchema = new mongoose.Schema({
  mujid: { type: String, required: true, unique: true },
  yearOfRegistration: { type: Number, required: true },
  menteePersonalDetails: {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true }, // Ensure `unique` is here
    phone: { type: String, required: true },
    fatherName: { type: String, required: true },
    motherName: { type: String, required: true },
    dateOfBirth: { type: Date, required: true },
    parentsPhone: { type: String, required: true },
    parentsEmail: { type: String, required: true },
  },
  mentorMujid: { type: String, required: true },
});
// Utility function to handle errors
const createErrorResponse = (message, statusCode = 400) => {
  return NextResponse.json({ error: message }, { status: statusCode });
};

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

    // Ensure email field is not missing or null
    if (!menteePersonalDetails.email) {
      return createErrorResponse("Mentee email is required and cannot be null", 400);
    }

    // Check if the mentee already exists by mujid or email
    const existingMentee = await Mentee.findOne({
      $or: [
        { mujid },
        { "menteePersonalDetails.email": menteePersonalDetails.email },
      ],
    });

    if (existingMentee) {
      return createErrorResponse("Mentee with this mujid or email already exists", 400);
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