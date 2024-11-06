import { NextResponse } from "next/server";
import { connect } from "@/app/helper/dbConfig";
import { User } from "@/lib/dbModels/dbModels";
import bcrypt from "bcrypt";
import { serialize } from "cookie";

export async function POST(request) {
  const { email, password } = await request.json();

  try {
    await connect();
    const user = await User.findOne({ email });

    if (user && user.password) {
      const isMatch = await bcrypt.compare(password, user.password);
      if (isMatch) {
        // Set cookies
        const cookie = serialize("user", "true", {
          httpOnly: true,
          secure: process.env.NODE_ENV !== "development",
          maxAge: 60 * 60 * 24 * 7, // 1 week
          sameSite: "strict",
          path: "/",
        });

        const cookie2 = serialize("MUJid", user.mujid, {
          httpOnly: true,
          secure: process.env.NODE_ENV !== "development",
          maxAge: 60 * 60 * 24 * 7, // 1 week
          sameSite: "strict",
          path: "/",
        });

        const response = NextResponse.json({ success: true });
        response.headers.append("Set-Cookie", cookie);
        response.headers.append("Set-Cookie", cookie2);
        return response;
      } else {
        return NextResponse.json({ success: false }, { status: 401 });
      }
    } else {
      return NextResponse.json({ success: false }, { status: 401 });
    }
  } catch (error) {
    return NextResponse.json({ message: "Error logging in" }, { status: 500 });
  }
}
