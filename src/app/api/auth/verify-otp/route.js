import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { connect } from "../../../../lib/dbConfig";
import { Mentor } from "../../../../lib/dbModels"; 

export async function POST(req) {
  try {
    console.log("API Called: /api/auth/verify-otp");
    await connect();

    let requestBody;    // Try to get request body for authentication
    try {
      requestBody = await req.json();
    } catch {
      // If parsing fails, continue
    }

    // Handle authentication with email + OTP (if provided)
    if (requestBody && requestBody.email && requestBody.otp) {
      console.log("🏠 Authentication with email + OTP");
      
      const { email, otp } = requestBody;

      // Find user by email
      const user = await Mentor.findOne({ email });

      if (!user) {
        return NextResponse.json(
          { success: false, message: "User not found" },
          { status: 404 }
        );
      }

      // Check if OTP exists and is not expired
      if (!user.otp || !user.otpExpires || user.isOtpUsed) {
        return NextResponse.json(
          { success: false, message: "Invalid or expired OTP" },
          { status: 400 }
        );
      }

      // Check if OTP is expired
      if (new Date() > user.otpExpires) {
        return NextResponse.json(
          { success: false, message: "OTP has expired" },
          { status: 400 }
        );
      }

      // Verify OTP
      const isOtpValid = await bcrypt.compare(otp, user.otp);
      if (!isOtpValid) {
        return NextResponse.json(
          { success: false, message: "Invalid OTP" },
          { status: 400 }
        );
      }

      // Mark OTP as used
      user.isOtpUsed = true;
      await user.save();

      if (!user.role || user.role.length === 0) {
        return NextResponse.json(
          { success: false, message: "User role missing" },
          { status: 403 }
        );
      }

      console.log("✅ Authentication successful. User Role:", user.role);

      // Check if user needs to set up password
      const needsPasswordSetup = !user.password || !user.isPasswordSet;

      // Prepare Response Object
      const response = NextResponse.json({
        success: true,
        message: "OTP verified successfully",
        role: user.role,
        MUJid: user.MUJid,
        mujid: user.MUJid,
        email: user.email,
        name: user.name,
        needsPasswordSetup: needsPasswordSetup,
        token: "authenticated"
      });

      // Set cookie
      response.cookies.set("UserRole", user.role.join(","), {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 60 * 60 * 24, // 1 day
        path: "/",
      });

      return response;
    }

    // If no valid authentication method provided, return error
    return NextResponse.json({ success: false, message: "Invalid authentication method" }, { status: 400 });
  } catch (error) {
    console.error(" Error in verify-otp API:", error.message);
    return NextResponse.json(
      { success: false, message: "Server error", error: error.message },
      { status: 500 }
    );
  }
}


