import { connect } from "../../../../../lib/dbConfig";
import { MentorMenteeRelationship } from "../../../../../lib/dbModels";
import { NextResponse } from "next/server";
import Joi from "joi";

// Define the Joi schema for validation
const assignmentSchema = Joi.object({
  mentor_MUJid: Joi.string().required(),
  mentee_MUJid: Joi.string().required(),
  session: Joi.string().required(),
  current_semester: Joi.number().required(),
  section: Joi.string().required()
});

// Utility function to handle errors
const createErrorResponse = (message, statusCode = 400) => {
  return NextResponse.json({ error: message }, { status: statusCode });
};

// POST request to assign a mentor to a mentee
export async function POST(req) {
  try {
    await connect();
    const requestBody = await req.json();

    const { error } = assignmentSchema.validate(requestBody);
    if (error) {
      return createErrorResponse(error.details[0].message, 400);
    }

    const { mentor_MUJid, mentee_MUJid, session, current_semester, section } = requestBody;

    try {
      await MentorMenteeRelationship.assignMentor({
        mentor_MUJid,
        mentee_MUJid,
        session,
        current_semester,
        section
      });
    } catch (assignError) {
      return createErrorResponse(assignError.message, 400);
    }

    return NextResponse.json({ message: "Mentor assigned successfully" }, { status: 201 });
  } catch (error) {
    console.error("Error assigning mentor:", error);
    return createErrorResponse("Error assigning mentor", 500);
  }
}