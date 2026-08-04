import { NextResponse } from "next/server";
import { connect } from "@/lib/dbConfig";
import { Mentor } from "@/lib/db/mentorSchema";
import { Admin } from "@/lib/db/adminSchema";
import bcrypt from "bcryptjs";

export async function POST(req) {
  try {
    await connect();
    const { email, password, otp } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { success: false, message: "Email and password are required" },
        { status: 400 }
      );
    }

        // Password validation is handled on the frontend

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

    // Note: OTP verification is handled in the verify-otp step
    // For password creation, we don't verify OTP again since it was already verified

    // Hash the new password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Update user with new password
    user.password = hashedPassword;
    user.isPasswordSet = true;
    
    // Mark OTP as used if it was provided (for security)
    if (otp) {
      user.isOtpUsed = true;
    }
    
    await user.save();

    // Create response with user info
    const response = NextResponse.json({
      success: true,
      message: "Password created successfully",
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
    console.error("Error creating password:", error);
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 }
    );
  }
}
