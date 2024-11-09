import { connect } from "../../../../../lib/dbConfig";
import { Admin } from "../../../../../lib/dbModels";
import { NextResponse } from "next/server";
import Joi from "joi";

// Define the Joi schema for validation
const adminSchema = Joi.object({
  email: Joi.string().email().required(),
  name: Joi.string().required(),
  mujid: Joi.string().required(),
  phone: Joi.string().required(),
  roles: Joi.array()
    .items(Joi.string().valid('mentor', 'admin', 'superadmin'))
    .default(['admin']),
});

// Utility function to handle errors
const createErrorResponse = (message, statusCode = 400) => {
  return NextResponse.json({ error: message }, { status: statusCode });
};

// POST request to create a new admin
export async function POST(req) {
  try {
    await connect();
    const requestBody = await req.json().catch(() => null);

    if (!requestBody) {
      return createErrorResponse("Invalid JSON input", 400);
    }

    const { error } = adminSchema.validate(requestBody);
    if (error) {
      return createErrorResponse(error.details[0].message, 400);
    }

    const { email} = requestBody;
    const existingAdmin = await Admin.findOne({ email });
    if (existingAdmin) {
      return createErrorResponse("Email already exists", 400);
    }

    const newAdmin = new Admin(requestBody);
    await newAdmin.save();

    return NextResponse.json(
      { message: "Admin added successfully" },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating admin:", error);
    return createErrorResponse("Something went wrong on the server", 500);
  }
}

// GET request to fetch all admins
export async function GET() {
  try {
    await connect();
    const admins = await Admin.find({});
    const totalAdmins = await Admin.countDocuments();

    return NextResponse.json(
      { admins, totalAdmins },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching admins:", error);
    return createErrorResponse("Failed to fetch admins", 500);
  }
}

// DELETE request to delete an admin by mujid
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

    const deletedAdmin = await Admin.findOneAndDelete({ mujid });
    if (!deletedAdmin) {
      return createErrorResponse("Admin not found", 404);
    }

    return NextResponse.json(
      { message: "Admin deleted successfully", deletedAdmin },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting admin:", error);
    return createErrorResponse("Failed to delete admin", 500);
  }
}

// PUT request to update an admin's details
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

    const { error } = adminSchema.validate(requestBody);
    if (error) {
      return createErrorResponse(error.details[0].message, 400);
    }

    const updatedAdmin = await Admin.findOneAndUpdate(
      { mujid },
      requestBody,
      { new: true }
    );

    if (!updatedAdmin) {
      return createErrorResponse("Admin not found", 404);
    }

    return NextResponse.json(
      { message: "Admin updated successfully", updatedAdmin },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error updating admin:", error);
    return createErrorResponse("Something went wrong on the server", 500);
  }
}

// PATCH request to partially update an admin's details
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
    const schema = adminSchema.fork(Object.keys(updateData), (schema) =>
      schema.optional()
    );

    const { error } = schema.validate(updateData);
    if (error) {
      return createErrorResponse(error.details[0].message, 400);
    }

    const updatedAdmin = await Admin.findOneAndUpdate(
      { mujid },
      updateData,
      { new: true }
    );

    if (!updatedAdmin) {
      return createErrorResponse("Admin not found", 404);
    }

    return NextResponse.json(
      { message: "Admin updated successfully", updatedAdmin },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error partially updating admin:", error);
    return createErrorResponse("Something went wrong on the server", 500);
  }
}