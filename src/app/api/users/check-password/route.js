import { connect } from "@/app/helper/dbConfig";
import { User } from "@/lib/dbModels/dbModels";
import { NextResponse } from "next/server";

export async function POST(req) {
  const { email } = await req.json();

  try {
    await connect();
    const user = await User.findOne({ email });
    if (user) {
      if (!user.password) {
        return NextResponse.json({ isPasswordEmpty: true }, { status: 200 });
      } else {
        return NextResponse.json({ isPasswordEmpty: false }, { status: 200 });
      }
    } else {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }
  } catch (error) {
    return NextResponse.json(
      { message: "Error checking password status" },
      { status: 500 }
    );
  }
}
