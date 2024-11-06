import { NextResponse } from "next/server";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { connect } from "../../../helper/dbConfig";
import { User } from "../../../../lib/dbModels/dbModels";

export async function POST(req) {
  const body = await req.json();
  const { token, password } = body;
  await connect();
  const decoded = jwt.decode(token);
  if (!decoded || !decoded.email) {
    return NextResponse.json(
      { message: "Invalid or expired token" },
      { status: 407 }
    );
  }
  const { email } = decoded;
  const dbToken = await User.findOne({ email });

  try {
    try {
      if (token && !password) {
        if (dbToken.token === null) {
          return NextResponse.json(
            { message: "token_not_found" },
            { status: 407 }
          );
        }
        try {
          const user1 = await User.findOne({ email });
          if (!user1) {
            return NextResponse.json(
              { message: "Invalid token" },
              { status: 400 }
            );
          }
          // console.log(user1.token);
          user1.token = null;
          await user1.save();
          if (!decoded || !decoded.email) {
            return NextResponse.json(
              { message: "Invalid or expired token" },
              { status: 400 }
            );
          }
          const user = await User.findOne({ email });
          const tokenUsed = user.tokenUsed;
          if (tokenUsed) {
            return NextResponse.json(
              { message: "token_used" },
              { status: 400 }
            );
          } else {
            return NextResponse.json(
              { message: "token_not_used" },
              { status: 200 }
            );
          }
        } catch (error) {
          return NextResponse.json(
            { message: "Invalid or expired token" },
            { status: 400 }
          );
        }
      }

      if (!token || !password) {
        return NextResponse.json(
          { message: "Token and password are required" },
          { status: 400 }
        );
      }

      const userPass = await User.findOne({ email });

      if (userPass.tokenUsed) {
        return NextResponse.json(
          { message: "Token has already been used" },
          { status: 400 }
        );
      }

      try {
        jwt.verify(token, userPass.jwtSecretKey);
      } catch (error) {
        return NextResponse.json(
          { message: "Invalid or expired token" },
          { status: 400 }
        );
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      userPass.tokenUsed = true;
      userPass.password = hashedPassword;
      await userPass.save();

      return NextResponse.json(
        { message: "Password updated successfully" },
        { status: 200 }
      );
    } catch (error) {
      return NextResponse.json(
        { message: "An error occurred while processing the request" },
        { status: 500 }
      );
    }
  } catch (error) {
    return NextResponse.json(
      { message: "An error occurred while processing the request" },
      { status: 501 }
    );
  }
}
