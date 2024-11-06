import { connect } from "../../../helper/dbConfig";
import { Term } from "../../../../lib/dbModels/dbModels";
import { NextRequest, NextResponse } from "next/server";


export async function GET(req) {
  try {
    await connect();
    const terms = await Term.findOne({});
    const  forTerm  = terms.forTerm;
    return NextResponse.json({ forTerm }, { status: 200 });
  } catch (error) {
    // console.error("Error fetching terms:", error);
    return createErrorResponse("Error fetching terms", 500);
  }
}
export async function POST(req) {
  const { semestersInCurrentTerm = [] } = await req.json();

  try {
    await connect();
    // console.log(semestersInCurrentTerm);

    // my code here

    let forTerm;
    if (semestersInCurrentTerm[0] % 2 == 0) {
      forTerm = "EVEN";
    } else {
      forTerm = "ODD";
    }
    const existingTerm = await Term.findOne({});
    if (existingTerm) {
      existingTerm.forTerm = forTerm;
      existingTerm.semestersInCurrentTerm = semestersInCurrentTerm;
      await existingTerm.save();
      return NextResponse.json({
        status: 200,
        message: "Semester Set Successfully",
      });
    }

    const newTerm = await new Term({
      forTerm,
      semestersInCurrentTerm,
    });

    try {
      await newTerm.save();
    } catch (error) {
      // console.error("Error saving new Term:", error);
      return createErrorResponse("Error saving new Term", 500);
    }

    // my code here

    return NextResponse.json({
      status: 200,
      message: "Semester Set Successfully",
    });
  } catch (error) {
    // console.error("Error setting semesters:", error);
    return NextResponse.json({
      status: 500,
      message: "Failed to set semesters",
    });
  }
}


function createErrorResponse(message, status) {
  return NextResponse.json({
    status,
    message,
  });
}