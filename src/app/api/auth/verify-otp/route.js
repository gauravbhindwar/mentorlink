import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { connect } from "../../../../lib/dbConfig";
import { Mentor } from "../../../../lib/dbModels"; 

export async function POST(req) {
  try {
    console.log("API Called: /api/auth/verify-otp");
    await connect();

    const env = process.env.ENV || 'production';
    let token;
    let requestBody;    // Try to get request body for local authentication
    try {
      requestBody = await req.json();
    } catch {
      // If parsing fails, continue with token-based flow
    }

    // Extract token from Authorization header for external authentication
    const authHeader = req.headers.get("authorization");
    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.split(" ")[1];
    }

    // Handle local development with email + OTP
    if (env === 'local' && requestBody && requestBody.email && requestBody.otp) {
      console.log("🏠 Local authentication with email + OTP");
      
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

      console.log("✅ Local authentication successful. User Role:", user.role);

      // Prepare Response Object
      const response = NextResponse.json({
        success: true,
        message: "OTP verified successfully",
        role: user.role,
        MUJid: user.MUJid,
        email: user.email,
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

    // Handle production/external authentication with JWT token
    if (!token) {
      console.error("❌ Missing token in request");
      return NextResponse.json({ success: false, message: "Missing token" }, { status: 401 });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
      console.log("✅ Token Verified:", decoded);
    } catch (error) {
      console.error("❌ Token Verification Failed:", error.name, error.message);
      return NextResponse.json({ 
          success: false, 
          message: error.name === "TokenExpiredError" ? "Token expired" : "Invalid token" 
      }, { status: 401 });
    }
  
    // Find user by email for external authentication
    const user = await Mentor.findOne({ email: decoded.email });

    if (!user) {
      return NextResponse.json(
        { success: false, message: "User not found in database" },
        { status: 404 }
      );
    }

  
    if (!user.role || user.role.length === 0) {
      return NextResponse.json(
        { success: false, message: "User role missing" },
        { status: 403 }
      );
    }

    console.log("✅ External authentication successful. User Role:", user.role);

    // Prepare Response Object for external authentication
    const response = NextResponse.json({
      success: true,
      message: "Token verified, role set",
      role: user.role,
      MUJid: decoded.MUJid,
      email: decoded.email,
    });

    // Set cookie synchronously before returning
    response.cookies.set("UserRole", user.role.join(","), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 60 * 60 * 24, // 1 day
      path: "/",
    });

    return response;
  } catch (error) {
    console.error(" Error in verify-otp API:", error.message);
    return NextResponse.json(
      { success: false, message: "Server error", error: error.message },
      { status: 500 }
    );
  }
}


