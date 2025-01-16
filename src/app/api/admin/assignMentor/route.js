import { connect } from "../../../../lib/dbConfig";
import { MentorMenteeRelationship } from "../../../../lib/db/mentorMenteeRelationshipSchema";
import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    await connect();
    const data = await req.json();
    
    const result = await MentorMenteeRelationship.assignMentor(data);
    
    return NextResponse.json({ message: "Assignment successful", data: result }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req) {
  try {
    await connect();
    const data = await req.json();
    
    const errors = await MentorMenteeRelationship.bulkAssign(data);
    
    if (errors.length > 0) {
      return NextResponse.json({ errors }, { status: 400 });
    }
    
    return NextResponse.json({ message: "Bulk assignment successful" }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
