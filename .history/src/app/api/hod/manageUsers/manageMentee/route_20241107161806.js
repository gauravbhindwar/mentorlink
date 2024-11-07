import { connect } from "../../../../../lib/dbConfig";
import { Mentee } from "../../../../../lib/dbModels";
import { NextResponse } from "next/server";
import Joi from "joi";

// Define the Joi schema for validation
const mentorSchema = Joi.object({
  email: Joi.string().email().required(),
  name: Joi.string().required(),
  mujid: Joi.string().required(),
  phone: Joi.string().optional(),

});

// Utility function to handle errors
const createErrorResponse = (message, statusCode = 400) => {
  return NextResponse.json({ error: message }, { status: statusCode });
};

// POST request to create a new mentor
export async function POST(req) {
  try {
    await connect();
    let requestBody;
    try {
      requestBody = await req.json();
    } catch (err) {
      return createErrorResponse("Invalid JSON input", err);
    }

    const { email, name, mujid, phone, designation, admin } = requestBody;

    const { error } = mentorSchema.validate({
      email,
      name,
      mujid,
      admin,
    });
    if (error) {
      return createErrorResponse(error.details[0].message);
    }

    // Check if the mentor already exists
    const existingMentor = await Mentor.findOne({ email });
    if (existingMentor) {
      return createErrorResponse("Email already exists");
    }

    let newMentor;
    if (!phone) {
      newMentor = new Mentor({
        email,
        name,
        mujid,
        designation,
        admin,
      });
    } else if (!designation) {
      newMentor = new Mentor({
        email,
        name,
        mujid,
        phone,
        admin,
      });
    } else {
      newMentor = new Mentor({
        email,
        name,
        mujid,
        phone,
        designation,
        admin,
      });
    }

    try {
      await newMentor.save();
    } catch (error) {
      return createErrorResponse("Error saving new mentor", 500);
    }

    return NextResponse.json({ message: "Mentor added successfully" }, { status: 201 });
  } catch (error) {
    return createErrorResponse("Something went wrong on the server", 500);
  }
}

// GET request to fetch all mentors
export async function GET() {
  await connect();
  try {
    const mentors = await Mentor.find({});
    const totalMentors = await Mentor.countDocuments();

    return NextResponse.json(
      {
        mentors,
        totalMentors,
      },
      { status: 200 }
    );
  } catch (error) {
    return createErrorResponse("Failed to fetch mentors", 500);
  }
}

// DELETE request to delete a mentor by mujid
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

    // Delete the mentor
    const deletedMentor = await Mentor.findOneAndDelete({ mujid });

    if (!deletedMentor) {
      return createErrorResponse("Mentor not found", 404);
    }

    return NextResponse.json(
      { message: "Mentor deleted successfully", deletedMentor },
      { status: 200 }
    );
  } catch (error) {
    return createErrorResponse("Failed to delete mentor", 500);
  }
}
// PUT request to update a mentor's details
export async function PUT(req) {
  try {
    await connect();

    let requestBody;
    try {
      requestBody = await req.json();
    } catch (err) {
      return createErrorResponse("Invalid JSON input");
    }

    const { email, name, mujid, phone, designation, admin } = requestBody;

    const { error } = mentorSchema.validate({
      email,
      name,
      mujid,
      admin,
    });
    if (error) {
      return createErrorResponse(error.details[0].message);
    }

    // Check if the mentor exists
    const existingMentor = await Mentor.findOne({ mujid });
    if (!existingMentor) {
      return createErrorResponse("Mentor not found", 404);
    }

    existingMentor.email = email;
    existingMentor.name = name;
    existingMentor.phone = phone;
    existingMentor.designation = designation;
    existingMentor.admin = admin;

    try {
      await existingMentor.save();
    } catch (error) {
      return createErrorResponse("Error updating mentor", 500);
    }

    return NextResponse.json({ message: "Mentor updated successfully" }, { status: 200 });
  } catch (error) {
    return createErrorResponse("Something went wrong on the server", 500);
  }
}
// PATCH request to partially update a mentor's details
export async function PATCH(req) {
  try {
    await connect();

    let requestBody;
    try {
      requestBody = await req.json();
    } catch (err) {
      return createErrorResponse("Invalid JSON input");
    }

    const { mujid, email, name, phone, designation, admin } = requestBody;

    if (!mujid) {
      return createErrorResponse("mujid is required for updating");
    }

    // Find the mentor
    const existingMentor = await Mentor.findOne({ mujid });
    if (!existingMentor) {
      return createErrorResponse("Mentor not found", 404);
    }

    if (email) existingMentor.email = email;
    if (name) existingMentor.name = name;
    if (phone) existingMentor.phone = phone;
    if (designation) existingMentor.designation = designation;
    if (admin) existingMentor.admin = admin;

    try {
      await existingMentor.save();
    } catch (error) {
      return createErrorResponse("Error updating mentor", 500);
    }

    return NextResponse.json({ message: "Mentor updated successfully" }, { status: 200 });
  } catch (error) {
    return createErrorResponse("Something went wrong on the server", 500);
  }
}
