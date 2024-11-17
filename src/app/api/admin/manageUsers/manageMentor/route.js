import { connect } from "../../../../../lib/dbConfig";
import { Mentor, Admin } from "../../../../../lib/dbModels"; // Ensure Admin is imported
import { NextResponse } from "next/server";
import Joi from "joi";

// Define the Joi schema for validation
const mentorSchema = Joi.object({
  name: Joi.string().required(),
  email: Joi.string().email().required(),
  MUJid: Joi.string().required(), // Remove strict pattern for testing
  phone_number: Joi.string().required(), // Remove strict pattern for testing
  profile_picture: Joi.string().optional(),
  role: Joi.array().items(Joi.string().valid('mentor', 'admin', 'superadmin')).default(['mentor']) // Allow 'admin' and 'superadmin' as valid values
});

// Utility function to handle errors
const createErrorResponse = (message, statusCode = 400) => {
  return NextResponse.json({ error: message }, { status: statusCode });
};

// POST request to create new mentors
export async function POST(req) {
  try {
    await connect().catch((err) => {
      console.error("Database connection failed:", err);
      throw new Error("Database connection failed");
    });
    let requestBody;

    // Try reading the request directly first
    try {
      requestBody = await req.json();
    } catch (parseError) {
      console.error('Direct JSON parsing failed:', parseError);
      
      // Fallback to manual text parsing
      try {
        const rawText = await req.text();
        console.log('Raw text received:', rawText);
        
        // Clean the input if needed
        const cleanedText = rawText.trim();
        requestBody = JSON.parse(cleanedText);
      } catch (textError) {
        console.error('Text parsing failed:', textError);
        return createErrorResponse("Invalid JSON format. Please check your payload formatting.", 400);
      }
    }

    console.log('Final parsed request body:', requestBody);

    // Ensure requestBody is an array
    if (!Array.isArray(requestBody)) {
      requestBody = [requestBody];
    }

    if (requestBody.length === 0) {
      return createErrorResponse("Empty request body", 400);
    }

    // Validate each mentor object
    const validationErrors = [];
    for (let i = 0; i < requestBody.length; i++) {
      console.log(`Validating entry ${i + 1}:`, requestBody[i]);
      const { error, value } = mentorSchema.validate(requestBody[i], { 
        abortEarly: false,
        stripUnknown: true 
      });
      if (error) {
        console.error(`Validation error for entry ${i + 1}:`, error);
        validationErrors.push(`Entry ${i + 1}: ${error.details.map(d => d.message).join(', ')}`);
      }
    }

    if (validationErrors.length > 0) {
      console.log('Validation errors:', validationErrors);
      return createErrorResponse(validationErrors.join('; '), 400);
    }

    // Check for duplicate emails or MUJids
    const emails = requestBody.map(mentor => mentor.email);
    const mujIds = requestBody.map(mentor => mentor.MUJid);
    
    const existingMentors = await Mentor.find({
      $or: [
        { email: { $in: emails } },
        { MUJid: { $in: mujIds } }
      ]
    });

    if (existingMentors.length > 0) {
      return createErrorResponse("One or more mentors with given email or MUJid already exist", 400);
    }

    // Create all mentors
    const createdMentors = await Mentor.insertMany(requestBody);

    // If the user is also an admin, store in Admin collection
    for (const mentor of requestBody) {
      if (mentor.role && (mentor.role.includes('admin') || mentor.role.includes('superadmin'))) {
        const existingAdmin = await Admin.findOne({
          $or: [{ email: mentor.email }, { MUJid: mentor.MUJid }]
        });
        if (!existingAdmin) {
          const newAdmin = new Admin(mentor);
          await newAdmin.save();
        }
      }
    }

    return NextResponse.json(
      { message: "Mentors added successfully", mentors: createdMentors },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error in POST handler:", error);
    return createErrorResponse(error.message || "Server error processing request", 500);
  }
}

// GET request to fetch all mentors
export async function GET() {
  try {
    await connect().catch((err) => {
      console.error("Database connection failed:", err);
      throw new Error("Database connection failed");
    });
    const mentors = await Mentor.find({});
    const totalMentors = await Mentor.countDocuments();

    return NextResponse.json(
      { mentors, totalMentors },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching mentors:", error);
    return createErrorResponse(error.message || "Failed to fetch mentors", 500);
  }
}

// DELETE request to delete a mentor by MUJid
export async function DELETE(req) {
  try {
    await connect().catch((err) => {
      console.error("Database connection failed:", err);
      throw new Error("Database connection failed");
    });
    const requestBody = await req.json().catch(() => null);

    if (!requestBody) {
      return createErrorResponse("Invalid JSON input", 400);
    }

    const { MUJid } = requestBody;

    if (!MUJid) {
      return createErrorResponse("MUJid is required for deletion", 400);
    }

    const deletedMentor = await Mentor.findOneAndDelete({ MUJid });
    if (!deletedMentor) {
      return createErrorResponse("Mentor not found", 404);
    }

    return NextResponse.json(
      { message: "Mentor deleted successfully", deletedMentor },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting mentor:", error);
    return createErrorResponse(error.message || "Failed to delete mentor", 500);
  }
}

// PUT request to update a mentor's details
export async function PUT(req) {
  try {
    await connect().catch((err) => {
      console.error("Database connection failed:", err);
      throw new Error("Database connection failed");
    });
    const requestBody = await req.json().catch(() => null);

    if (!requestBody) {
      return createErrorResponse("Invalid JSON input", 400);
    }

    const { MUJid } = requestBody;

    if (!MUJid) {
      return createErrorResponse("MUJid is required for updating", 400);
    }

    const { error } = mentorSchema.validate(requestBody);
    if (error) {
      return createErrorResponse(error.details[0].message, 400);
    }

    const updatedMentor = await Mentor.findOneAndUpdate(
      { MUJid },
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
    return createErrorResponse(error.message || "Something went wrong on the server", 500);
  }
}

// PATCH request to partially update a mentor's details
export async function PATCH(req) {
  try {
    await connect().catch((err) => {
      console.error("Database connection failed:", err);
      throw new Error("Database connection failed");
    });
    const requestBody = await req.json().catch(() => null);

    if (!requestBody) {
      return createErrorResponse("Invalid JSON input", 400);
    }

    const { MUJid, ...updateData } = requestBody;

    if (!MUJid) {
      return createErrorResponse("MUJid is required for updating", 400);
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
      { MUJid },
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
    return createErrorResponse(error.message || "Something went wrong on the server", 500);
  }
}
