
import { connect } from "../../../../lib/dbConfig";
import { Mentee } from "../../../../lib/dbModels";
import { NextResponse } from "next/server";

// Utility function to handle errors
const createErrorResponse = (message, statusCode = 400) => {
  return NextResponse.json({ error: message }, { status: statusCode });
};

// GET request to fetch mentee details
export async function GET(req) {
  try {
    await connect();
    const { searchParams } = new URL(req.url);
    const MUJid = searchParams.get('MUJid');

    if (!MUJid) {
      return createErrorResponse("MUJid is required", 400);
    }

    const mentee = await Mentee.findOne({ MUJid });

    if (!mentee) {
      return createErrorResponse("Mentee not found", 404);
    }

    return NextResponse.json(mentee, { status: 200 });
  } catch (error) {
    console.error("Error fetching mentee details:", error);
    return createErrorResponse("Error fetching mentee details", 500);
  }
}