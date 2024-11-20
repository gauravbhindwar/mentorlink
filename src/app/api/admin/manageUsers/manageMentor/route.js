import { connect } from "../../../../../lib/dbConfig";
import { Mentor, Admin } from "../../../../../lib/dbModels";
import { NextResponse } from "next/server";
import Joi from "joi";

// Updated schema with proper validations
const mentorSchema = Joi.object({
  name: Joi.string().required(),
  email: Joi.string().email().required(),
  MUJid: Joi.string().required(),
  phone_number: Joi.string().required(),
  address: Joi.string().allow('', null),
  gender: Joi.string().valid('male', 'female', 'other').allow('', null),
  profile_picture: Joi.string().allow('', null),
  role: Joi.array().items(Joi.string().valid('mentor', 'admin', 'superadmin')).default(['mentor']),
  academicYear: Joi.string()
    .pattern(/^\d{4}-\d{4}$/)
    .custom((value, helpers) => {
      const [startYear, endYear] = value.split('-').map(Number);
      if (endYear !== startYear + 1) {
        return helpers.error('any.invalid');
      }
      return value;
    })
    .allow('', null),
  academicSession: Joi.string()
    .pattern(/^(JULY-DECEMBER|JANUARY-JUNE)\s\d{4}$/)
    .allow('', null)
});

// Utility function to handle errors
const createErrorResponse = (message, statusCode = 400) => {
  return NextResponse.json({ error: message }, { status: statusCode });
};

// Helper function to create admin record
async function createAdminRecord(mentorData) {
  const adminData = {
    name: mentorData.name,
    email: mentorData.email,
    MUJid: mentorData.MUJid,
    phone_number: mentorData.phone_number,
    role: mentorData.role,
    created_at: new Date(),
    updated_at: new Date()
  };
  
  return await Admin.create(adminData);
}

// POST request with admin creation
export async function POST(req) {
  try {
    await connect();
    let data = await req.json();
    
    const mentorsToCreate = Array.isArray(data) ? data : [data];
    const createdMentors = [];
    const createdAdmins = [];

    for (const mentor of mentorsToCreate) {
      // Required fields validation
      const requiredFields = ['name', 'email', 'MUJid', 'phone_number', 'academicYear', 'academicSession'];
      const missingFields = requiredFields.filter(field => !mentor[field]);
      if (missingFields.length > 0) {
        throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
      }

      const [sessionName, year] = mentor.academicSession.split(' ');
      if (!['JULY-DECEMBER', 'JANUARY-JUNE'].includes(sessionName)) {
        throw new Error('Invalid academicSession format');
      }

      // Transform data to match schema structure
      const transformedMentor = {
        academicRecords: [{
          academicYear: mentor.academicYear,
          sessions: [{
            sessionName,
            mentorInfo: {
              name: mentor.name,
              email: mentor.email,
              MUJid: mentor.MUJid,
              phone_number: mentor.phone_number,
              address: mentor.address || '',
              gender: mentor.gender || '',
              profile_picture: mentor.profile_picture || '',
              role: mentor.role || ['mentor'],
              auth: { isOtpUsed: false }
            }
          }]
        }]
      };

      try {
        const createdMentor = await Mentor.create(transformedMentor);
        createdMentors.push(createdMentor);

        if (mentor.role?.some(role => ['admin', 'superadmin'].includes(role))) {
          const createdAdmin = await createAdminRecord(mentor);
          createdAdmins.push(createdAdmin);
        }
      } catch (err) {
        if (err.code === 11000) { // Duplicate key error
          throw new Error(`Duplicate entry found for ${Object.keys(err.keyPattern).join(', ')}`);
        }
        throw err;
      }
    }
    
    return NextResponse.json({ 
      message: "Records created successfully",
      mentors: createdMentors,
      admins: createdAdmins
    }, { status: 201 });
  } catch (error) {
    console.error('Error in POST:', error);
    return NextResponse.json({ 
      error: error.message || "Failed to create records"
    }, { status: 400 });
  }
}

// GET request with improved filtering
export async function GET(req) {
  try {
    await connect();
    const { searchParams } = new URL(req.url);
    
    // Updated query for nested structure
    const query = {};
    if (searchParams.get('academicYear')) {
      query['academicRecords.academicYear'] = searchParams.get('academicYear');
    }
    if (searchParams.get('academicSession')) {
      query['academicRecords.sessions.sessionName'] = searchParams.get('academicSession').split(' ')[0];
    }

    const mentors = await Mentor.find(query);
    
    // Transform response to match frontend expectations
    const transformedMentors = mentors.map(mentor => {
      const latestRecord = mentor.academicRecords[mentor.academicRecords.length - 1];
      const latestSession = latestRecord?.sessions[latestRecord.sessions.length - 1];
      return {
        ...latestSession?.mentorInfo,
        academicYear: latestRecord?.academicYear,
        academicSession: `${latestSession?.sessionName} ${latestRecord?.academicYear.split('-')[0]}`
      };
    });

    return NextResponse.json({ mentors: transformedMentors });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE request to delete from both collections
export async function DELETE(req) {
  try {
    await connect();
    const { MUJid } = await req.json();

    if (!MUJid) {
      return createErrorResponse("MUJid is required for deletion", 400);
    }

    const [deletedMentor, deletedAdmin] = await Promise.all([
      Mentor.findOneAndDelete({ 'academicRecords.sessions.mentorInfo.MUJid': MUJid }),
      Admin.findOneAndDelete({ MUJid })
    ]);

    if (!deletedMentor) {
      return createErrorResponse("Mentor not found", 404);
    }

    return NextResponse.json({
      message: "Records deleted successfully",
      deletedMentor,
      deletedAdmin
    }, { status: 200 });
  } catch (error) {
    return createErrorResponse(error.message || "Failed to delete records", 500);
  }
}

// PUT request to update both collections
export async function PUT(req) {
  try {
    const { MUJid, ...updateData } = await req.json();

    // Update mentor
    const mentor = await Mentor.findOne({
      'academicRecords.sessions.mentorInfo.MUJid': MUJid
    });

    if (!mentor) {
      return NextResponse.json({ error: "Mentor not found" }, { status: 404 });
    }

    // Update the latest session's mentor info
    const latestRecord = mentor.academicRecords[mentor.academicRecords.length - 1];
    const latestSession = latestRecord.sessions[latestRecord.sessions.length - 1];
    Object.assign(latestSession.mentorInfo, updateData);
    await mentor.save();

    // Update or create admin record if role includes admin/superadmin
    let admin = null;
    if (updateData.role && updateData.role.some(role => ['admin', 'superadmin'].includes(role))) {
      admin = await Admin.findOne({ MUJid });
      if (admin) {
        Object.assign(admin, { ...updateData, updated_at: new Date() });
        await admin.save();
      } else {
        admin = await createAdminRecord({ MUJid, ...updateData });
      }
    } else {
      // Remove from admin collection if no longer admin/superadmin
      await Admin.findOneAndDelete({ MUJid });
    }

    return NextResponse.json({ 
      message: "Records updated successfully",
      mentor,
      admin
    });
  } catch (error) {
    return createErrorResponse(error.message || "Failed to update records", 500);
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
