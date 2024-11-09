import nodemailer from "nodemailer";
import bcrypt from "bcrypt";
import { connect } from "../../../../lib/dbConfig";
import { Mentor, Mentee, Admin } from "../../../../lib/dbModels";
import { NextResponse } from 'next/server';

// Function to generate a 6-digit OTP
const generateOtp = () => {
    return Math.floor(100000 + Math.random() * 900000).toString(); 
};

// Configure the nodemailer transport for sending emails
const transporter = nodemailer.createTransport({
    service: 'Gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

// Function to send OTP via email
const sendOtpEmail = async (email, otp) => {
    await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: email,
        subject: 'Your OTP Code',
        text: `Your OTP is ${otp}`,
    });
};

// Function to check user based on role and store OTP in their document
const storeOtpForUser = async (email, role, otp) => {
    let User;
    switch (role) {
        case 'mentor':
            User = Mentor;
            break;
        case 'mentee':
            User = Mentee;
            break;
        case 'admin':
        case 'superadmin': // Combined case for both admin types
            User = Admin;
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
    const { email, role } = await req.json();

    if (!email || !role) {
        return NextResponse.json(
            { success: false, message: "Email and role are required" },
            { status: 400 }
        );
    }

    try {
        // Generate OTP and send it via email
        const generatedOtp = generateOtp();
        await storeOtpForUser(email, role, generatedOtp); // Store OTP in user document
        await sendOtpEmail(email, generatedOtp); // Send OTP email

        return NextResponse.json({ success: true, message: "OTP sent" }, { status: 200 });
    } catch (error) {
        return NextResponse.json(
            { success: false, message: "Error processing request" },
            { status: 500 }
        );
    }
}