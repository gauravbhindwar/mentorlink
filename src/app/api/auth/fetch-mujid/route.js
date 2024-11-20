import { Mentor, Mentee, Admin } from "../../../../lib/dbModels";
import { NextResponse } from "next/server";
import { connect } from "../../../../lib/dbConfig"; // Add database connection

export async function POST(req) {
    await connect(); // Connect to the database
    const { email, role } = await req.json();
    let user;
    if (role === "mentor") {
        // Updated query for nested structure
        user = await Mentor.findOne({
            'academicRecords.sessions.mentorInfo.email': email
        });
        
        if (user) {
            const session = user.academicRecords
                .flatMap(record => record.sessions)
                .find(session => session.mentorInfo.email === email);
                
            return NextResponse.json({ 
                mujid: session.mentorInfo.MUJid 
            }, { status: 200 });
        }
    } else if (role === "mentee") {
        user = await Mentee.findOne({ email });
    } else if (role === "admin" || role === "superadmin") {
        user = await Admin.findOne({ email });
    }
    return NextResponse.json({ error: "User not found" }, { status: 404 });
}

