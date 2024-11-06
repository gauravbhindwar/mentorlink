import { connect } from "@/app/helper/dbConfig";
import { User } from "@/lib/dbModels/dbModels";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const token = searchParams.get("token");

  if (!token) {
    return NextResponse.json({ message: "Token is required" }, { status: 400 });
  }

  try {
    // Connect to the database
    await connect();

    // Find the user by verification token
    const user = await User.findOne({ verificationToken: token });

    if (!user) {
      return NextResponse.json({ message: "Invalid token" }, { status: 400 });
    }

    // Redirect to the verify-email page with the token
    return NextResponse.redirect(`/verify-email?token=${token}`);
  } catch (error) {
    console.log("Error verifying token:", error);
    return NextResponse.json(
      { message: "Error verifying token" },
      { status: 500 }
    );
  }
}
