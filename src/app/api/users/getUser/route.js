import { connect } from "../../../helper/dbConfig";
import { User } from "../../../../lib/dbModels/dbModels";
import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    await connect();
    const { mujid } = await req.json();
    console.log("MUJid received:", mujid);

    const user = await User.findOne({ mujid });
    if (!user) {
      console.log("User not found");
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    console.log("User's form filled status:", user.isFormFilled);
    return NextResponse.json(
      { isFormFilled: user.isFormFilled },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error in request:", error);
    return NextResponse.json(
      { message: "Error in request", error: error.message },
      { status: 500 }
    );
  }
}
