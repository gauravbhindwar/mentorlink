import nodemailer from "nodemailer";
import smtpTransport from "nodemailer-smtp-transport";
import bcrypt from "bcryptjs";
import { connect } from "../../../../lib/dbConfig";
import { Mentor } from "../../../../lib/dbModels";
import { NextResponse } from "next/server";

// Function to generate a 6-digit OTP
const generateOtp = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Configure the nodemailer transport for sending emails
const transporter = nodemailer.createTransport(
  smtpTransport({
    service: "Gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
    tls: {
      rejectUnauthorized: false,
    },
  })
);

// Function to send OTP via email
const sendOtpEmail = async (email, otp) => {
  await transporter.sendMail({
    from: `"MentorLink" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: "Your MentorLink Verification Code",
    text: `Your verification code is ${otp}`,
    html: `
            <div style="
                font-family: 'Arial', sans-serif;
                max-width: 600px;
                margin: 0 auto;
                padding: 30px;
                background: #fff5eb;
            ">
                <div style="
                    background: #ffffff;
                    border-radius: 16px;
                    box-shadow: 0 4px 20px rgba(234, 88, 12, 0.1);
                    padding: 32px;
                    text-align: center;
                ">
                    <h1 style="
                        color: #ea580c;
                        font-size: 32px;
                        margin: 0 0 24px;
                    ">MentorLink</h1>

                    <h2 style="
                        color: #431407;
                        font-size: 24px;
                        margin: 0 0 16px;
                    ">Verification Required</h2>

                    <p style="color: #9a3412; margin: 0 0 24px;">
                        Please use the following code to verify your email:
                    </p>

                    <div style="
                        background: #ea580c;
                        color: white;
                        padding: 20px;
                        border-radius: 12px;
                        margin: 24px 0;
                        font-size: 32px;
                        font-weight: bold;
                        letter-spacing: 8px;
                    ">${otp}</div>

                    <p style="
                        color: #9a3412;
                        font-size: 14px;
                        margin: 24px 0;
                        padding: 12px;
                        background: #ffedd5;
                        border-radius: 8px;
                    ">This code will expire in 10 minutes</p>

                    <div style="
                        margin-top: 24px;
                        padding: 16px;
                        background: #fff7ed;
                        border-radius: 8px;
                        font-size: 13px;
                        color: #c2410c;
                    ">
                        If you didn't request this code, please ignore this email.
                    </div>
                </div>
            </div>
        `,
    priority: "high",
  });
};

// Function to check user based on store OTP in their document
const storeOtpForUser = async (email, otp) => {
  await connect();

  const user = await Mentor.findOne({ email });
  if (!user) {
    throw new Error(`${email} not found, please contact your admin`);
  }

  // Hash the OTP
  const hashedOtp = await bcrypt.hash(otp, 10);

  // Update user document
  user.otp = hashedOtp;
  user.otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
  user.isOtpUsed = false;

  // Save and verify
  await user.save();

  return user;
};

// Main POST handler to send OTP
export async function POST(req) {
  await connect();
  try {
    const { email, captchaToken } = await req.json();

    // Verify reCAPTCHA v3 token
    const captchaVerification = await fetch('https://www.google.com/recaptcha/api/siteverify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: `secret=${process.env.RECAPTCHA_SECRET_V3_KEY}&response=${captchaToken}`,
    });

    const captchaResult = await captchaVerification.json();

    // Check both success and score for v3
    if (!captchaResult.success || captchaResult.score < 0.5) {
      return NextResponse.json(
        { 
          success: false, 
          message: "Security check failed. Please try again.",
          score: captchaResult.score 
        },
        { status: 400 }
      );
    }

    if (!email) {
      return NextResponse.json(
        { success: false, message: "Email is required" },
        { status: 400 }
      );
    }

    // Generate OTP and send it via email
    const generatedOtp = generateOtp();
    await storeOtpForUser(email, generatedOtp); // Store OTP in user document
    await sendOtpEmail(email, generatedOtp); // Send OTP email

    return NextResponse.json(
      { success: true, message: "OTP sent" },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { success: false, message: error.message || "Error processing request" },
      { status: 500 }
    );
  }
}
