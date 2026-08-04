import { NextResponse } from "next/server";
import { connect } from "@/lib/dbConfig";
import { Mentor } from "@/lib/db/mentorSchema";
import { Admin } from "@/lib/db/adminSchema";

export async function POST(req) {
  try {
    await connect();
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json(
        { success: false, message: "Email is required" },
        { status: 400 }
      );
    }

    // Check in Mentor collection
    let user = await Mentor.findOne({ email });
    
    // If not found in Mentor, check in Admin collection
    if (!user) {
      user = await Admin.findOne({ email });
    }

    if (!user) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 }
      );
    }

    // Check if user has password set
    const hasPassword = user.password && user.password !== null && user.isPasswordSet;

    return NextResponse.json({
      success: true,
      hasPassword: !!hasPassword
    });

  } catch (error) {
    console.error("Error checking password status:", error);
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 }
    );
  }
}
