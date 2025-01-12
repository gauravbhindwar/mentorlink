import nodemailer from "nodemailer";
import smtpTransport from "nodemailer-smtp-transport";
import bcrypt from "bcryptjs";
import { connect } from "../../../../lib/dbConfig";
import { Mentor, Mentee, Admin } from "../../../../lib/dbModels";
import { NextResponse } from 'next/server';

// Function to generate a 6-digit OTP
const generateOtp = () => {
    return Math.floor(100000 + Math.random() * 900000).toString(); 
};

// Configure the nodemailer transport for sending emails
const transporter = nodemailer.createTransport(smtpTransport({
    service: 'Gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
    tls: {
        rejectUnauthorized: false
    }
}));

// Function to send OTP via email
const sendOtpEmail = async (email, otp) => {
    await transporter.sendMail({
        from: `"MentorLink" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: 'Your Verification Code',
        text: `Your verification code is ${otp}`,
        html: `
            <div style="
                font-family: 'Inter', Arial, sans-serif;
                max-width: 500px;
                margin: 0 auto;
                padding: 32px;
                background: linear-gradient(145deg, #ffffff, #f5f7fa);
                border: 1px solid #e1e4e8;
                border-radius: 20px;
            ">
                <div style="text-align: center;">
                    <div style="
                        font-size: 32px;
                        font-weight: 800;
                        background: linear-gradient(90deg, #667eea, #764ba2);
                        -webkit-background-clip: text;
                        -webkit-text-fill-color: transparent;
                        margin: 24px 0;
                        animation: fadeIn 2s ease-in-out;
                    ">
                        MENTOR<span style="
                            color: #764ba2;
                            -webkit-text-fill-color: #764ba2;
                        ">LINK</span>
                    </div>
                    
                    <h1 style="
                        color: #1a1f36;
                        font-size: 24px;
                        font-weight: 600;
                        margin: 0 0 16px;
                    ">Email Verification</h1>
                    
                    <p style="
                        color: #4f566b;
                        font-size: 15px;
                        line-height: 1.5;
                        margin: 0 0 24px;
                    ">Use this verification code to complete your sign-in process:</p>
                    
                    <div style="
                        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                        padding: 20px;
                        border-radius: 12px;
                        margin: 24px 0;
                        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
                    ">
                        <p style="
                            font-size: 32px;
                            letter-spacing: 8px;
                            font-weight: 700;
                            color: #ffffff;
                            margin: 0;
                            text-shadow: 1px 1px 2px rgba(0,0,0,0.1);
                        ">${otp}</p>
                    </div>
                    
                    <p style="
                        color: #4f566b;
                        font-size: 13px;
                        margin: 24px 0;
                        padding: 12px;
                        background-color: #f7fafc;
                        border-radius: 8px;
                    ">⚠️ This code will expire in 10 minutes</p>
                    
                    <div style="
                        margin-top: 32px;
                        padding: 16px;
                        background-color: #fafbfc;
                        border-radius: 8px;
                        border: 1px solid #edf2f7;
                    ">
                        <p style="
                            font-size: 13px;
                            color: #64748b;
                            margin: 0;
                        ">If you didn't request this code, please ignore this email.</p>
                    </div>
                </div>
            </div>
            <style>
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(-20px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            </style>
        `,
        headers: {
            'X-Priority': '1 (Highest)',
            'X-MSMail-Priority': 'High',
            'Importance': 'High'
        }
    });
};

// Function to check user based on role and store OTP in their document
const storeOtpForUser = async (email, role, otp) => {
    let User;
    switch (role) {
        case 'mentor':
            User = Mentor;
            break;
        case 'admin':
        case 'superadmin': // Combined case for both admin types
            User = Admin;
            break;
        case 'mentee':
            User = Mentee;
            break;
        default:
            throw new Error("Invalid role");
    }

    await connect();
    
    const user = await User.findOne({ email });
    if (!user) {
        throw new Error(`${role} not found`);
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
    try {
        const { email, role } = await req.json();

        if (!email || !role) {
            return NextResponse.json(
                { success: false, message: "Email and role are required" },
                { status: 400 }
            );
        }

        // Generate OTP and send it via email
        const generatedOtp = generateOtp();
        await storeOtpForUser(email, role, generatedOtp); // Store OTP in user document
        await sendOtpEmail(email, generatedOtp); // Send OTP email

        return NextResponse.json({ success: true, message: "OTP sent" }, { status: 200 });
    } catch (error) {
        return NextResponse.json(
            { success: false, message: error.message || "Error processing request" },
            { status: 500 }
        );
    }
}