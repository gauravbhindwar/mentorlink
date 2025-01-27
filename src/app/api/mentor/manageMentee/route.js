import { Mentee, Mentor } from "../../../../lib/dbModels";
import { NextResponse } from "next/server";
import Joi from "joi";
import { connect } from "@/lib/dbConfig";
// import { Meeting } from "@/lib/db/meetingSchema";


// Define the Joi schema for validation
const menteeSchema = Joi.object({
  mujid: Joi.string().alphanum().required(),
  yearOfRegistration: Joi.number()
    .integer()
    .min(1900)
    .max(new Date().getFullYear())
    .required(),
  name: Joi.string().regex(/^[a-zA-Z\s]+$/).required(),
  email: Joi.string().email().required(),
  phone: Joi.string().required(),
  fatherName: Joi.string().regex(/^[a-zA-Z\s]+$/).required(),
  motherName: Joi.string().regex(/^[a-zA-Z\s]+$/).required(),
  dateOfBirth: Joi.string().regex(/^\d{2}-\d{2}-\d{4}$/).required(),
  parentsPhone: Joi.string().required(),
  parentsEmail: Joi.string().email().required(),
  mentorMujid: Joi.string().alphanum().required(),
});

// Utility function to handle errors
const createErrorResponse = (message, statusCode = 400) => {
  return NextResponse.json({ error: message }, { status: statusCode });
};

// POST request to create new mentees
export async function POST(req) {
  try {
    await connect();
    let requestBody;
    try {
      requestBody = await req.json();
    } catch {
      return createErrorResponse("Invalid JSON input", 400);
    }

    if (!Array.isArray(requestBody)) {
      return createErrorResponse("Request body must be an array of mentees", 400);
    }

    const validationErrors = [];
    const menteesToSave = [];

    // Assuming the authenticated mentor's mujid is available in the request headers
    const authenticatedMentorMujid = req.headers.get('mentor-mujid');
    if (!authenticatedMentorMujid) {
      return createErrorResponse("Authenticated mentor's mujid is required", 400);
    }

    for (const menteeData of requestBody) {
      const {
        mujid,
        yearOfRegistration,
        name,
        email,
        phone,
        fatherName,
        motherName,
        dateOfBirth,
        parentsPhone,
        parentsEmail,
        mentorMujid,
      } = menteeData;

      const { error } = menteeSchema.validate({
        mujid,
        yearOfRegistration,
        name,
        email,
        phone,
        fatherName,
        motherName,
        dateOfBirth,
        parentsPhone,
        parentsEmail,
        mentorMujid,
      });

      if (error) {
        validationErrors.push({ mujid, error: error.details[0].message });
        continue;
      }

      // Check if the mentee already exists by mujid or email
      const existingMentee = await Mentee.findOne({ $or: [{ mujid }, { email }] });
      if (existingMentee) {
        validationErrors.push({ mujid, error: "Mentee with this mujid or email already exists" });
        continue;
      }

      // Check if the mentor exists and is the authenticated mentor
      const mentor = await Mentor.findOne({ mujid: mentorMujid });
      if (!mentor || mentor.mujid !== authenticatedMentorMujid) {
        validationErrors.push({ mujid, error: "Mentor with this mujid not found or not authorized" });
        continue;
      }

      menteesToSave.push({
        mujid,
        yearOfRegistration,
        name,
        email,
        phone,
        fatherName,
        motherName,
        dateOfBirth,
        parentsPhone,
        parentsEmail,
        mentorMujid,
      });
    }

    if (validationErrors.length > 0) {
      return createErrorResponse(validationErrors, 400);
    }

    try {
      await Mentee.insertMany(menteesToSave);
    } catch (error) {
      console.error("Error saving new mentees:", error);
      return createErrorResponse("Error saving new mentees", 500);
    }

    return NextResponse.json({ message: "Mentees added successfully" }, { status: 201 });
  } catch (error) {
    console.error("Server error:", error);
    return createErrorResponse("Something went wrong on the server", 500);
  }
}

// GET request to read mentees by mentor email
export async function GET(req) {
  try {
    await connect();
    
    const { searchParams } = new URL(req.url);
    const mentorEmail = searchParams.get('mentorEmail');

    if (!mentorEmail) {
      return NextResponse.json({ 
        success: false, 
        message: "Mentor email is required" 
      }, { status: 400 });
    }

    // console.log("Searching for mentees with mentor email:", mentorEmail);

    // Find all mentees assigned to this mentor using mentorEmailid field
    const mentees = await Mentee.find({ 
      mentorEmailid: mentorEmail  // Make sure this matches your schema field name
    })
    .select('-password -otp -otpExpires -isOtpUsed')
    .lean();

    // console.log("Found mentees:", mentees.length);

    return NextResponse.json({
      success: true,
      mentees: mentees,
      count: mentees.length
    }, { status: 200 });

  } catch (error) {
    console.error("Server error:", error);
    return NextResponse.json({ 
      success: false, 
      message: "Error fetching mentees",
      error: error.message 
    }, { status: 500 });
  }
}

