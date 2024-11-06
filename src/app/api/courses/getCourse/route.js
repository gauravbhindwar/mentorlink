import { connect } from "../../../helper/dbConfig"; // Adjust the path if needed
import { Course } from "../../../../lib/dbModels/dbModels";
import { NextResponse } from "next/server";

export async function POST(req) {
  await connect();
  try {
    const body = await req.json();
    const { courseClassification, forSemester } = body;

    // console.log("Received body:", body);

    const courses = await Course.find({
      courseClassification,
      forSemester,
    });

    // console.log("Courses fetched:", courses);

    return NextResponse.json({ courses }, { status: 200 });
  } catch (error) {
    // console.error("Error getting courses:", error);
    return NextResponse.json(
      { message: "Error getting courses" },
      { status: 500 }
    );
  }
}
