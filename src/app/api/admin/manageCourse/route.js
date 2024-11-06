import { connect } from "@/app/helper/dbConfig";
import { Course } from "@/lib/dbModels/dbModels";
import { NextResponse, NextRequest } from "next/server";
import Joi from "joi";

const courseSchema = Joi.object({
  title: Joi.string().required(),
  courseCode: Joi.string().required(),
  description: Joi.string().default("No Description Provided"),
  forSemester: Joi.string().required(),
  isEven: Joi.boolean().default(false),
  courseCredit: Joi.string().required(),
  courseClassification: Joi.string().required(), //LAB OR THEORY
  courseType: Joi.string().required(), //CORE OR ELECTIVE
});

export async function POST(req) {
  try {
    await connect();
    const {
      title,
      courseCode,
      description,
      forSemester,
      isEven,
      courseCredit,
      courseClassification,
      courseType,
    } = await req.json();

    const { error } = courseSchema.validate({
      title,
      courseCode,
      description,
      forSemester,
      isEven,
      courseCredit,
      courseClassification,
      courseType,
    });

    if (error)
      return NextResponse.json(
        { error: error.details[0].message },
        { status: 400 }
      );

    const existingCourse = await Course.findOne({ courseCode });
    if (existingCourse)
      return NextResponse.json(
        { error: "Course With Same Course Code Already Exist!" },
        { status: 400 }
      );

    const newCourse = new Course({
      title,
      courseCode,
      description,
      forSemester,
      isEven,
      courseCredit,
      courseClassification,
      courseType,
    });
    if (forSemester % 2 == 0) {
      newCourse.isEven = true;
    } else {
      newCourse.isEven = false;
    }
    await newCourse.save();

    return NextResponse.json(
      { message: "Course successfully" },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating course:", error);
    return NextResponse.json(
      { message: "Failed to create course", error: error.message },
      { status: 500 }
    );
  }
}

export async function GET() {
  await connect();
  const course = await Course.find({});

  // const course = await Course.find({courseCode});

  return NextResponse.json({ course }, { status: 200 });
}

export async function DELETE(req) {
  await connect();
  const { courseCode } = await req.json();
  // console.log(courseCode);
  if (!courseCode) {
    return NextResponse.json(
      { message: "Course Code is required" },
      { status: 406 }
    );
  }
  try {
    const deletedCourse = await Course.findOneAndDelete({ courseCode });

    if (!deletedCourse) {
      return NextResponse.json(
        { message: "Failed To deleted Course With Code" + courseCode },
        { status: 406 }
      );
    }
    return NextResponse.json(
      { message: "Course deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 505 }
    );
  }
}
