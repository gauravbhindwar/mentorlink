import { connect } from "../../../helper/dbConfig";
import { Course } from "../../../../lib/dbModels/dbModels";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function GET() {
  const cookieStore = cookies();
  try {
    await connect();
    const evenSemesterSet = new Set();
    const oddSemesterSet = new Set();

    const courses = await Course.find({});
    courses.forEach((course) => {
      if (course.isEven) {
        evenSemesterSet.add(course.forSemester);
      } else {
        oddSemesterSet.add(course.forSemester);
      }
    });

    const evenSemester = Array.from(evenSemesterSet);
    const oddSemester = Array.from(oddSemesterSet);

    return NextResponse.json({ evenSemester, oddSemester }, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: "Error retrieving courses" },
      { status: 500 }
    );
  }
}
