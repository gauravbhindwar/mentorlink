import { connect } from "../../../../../lib/dbConfig";
import { Mentor, Admin } from "../../../../../lib/dbModels";
import { NextResponse } from "next/server";
import Joi from "joi";

// Define the Joi schema for validation
const adminSchema = Joi.object({
  name: Joi.string().required(),
  email: Joi.string().email().required(),
  MUJid: Joi.string().pattern(/^[A-Z0-9]+$/).required(),
  phone_number: Joi.string().pattern(/^\d{10}$/).required(),
  role: Joi.array().items(Joi.string().valid('admin', 'superadmin')).required()
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

    requestBody.role = ['admin', ...requestBody.role || []];

    const { error } = adminSchema.validate(requestBody);
    if (error) {
      return createErrorResponse(error.details[0].message, 400);
    }

    const existingAdmin = await Admin.findOne({
      $or: [{ email: requestBody.email }, { MUJid: requestBody.MUJid }]
    });
    if (existingAdmin) {
      return createErrorResponse("Admin with this email or MUJid already exists", 400);
    }

    const newAdmin = new Admin(requestBody);
    await newAdmin.save();

    // If the user is also a mentor, store in Mentor collection
    if (requestBody.role.includes('mentor')) {
      const existingMentor = await Mentor.findOne({
        $or: [{ email: requestBody.email }, { MUJid: requestBody.MUJid }]
      });
      if (!existingMentor) {
        const newMentor = new Mentor(requestBody);
        await newMentor.save();
      }
    }

    return NextResponse.json(
      { message: "Admin added successfully" },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating admin:", error);
    return createErrorResponse("Something went wrong on the server", 500);
  }
}

// GET request to fetch all admins and superadmins
export async function GET() {
  try {
    await connect();
    const admins = await Mentor.find({ role: { $in: ['admin', 'superadmin'] } });
    const totalAdmins = await Mentor.countDocuments({ role: { $in: ['admin', 'superadmin'] } });

    return NextResponse.json(
      { admins, totalAdmins },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching admins:", error);
    return createErrorResponse("Failed to fetch admins", 500);
  }
}

// DELETE request to delete an admin or superadmin by MUJid
export async function DELETE(req) {
  try {
    await connect();
    const requestBody = await req.json().catch(() => null);

    if (!requestBody) {
      return createErrorResponse("Invalid JSON input", 400);
    }

    const { MUJid } = requestBody;

    if (!MUJid) {
      return createErrorResponse("MUJid is required for deletion", 400);
    }

    const deletedAdmin = await Mentor.findOneAndDelete({ MUJid, role: { $in: ['admin', 'superadmin'] } });
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

// PUT request to update an admin's or superadmin's details
export async function PUT(req) {
  try {
    await connect();
    const requestBody = await req.json().catch(() => null);

    if (!requestBody) {
      return createErrorResponse("Invalid JSON input", 400);
    }

    const { MUJid } = requestBody;

    if (!MUJid) {
      return createErrorResponse("MUJid is required for updating", 400);
    }

    const { error } = adminSchema.validate(requestBody);
    if (error) {
      return createErrorResponse(error.details[0].message, 400);
    }

    const updatedAdmin = await Mentor.findOneAndUpdate(
      { MUJid, role: { $in: ['admin', 'superadmin'] } },
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

// PATCH request to partially update an admin's or superadmin's details
export async function PATCH(req) {
  try {
    await connect();
    const requestBody = await req.json().catch(() => null);

    if (!requestBody) {
      return createErrorResponse("Invalid JSON input", 400);
    }

    const { MUJid, ...updateData } = requestBody;

    if (!MUJid) {
      return createErrorResponse("MUJid is required for updating", 400);
    }

    // Partial validation for PATCH, applying defaults only for provided fields
    const schema = adminSchema.fork(Object.keys(updateData), (schema) =>
      schema.optional()
    );

    const { error } = schema.validate(updateData);
    if (error) {
      return createErrorResponse(error.details[0].message, 400);
    }

    const updatedAdmin = await Mentor.findOneAndUpdate(
      { MUJid, role: { $in: ['admin', 'superadmin'] } },
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