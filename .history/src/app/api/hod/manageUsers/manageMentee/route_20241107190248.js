import { connect } from "../../../../../lib/dbConfig";
import { Mentee } from "../../../../../lib/dbModels";
import { NextResponse } from "next/server";
import Joi from "joi";

// Define the Joi schema for validation
const menteeSchema = Joi.object({
  mujid: Joi.string().required(),
  'menteePersonalDetails.name': Joi.string().required(),
  'menteePersonalDetails.email': Joi.string().email().required(),
  'menteePersonalDetails.phone': Joi.number().required(),
  'menteePersonalDetails.fatherName': Joi.string().required(),
  'menteePersonalDetails.motherName': Joi.string().required(),
  'menteePersonalDetails.dateOfBirth': Joi.date().required(),
  'menteePersonalDetails.parentsPhone': Joi.number().required(),
  'menteePersonalDetails.parentsEmail': Joi.string().email().required(),
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
      return createErrorResponse("Invalid JSON input", err);
    }

    const { error } = menteeSchema.validate(requestBody);
    if (error) {
      return createErrorResponse(error.details[0].message);
    }

    // Check if the mentee already exists
    const existingMentee = await Mentee.findOne({ mujid: requestBody.mujid });
    if (existingMentee) {
      return createErrorResponse("MujID already exists");
    }

    try {
      const newMentee = new Mentee(requestBody);
      await newMentee.save();
      return NextResponse.json({ message: "Mentee added successfully" }, { status: 201 });
    } catch (error) {
      return createErrorResponse("Error saving new mentee", 500);
    }
  } catch (error) {
    return createErrorResponse("Something went wrong on the server", 500);
  }
}

// GET request to fetch all mentees
export async function GET() {
  await connect();
  try {
    const mentees = await Mentee.find({});
    const totalMentees = await Mentee.countDocuments();

    return NextResponse.json(
      {
        mentees,
        totalMentees,
      },
      { status: 200 }
    );
  } catch (error) {
    return createErrorResponse("Failed to fetch mentees", 500);
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
