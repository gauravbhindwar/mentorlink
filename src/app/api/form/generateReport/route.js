import { NextResponse } from "next/server";
import { connect } from "../../../helper/dbConfig";
import { Form } from "../../../../lib/dbModels/dbModels";

export async function POST(req) {
  try {
    await connect();

    // Parse the request body to get the mujid
    const { mujid } = await req.json();

    // Fetch the form data for the specific user from the database
    const form = await Form.findOne({ mujid }).lean();

    if (!form) {
      return NextResponse.json({ error: "Form not found" }, { status: 404 });
    }

    // Prepare the report data
    const reportData = {
      name: form.Name,
      mujid: form.mujid,
      email: form.email,
      allSelectedCourses: form.allSelectedCourses,
      isEven: form.isEven ? "Yes" : "No",
    };

    return NextResponse.json(reportData, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