// PUT request to update a mentee by mujid
// export async function PUT(req) {
//   try {
//     await connect();
//     const data = await req.json();
//     const mentorEmail = req.headers.get('mentor-email');

//     if (!mentorEmail) {
//       return NextResponse.json({
//         success: false,
//         message: "Mentor email is required"
//       }, { status: 400 });
//     }

//     console.log('Received update data:', data); // Debug log

//     const allowedUpdates = {
//       name: data.name,
//       phone: data.phone,
//       address: data.address, // Ensure address is included
//       parents: {
//         father: data.parents?.father || {},
//         mother: data.parents?.mother || {},
//         guardian: data.parents?.guardian || {}
//       }
//     };

//     // Remove undefined fields
//     Object.keys(allowedUpdates).forEach(key => {
//       if (allowedUpdates[key] === undefined || allowedUpdates[key] === null) {
//         delete allowedUpdates[key];
//       }
//     });

//     console.log('Processed updates:', allowedUpdates); // Debug log

//     const updatedMentee = await Mentee.findOneAndUpdate(
//       { 
//         MUJid: data.MUJid,
//         mentorEmailid: mentorEmail
//       },
//       { $set: allowedUpdates },
//       { 
//         new: true,
//         runValidators: true
//       }
//     );

//     if (!updatedMentee) {
//       return NextResponse.json({
//         success: false,
//         message: "Mentee not found or not authorized to update"
//       }, { status: 404 });
//     }

//     return NextResponse.json({
//       success: true,
//       message: "Mentee updated successfully",
//       mentee: updatedMentee
//     }, { status: 200 });

//   } catch (error) {
//     console.error("Update error:", error);
//     return NextResponse.json({
//       success: false,
//       message: "Error updating mentee",
//       error: error.message
//     }, { status: 500 });
//   }
// }

// PATCH request to update specific fields of a mentee by mujid
export async function PATCH(req) {
  try {
    await connect();
    let requestBody;
    try {
      requestBody = await req.json();
    } catch{
      return createErrorResponse("Invalid JSON input", 400);
    }

    const { mujid, ...updateFields } = requestBody;

    if (!mujid) {
      return createErrorResponse("Mujid is required", 400);
    }

    const { error } = Joi.object(updateFields).validate(updateFields);
    if (error) {
      return createErrorResponse(error.details[0].message, 400);
    }

    // Assuming the authenticated mentor's mujid is available in the request headers
    const authenticatedMentorMujid = req.headers.get('mentor-mujid');
    if (!authenticatedMentorMujid) {
      return createErrorResponse("Authenticated mentor's mujid is required", 400);
    }

    const updatedMentee = await Mentee.findOneAndUpdate(
      { mujid, mentorMujid: authenticatedMentorMujid },
      { $set: updateFields },
      { new: true }
    );

    if (!updatedMentee) {
      return createErrorResponse("Mentee not found or not authorized", 404);
    }

    return NextResponse.json({ message: "Mentee updated successfully" }, { status: 200 });
  } catch (error) {
    console.error("Server error:", error);
    return createErrorResponse("Something went wrong on the server", 500);
  }
}

// DELETE request to delete a mentee by mujid
export async function DELETE(req) {
  try {
    await connect();
    const { searchParams } = new URL(req.url);
    const mujid = searchParams.get('mujid');

    if (!mujid) {
      return createErrorResponse("Mujid is required", 400);
    }

    // Assuming the authenticated mentor's mujid is available in the request headers
    const authenticatedMentorMujid = req.headers.get('mentor-mujid');
    if (!authenticatedMentorMujid) {
      return createErrorResponse("Authenticated mentor's mujid is required", 400);
    }

    const deletedMentee = await Mentee.findOneAndDelete({ mujid, mentorMujid: authenticatedMentorMujid });
    if (!deletedMentee) {
      return createErrorResponse("Mentee not found or not authorized", 404);
    }

    return NextResponse.json({ message: "Mentee deleted successfully" }, { status: 200 });
  } catch (error) {
    console.error("Server error:", error);
    return createErrorResponse("Something went wrong on the server", 500);
  }
}

export async function PUT(request) {
  try {
    await connect();
    const menteeData = await request.json();

    if (!menteeData.MUJid) {
      return NextResponse.json({ error: "MUJid is required" }, { status: 400 });
    }

    // Update mentee in database
    const updatedMentee = await Mentee.findOneAndUpdate(
      { MUJid: menteeData.MUJid },
      {
        $set: {
          name: menteeData.name,
          email: menteeData.email,
          phone: menteeData.phone,
          address: menteeData.address,
          semester: menteeData.semester,
          parents: {
            father: menteeData.parents?.father || {},
            mother: menteeData.parents?.mother || {},
            guardian: menteeData.parents?.guardian || {}
          },
          updated_at: new Date()
        }
      },
      { new: true }
    );

    if (!updatedMentee) {
      return NextResponse.json({ error: "Mentee not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: "Mentee updated successfully",
      mentee: updatedMentee
    });

  } catch (error) {
    console.error("Error updating mentee:", error);
    return NextResponse.json(
      { error: "Failed to update mentee" },
      { status: 500 }
    );
  }
}