import { connect } from "../../../helper/dbConfig";
import { NextResponse } from "next/server";
import { Form, User } from "../../../../lib/dbModels/dbModels";
import { cookies } from "next/headers";

export async function GET() {
  const cookieStore = cookies();
  try {
    // Ensure DB connection
    await connect();
    // console.log("Database connected successfully");

    const users = await User.find({}).lean();
    // console.log("Users fetched from database:", users);

    const forms = await Form.find({}).lean();
    // console.log("Forms fetched from database:", forms);

    const formArray = forms.map((form) => {
      const { Name, mujid, allSelectedCourses, email, Phone, Designation } =
        form;

      const semesters = Object.keys(allSelectedCourses);

      const courses = Object.entries(allSelectedCourses)
        // .sort(([a], [b]) => parseInt(a) - parseInt(b))
        .map(([semester, courseData]) => [
          `${courseData.labCourses}`,
          `${courseData.theoryCourses}`,
        ]);

      return {
        Name,
        mujid,
        email,
        courses,
        semesters,
        Phone,
        Designation,
      };
    });

    return NextResponse.json({ formArray }, { status: 200 });
  } catch (error) {
    console.error("Error fetching form data:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
