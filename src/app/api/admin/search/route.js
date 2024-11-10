import { connect } from "../../../../lib/dbConfig";
import { Mentee } from "../../../../lib/dbModels";
import { NextResponse } from "next/server";

// Utility function to handle errors
const createErrorResponse = (message, statusCode = 400) => {
  return NextResponse.json({ error: message }, { status: statusCode });
};

// GET request to read mentees based on filters
export async function GET(req) {
  try {
    await connect();
    const { searchParams } = new URL(req.url);
    const year = searchParams.get('year');
    const term = searchParams.get('term');
    const semester = searchParams.get('semester');
    const section = searchParams.get('section');
    const mentorMujid = searchParams.get('mentorMujid');

    const filters = {};
    if (year) filters.year = parseInt(year, 10); // parse year as integer
    if (term) filters.term = term;
    if (semester) filters.semester = semester;
    if (section) filters.section = section;
    if (mentorMujid) filters.mentorMujid = mentorMujid;

    console.log('Filters applied:', filters); // Log the filters

    const mentees = await Mentee.find(filters);
    console.log('Mentees found:', mentees); // Log the mentees found
    if (!mentees.length) {
      return createErrorResponse("No mentees found", 404);
    }

    return NextResponse.json(mentees, { status: 200 });
  } catch (error) {
    console.error("Server error:", error);
    return createErrorResponse("Something went wrong on the server", 500);
  }
}
