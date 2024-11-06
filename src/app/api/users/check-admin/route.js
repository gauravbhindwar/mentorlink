import { NextResponse } from "next/server";
import { connect } from "@/app/helper/dbConfig";
import { User } from "@/lib/dbModels/dbModels";
import { serialize } from "cookie"; // Import serialize

export async function POST(req) {
  const { email } = await req.json();
  try {
    await connect();
    const user = await User.findOne({ email });
    if (user && user.isAdmin) {
      const cookie = serialize("admin", "true", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "development",
        maxAge: 60 * 60 * 24 * 7, // 1 week
        sameSite: "strict",
        path: "/",
      });
      const cookie2 = serialize("MUJid", user.mujid, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "development",
        maxAge: 60 * 60 * 24 * 7, // 1 week
        sameSite: "strict",
        path: "/",
      });

      const response = NextResponse.json({ success: true }, { status: 200 });
      response.headers.append("Set-Cookie", cookie);
      response.headers.append("Set-Cookie", cookie2);
      return response;
    } else {
      return NextResponse.json({ success: false }, { status: 200 });
    }
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
