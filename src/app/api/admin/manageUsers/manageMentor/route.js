import { connect } from "../../../../../lib/dbConfig";
import { Mentor } from "../../../../../lib/dbModels";
import { NextResponse } from "next/server";

// POST request handler
export async function POST(req) {
  try {
    await connect();
    const mentorData = await req.json();

    // Required fields validation
    const requiredFields = ['name', 'email', 'MUJid', 'phone_number', 'academicYear', 'academicSession'];
    const missingFields = requiredFields.filter(field => !mentorData[field]);
    
    if (missingFields.length > 0) {
      return NextResponse.json({ 
        error: `Missing required fields: ${missingFields.join(', ')}` 
      }, { status: 400 });
    }

    // Create new mentor with the schema structure
    const newMentor = new Mentor({
      name: mentorData.name,
      email: mentorData.email,
      MUJid: mentorData.MUJid,
      phone: mentorData.phone_number,
      mentorMujid: mentorData.MUJid, // Same as MUJid for mentors
      academicYear: mentorData.academicYear,
      academicSession: mentorData.academicSession,
      created_at: new Date(),
      updated_at: new Date()
    });

    const savedMentor = await newMentor.save();
    return NextResponse.json(savedMentor, { status: 201 });

  } catch (error) {
    if (error.code === 11000) {
      return NextResponse.json({ 
        error: "A mentor with this MUJid or email already exists" 
      }, { status: 400 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// GET request handler
export async function GET(req) {
  try {
    await connect();
    const { searchParams } = new URL(req.url);
    
    const query = {};
    if (searchParams.get('academicYear')) {
      query.academicYear = searchParams.get('academicYear');
    }
    if (searchParams.get('academicSession')) {
      query.academicSession = searchParams.get('academicSession');
    }

    const mentors = await Mentor.find(query);
    return NextResponse.json({ mentors });

  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PUT request handler
export async function PUT(req) {
  try {
    await connect();
    const { MUJid, ...updateData } = await req.json();

    const updatedMentor = await Mentor.findOneAndUpdate(
      { MUJid },
      { 
        ...updateData,
        updated_at: new Date() 
      },
      { new: true }
    );

    if (!updatedMentor) {
      return NextResponse.json({ error: "Mentor not found" }, { status: 404 });
    }

    return NextResponse.json(updatedMentor);

  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE request handler
export async function DELETE(req) {
  try {
    await connect();
    const { MUJid } = await req.json();

    if (!MUJid) {
      return NextResponse.json({ error: "MUJid is required" }, { status: 400 });
    }

    const deletedMentor = await Mentor.findOneAndDelete({ MUJid });

    if (!deletedMentor) {
      return NextResponse.json({ error: "Mentor not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "Mentor deleted successfully" });

  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
