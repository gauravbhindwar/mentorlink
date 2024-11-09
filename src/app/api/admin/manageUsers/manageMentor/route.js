import { connect } from "../../../../../lib/dbConfig";
import { Mentor } from "../../../../../lib/dbModels";
import { NextResponse } from "next/server";
import Joi from "joi";

// Define the Joi schema for validation
const mentorSchema = Joi.object({
  email: Joi.string().email().required(),
  name: Joi.string().required(),
  mujid: Joi.string().required(),
  phone: Joi.string().required(),
  designation: Joi.string().optional(),
  token: Joi.string().optional(),
  roles: Joi.array()
    .items(Joi.string().valid('mentor', 'admin', 'superadmin'))
    .default(['mentor']),
});

// Utility function to handle errors
const createErrorResponse = (message, statusCode = 400) => {
  return NextResponse.json({ error: message }, { status: statusCode });
};

// POST request to create a new mentor
export async function POST(req) {
  try {
    await connect();
    const requestBody = await req.json().catch(() => null);

    if (!requestBody) {
      return createErrorResponse("Invalid JSON input", 400);
    }

    const { error } = mentorSchema.validate(requestBody);
    if (error) {
      return createErrorResponse(error.details[0].message, 400);
    }

    const { email} = requestBody;
    const existingMentor = await Mentor.findOne({ email });
    if (existingMentor) {
      return createErrorResponse("Email already exists", 400);
    }

    const newMentor = new Mentor(requestBody);
    await newMentor.save();

    return NextResponse.json(
      { message: "Mentor added successfully" },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating mentor:", error);
    return createErrorResponse("Something went wrong on the server", 500);
  }
}

// GET request to fetch all mentors
export async function GET() {
  try {
    await connect();
    const mentors = await Mentor.find({});
    const totalMentors = await Mentor.countDocuments();

    return NextResponse.json(
      { mentors, totalMentors },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching mentors:", error);
    return createErrorResponse("Failed to fetch mentors", 500);
  }
}

// DELETE request to delete a mentor by mujid
export async function DELETE(req) {
  try {
    await connect();
    const requestBody = await req.json().catch(() => null);

    if (!requestBody) {
      return createErrorResponse("Invalid JSON input", 400);
    }

    const { mujid } = requestBody;

    if (!mujid) {
      return createErrorResponse("mujid is required for deletion", 400);
    }

    const deletedMentor = await Mentor.findOneAndDelete({ mujid });
    if (!deletedMentor) {
      return createErrorResponse("Mentor not found", 404);
    }

    return NextResponse.json(
      { message: "Mentor deleted successfully", deletedMentor },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting mentor:", error);
    return createErrorResponse("Failed to delete mentor", 500);
  }
}

// PUT request to update a mentor's details
export async function PUT(req) {
  try {
    await connect();
    const requestBody = await req.json().catch(() => null);

    if (!requestBody) {
      return createErrorResponse("Invalid JSON input", 400);
    }

    const { mujid } = requestBody;

    if (!mujid) {
      return createErrorResponse("mujid is required for updating", 400);
    }

    const { error } = mentorSchema.validate(requestBody);
    if (error) {
      return createErrorResponse(error.details[0].message, 400);
    }

    const updatedMentor = await Mentor.findOneAndUpdate(
      { mujid },
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
    return createErrorResponse("Something went wrong on the server", 500);
  }
}

// PATCH request to partially update a mentor's details
export async function PATCH(req) {
  try {
    await connect();
    const requestBody = await req.json().catch(() => null);

    if (!requestBody) {
      return createErrorResponse("Invalid JSON input", 400);
    }

    const { mujid, ...updateData } = requestBody;

    if (!mujid) {
      return createErrorResponse("mujid is required for updating", 400);
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
      { mujid },
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
    return createErrorResponse("Something went wrong on the server", 500);
  }
}
