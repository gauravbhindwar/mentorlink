import { connect } from "../../../helper/dbConfig";
import { User } from "../../../../lib/dbModels/dbModels";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function GET() {
  const cookieStore = cookies();
  const MUJid = cookieStore.get("MUJid")?.value;
  try {
    await connect();
    const user = await User.findOne({ mujid: MUJid });
    if (user) {
      return NextResponse.json({
        name: user.name,
        designation: user.designation,
        phone: user.phone,
        email: user.email,
      });
    } else {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
  } catch (error) {
    return NextResponse.json({ error: "Error fetching user" }, { status: 500 });
  }
}
