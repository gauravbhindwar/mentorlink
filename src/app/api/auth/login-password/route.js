import { NextResponse } from "next/server";
import { connect } from "@/lib/dbConfig";
import { Mentor } from "@/lib/db/mentorSchema";
import { Admin } from "@/lib/db/adminSchema";
import bcrypt from "bcryptjs";

export async function POST(req) {
  try {
    await connect();
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { success: false, message: "Email and password are required" },
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
    if (!user.password || !user.isPasswordSet) {
      return NextResponse.json(
        { success: false, message: "No password set for this account. Please use OTP login." },
        { status: 400 }
      );
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    
    if (!isPasswordValid) {
      return NextResponse.json(
        { success: false, message: "Invalid password" },
        { status: 401 }
      );
    }

    // Create response with user info
    const response = NextResponse.json({
      success: true,
      message: "Login successful",
      role: user.role,
      MUJid: user.MUJid,
      mujid: user.MUJid,
      email: user.email,
      name: user.name,
      token: "authenticated"
    });

    // Set cookie
    response.cookies.set("UserRole", user.role.join(","), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 60 * 60 * 24, // 24 hours
      path: "/",
    });

    return response;

  } catch (error) {
    console.error("Error during password login:", error);
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 }
    );
  }
}
