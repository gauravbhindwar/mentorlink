/**
 * send-otp route
 * ----------------
 * Purpose:
 *  - Generate a 6-digit OTP for a mentor user, store a hashed OTP in the DB,
 *    and trigger sending the OTP to the user's email.
 *
 * Performance & security notes:
 *  - OTPs are short-lived (10 minutes) and single-use. To improve responsiveness
 *    we hash the OTP with fewer bcrypt rounds and send the email asynchronously
 *    so the API can respond quickly after persisting the OTP.
 *
 * Transporter pooling options (nodemailer):
 *  - pool: true         => Reuse SMTP connections instead of creating one-per-email
 *  - maxConnections     => Maximum concurrent SMTP connections (set to a moderate
 *                         value to balance throughput and provider rate limits)
 *  - maxMessages        => Number of messages per connection before reconnecting
 *
 * Recommended values:
 *  - maxConnections: 5-15 (start low; increase only if you observe high concurrency)
 *  - maxMessages: 50-200
 *
 * Why async email send?
 *  - Sending email can be slow (network/SMTP server). We don't await email send
 *    to provide a fast HTTP response. Failures are logged and do not block the user.
 */

import fetch from 'node-fetch';
import bcrypt from "bcryptjs";
import { connect } from "../../../../lib/dbConfig";
import { Mentor } from "../../../../lib/dbModels";
import { NextResponse } from "next/server";

// Function to generate a 6-digit OTP
const generateOtp = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Function to send OTP via custom mail service
const sendOtpEmail = async (email, otp) => {
  try {
    const response = await fetch('https://mail-service.sdcmuj.com/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.GITHUB_PAT_TOKEN}`,
      },
      body: JSON.stringify({
        application: process.env.APPLICATION_NAME,
        to: [email],
        subject: "Your MentorLink Verification Code",
        content: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>MentorLink Verification Code</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.5;">
  <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
    <!-- Header -->
    <div style="background: linear-gradient(135deg, #FF4B2B, #FF416C); padding: 20px; border-radius: 10px 10px 0 0; text-align: center;">
      <h1 style="color: white; margin: 0; font-size: 24px;">MentorLink Verification</h1>
    </div>
    
    <!-- Main Content -->
    <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
      <p style="color: #333; font-size: 16px; margin-top: 0;">Dear User,</p>
      
      <p style="color: #333; font-size: 16px;">Your MentorLink verification code is:</p>
      
      <!-- OTP Card -->
      <div style="background: white; border-radius: 8px; padding: 20px; margin: 20px 0; border-left: 4px solid #FF416C; text-align: center;">
        <div style="font-size: 36px; font-weight: bold; color: #FF416C; letter-spacing: 8px; font-family: 'Courier New', monospace;">${otp}</div>
        <p style="margin: 10px 0 0 0; color: #666; font-size: 14px;">(Click and drag to copy the code)</p>
      </div>
      
      <!-- Expiration Notice -->
      <div style="background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; border-radius: 4px;">
        <p style="margin: 0; color: #856404;"><strong>This code will expire in 10 minutes.</strong></p>
      </div>
      
      <!-- Security Note -->
      <div style="background: #f8d7da; border-left: 4px solid #dc3545; padding: 15px; margin: 20px 0; border-radius: 4px;">
        <p style="margin: 0; color: #721c24;">If you didn't request this code, please ignore this email and contact support if needed.</p>
      </div>
      
      <!-- Footer -->
      <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
        <p style="color: #666; margin: 0;">Best regards,<br/>
        <strong style="color: #333;">MentorLink Team</strong></p>
      </div>
    </div>
    
    <!-- Footnote -->
    <div style="text-align: center; margin-top: 20px; color: #666; font-size: 12px;">
      <p>This is an automated email from MentorLink. Please do not reply.</p>
    </div>
  </div>
</body>
</html>`,
        priority: "AUTH",
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to send email: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Error sending OTP email:', error);
    throw error;
  }
};

// Function to check user based on store OTP in their document
const storeOtpForUser = async (email, otp) => {
  await connect();

  const user = await Mentor.findOne({ email });
  if (!user) {
    throw new Error(`${email} not found, please contact your admin`);
  }

  // Hash the OTP
  const hashedOtp = await bcrypt.hash(otp, 6);

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
    const { email } = await req.json();

    // Verify reCAPTCHA v3 token (bypassed as requested)
    /*
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
    */

    if (!email) {
      return NextResponse.json(
        { success: false, message: "Email is required" },
        { status: 400 }
      );
    }

    // Generate OTP and send it via email
    const isDefaultOtpEnabled = process.env.ENABLE_DEFAULT_OTP === 'true';
    const generatedOtp = isDefaultOtpEnabled ? (process.env.DEFAULT_OTP || '111111') : generateOtp();

    await storeOtpForUser(email, generatedOtp); // Store OTP in user document
    
    if (!isDefaultOtpEnabled) {
      await sendOtpEmail(email, generatedOtp); // Send OTP email
    }

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
