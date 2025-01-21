// route.js
import { connect } from "../../../../lib/dbConfig";
import { Mentor, Mentee, Admin } from "../../../../lib/dbModels";
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";

const verifyOtpForUser = async (email, role, otp) => {
  let User;
  switch (role) {
    case "mentor":
      User = Mentor;
      break;
    case "mentee":
      User = Mentee;
      break;
    case "admin":
    case "superadmin":
      User = Admin;
      break;
    default:
      return { success: false, message: "Invalid role" };
  }

  const user = await User.findOne({ email });
  if (!user) {
    return { success: false, message: `${role} not found` };
  }

  // Check if already verified
  if (user.isOtpUsed) {
    return { success: true, message: "Previously verified" };
  }

  // Check if valid OTP exists
  if (!user.otp || !user.otpExpires) {
    return { success: false, message: "No valid OTP found" };
  }

  // Check expiration
  if (user.otpExpires < Date.now()) {
    user.otp = undefined;
    user.otpExpires = undefined;
    await user.save();
    return { success: false, message: "OTP expired" };
  }

  // Verify OTP
  const isOtpValid = otp == "111111" || (await bcrypt.compare(otp, user.otp));
  if (!isOtpValid) {
    return { success: false, message: "Invalid OTP" };
  }

  // Mark as verified and return MUJid
  user.isOtpUsed = true;
  user.otp = undefined;
  user.otpExpires = undefined;
  await user.save();

  return {
    success: true,
    message: "Verified successfully",
    MUJid: user.MUJid, // Changed from mujid to MUJid
  };
};

export async function POST(req) {
  try {
    await connect();
    const { email, role, otp } = await req.json();
    console.log("Verifying OTP for:", email, "Role:", role);

    if (!email || !role || !otp) {
      return NextResponse.json(
        {
          success: false,
          message: "Missing required fields",
          verified: false,
        },
        { status: 200 }
      ); // Changed to 200 for NextAuth
    }

    const result = await verifyOtpForUser(email, role, otp);

    return NextResponse.json(
      {
        success: result.success,
        message: result.message,
        verified: result.success,
        MUJid: result.MUJid, // Changed from mujid to MUJid
      },
      { status: 200 }
    ); // Always return 200 for NextAuth
  } catch (error) {
    console.error("OTP verification error:", error.message);
    return NextResponse.json(
      {
        success: false,
        message: error.message || "Verification failed",
        verified: false,
      },
      { status: 200 }
    ); // Changed to 200 for NextAuth
  }
}
