import { connect } from "../../../helper/dbConfig";
import { Course } from "../../../../lib/dbModels/dbModels";
import { NextResponse, NextRequest } from "next/server";

export async function POST(req) {
  // const admin = req.cookies.get("admin")?.value;
  // const MUJid = req.cookies.get("MUJid")?.value;
  // console.log("admin:", admin);
  // console.log("MUJid:", MUJid);
  const { isEven } = await req.json();

  if (typeof isEven !== "boolean") {
    return NextResponse.json(
      { message: "isEven must be a boolean value" },
      { status: 400 }
    );
  }
  try {
    await connect();

    const courses = await Course.find({ isEven });
    //set makes sure that duplicate values are not added
    const semesters = [...new Set(courses.map((course) => course.forSemester))]; //destructuring so that values donnot repeat

    return NextResponse.json({ semesters }, { status: 200 });
  } catch (error) {
    // console.error("Error retrieving courses:", error);
    return NextResponse.json(
      { message: "Error retrieving courses" },
      { status: 500 }
    );
  }
}
