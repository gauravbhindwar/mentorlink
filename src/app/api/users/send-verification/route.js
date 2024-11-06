import nodemailer from "nodemailer";
import jwt from "jsonwebtoken";
import { connect } from "@/app/helper/dbConfig";
import { User } from "@/lib/dbModels/dbModels";
import { NextRequest, NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";

export async function POST(req) {
  const body = await req.json();
  const { email } = body;

  // console.log("Received email:", email);

  if (!email) {
    return NextResponse.json({ message: "Email is required" }, { status: 400 });
  }

  try {
    await connect();

    const user = await User.findOne({ email });

    // console.log("Found user:", user);

    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    // Generate a unique secret key for the user
    const userSecretKey = uuidv4();

    // Generate JWT token with the unique secret key
    const verificationToken = jwt.sign({ email }, userSecretKey, {
      expiresIn: "1h",
    });

    // Store the secret key and set tokenUsed flag to false
    user.jwtSecretKey = userSecretKey;
    user.token = verificationToken;
    user.tokenUsed = false;
    await user.save();

    const transporter = nodemailer.createTransport({
      service: "gmail",
      host: "smtp.gmail.com",
      port: 587,
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Email Verification",
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Set Password</title>
          <style>
            body {
              margin: 0;
              padding: 0;
              background-color: #f5a623; /* Orange background */
              font-family: Arial, sans-serif;
            }
            .container {
              width: 100%;
              max-width: 600px;
              margin: 0 auto;
              background-color: white;
              padding: 20px;
              border-radius: 8px;
              text-align: center;
              box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
            }
            .button {
              display: inline-block;
              margin-top: 20px;
              padding: 15px 30px;
              font-size: 18px;
              color: white;
              background-color: #e67e22;
              text-decoration: none;
              border-radius: 5px;
              font-weight: bold;
              transition: background-color 0.3s ease, box-shadow 0.3s ease;
            }
            .button:hover {
              background-color: #d35400; /* Darker orange on hover */
              box-shadow: 0 6px 12px rgba(0, 0, 0, 0.2);
            }
            .button:active {
              background-color: #c0392b; /* Red on click */
              box-shadow: 0 3px 6px rgba(0, 0, 0, 0.2);
            }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>Set Password</h1>
            <p>Please set your password by clicking the button below:</p>
            <a href="${process.env.BASE_URL}/verify-email?token=${verificationToken}" class="button">Set Password</a>
          </div>
        </body>
        </html>
      `,
    };

    await transporter.sendMail(mailOptions);
    return NextResponse.json(
      { message: "Verification email sent" },
      { status: 202 }
    );
  } catch (error) {
    // console.log("Error sending email:", error);
    return NextResponse.json(
      { message: "Error sending email" },
      { status: 500 }
    );
  }
}

export async function PUT(req) {
  const body = await req.json();
  const { token } = body;

  if (!token) {
    return NextResponse.json(
      { message: "Verification token is required" },
      { status: 400 }
    );
  }

  try {
    // Decode the token to get the email
    const decoded = jwt.decode(token);
    const { email } = decoded;

    await connect();

    const user = await User.findOne({ email });

    // console.log("Found user:", user);

    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    // Check if the token has already been used
    if (user.tokenUsed) {
      return NextResponse.json(
        { message: "Token has already been used" },
        { status: 400 }
      );
    }

    // Verify the JWT token with the user's unique secret key
    jwt.verify(token, user.jwtSecretKey);

    // Update the user's verification status and set tokenUsed to true
    user.isVerified = true;
    user.tokenUsed = true;
    await user.save();

    return NextResponse.json(
      { message: "Email verified successfully" },
      { status: 200 }
    );
  } catch (error) {
    // console.log("Error verifying token:", error);
    return NextResponse.json(
      { message: "Invalid or expired token" },
      { status: 400 }
    );
  }
}
