import { Mentor, Mentee, Admin } from "../../../../lib/dbModels";
import { NextResponse } from "next/server";
import { connect } from "../../../../lib/dbConfig"; // Add database connection

export async function POST(req) {
    await connect(); // Connect to the database
    const { email, role } = await req.json();
    let user;
    if (role === "mentor") {
        user = await Mentor.findOne({ email });
    } else if (role === "mentee") {
        user = await Mentee.findOne({ email });
    } else if (role === "admin" || role === "superadmin") {
        user = await Admin.findOne({ email });
    }
    if (user) {
        return NextResponse.json({ mujid: user.mujid }, { status: 200 });
    } else {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
}

