import { connect } from "../../../helper/dbConfig";
import { Course } from "../../../../lib/dbModels/dbModels";
import { NextResponse } from "next/server";

export async function POST(req) {
  await connect(); // Ensure database connection

  try {
    const body = await req.json();
    // console.log("Received body:", body); // Log received data

    if (!Array.isArray(body)) {
      return NextResponse.json(
        { message: "Invalid data format" },
        { status: 400 } // Bad Request
      );
    }

    // Process and validate each course
    for (const course of body) {
      if (
        !course.title ||
        !course.forSemester ||
        !course.courseClassification ||
        !course.courseCode ||
        !course.courseCredit ||
        !course.courseType
      ) {
        return NextResponse.json(
          { message: "Missing required fields in one or more courses" },
          { status: 400 } // Bad Request
        );
      }

      // Determine if the semester is even
      const semesterNumber = parseInt(course.forSemester, 10);
      const isEven = semesterNumber % 2 === 0;

      // Add the isEven property to the course object
      const courseWithEvenFlag = { ...course, isEven };

      // Create and save each course
      const newCourse = new Course(courseWithEvenFlag);
      await newCourse.save();
    }

    return NextResponse.json(
      { message: "Courses added successfully" },
      { status: 201 } // Created
    );
  } catch (error) {
    // console.error("Error adding courses:", error); // Log error details
    return NextResponse.json(
      { message: "Failed to add courses", error: error.message },
      { status: 500 } // Internal Server Error
    );
  }
}

export async function GET() {
  await connect();

  try {
    const courses = await Course.find({});
    return NextResponse.json(
      { message: "Courses retrieved successfully", courses },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { message: "Failed to retrieve courses", error: error.message },
      { status: 500 }
    );
  }
}

export async function PUT(req) {
  await connect();

  try {
    const courses = await req.json();
    if (!Array.isArray(courses) || courses.length === 0) {
      return NextResponse.json(
        { message: "Course codes are required" },
        { status: 400 } // Bad Request
      );
    }

    const results = [];
    for (const { courseCode, ...updateData } of courses) {
      if (!courseCode) {
        results.push({ courseCode, message: "Course code is required" });
        continue;
      }

      const updatedCourse = await Course.findOneAndUpdate(
        { courseCode },
        updateData,
        {
          new: true,
        }
      );
      if (!updatedCourse) {
        results.push({ courseCode, message: "Course not found" });
      } else {
        results.push({
          courseCode,
          message: "Course updated successfully",
          course: updatedCourse,
        });
      }
    }

    return NextResponse.json(results, { status: 200 });
  } catch (error) {
    // console.error("Error updating courses:", error); // Log error details
    return NextResponse.json(
      { message: "Failed to update courses", error: error.message },
      { status: 500 } // Internal Server Error
    );
  }
}

export async function DELETE(req) {
  await connect();

  try {
    const courses = await req.json();
    if (!Array.isArray(courses) || courses.length === 0) {
      return NextResponse.json(
        { message: "Course codes are required" },
        { status: 400 } // Bad Request
      );
    }

    const results = [];
    for (const { courseCode } of courses) {
      if (!courseCode) {
        results.push({ courseCode, message: "Course code is required" });
        continue;
      }

      const deletedCourse = await Course.findOneAndDelete({ courseCode });
      if (!deletedCourse) {
        results.push({ courseCode, message: "Course not found" });
      } else {
        results.push({
          courseCode,
          message: "Course deleted successfully",
          course: deletedCourse,
        });
      }
    }

    return NextResponse.json(results, { status: 200 });
  } catch (error) {
    // console.error("Error deleting courses:", error); // Log error details
    return NextResponse.json(
      { message: "Failed to delete courses", error: error.message },
      { status: 500 } // Internal Server Error
    );
  }
}
