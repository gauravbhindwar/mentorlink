import nodemailer from "nodemailer";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { connect } from "../../../../lib/dbConfig";
import { Mentor, Mentee, Admin } from "../../../../lib/dbModels";
import { NextResponse } from 'next/server';

const JWT_SECRET = process.env.JWT_SECRET || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIxMjM0NTYiLCJlbWFpbCI6InVzZXJAZXhhbXBsZS5jb20iLCJyb2xlIjoidXNlciIsImlhdCI6MTczMTA4MTQzOCwiZXhwIjoxNzMxMDg1MDM4fQ.WNjWN2xXGtVsXBXxb7M0m-ZoDXZtphRfVIEX7yV29O0'

// Function to generate a 6-digit OTP
const generateOtp = () => {
    return Math.floor(100000 + Math.random() * 900000).toString(); 
};

// Function to generate JWT for the OTP
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const generateOtpToken = (otp) => {
    const payload = { otp };
    return jwt.sign(payload, JWT_SECRET, { expiresIn: '10m' }); // Token expires in 10 minutes
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
            User = Admin;
            break;
        case 'superadmin':
            User = Admin; // Assuming Admin for both Admin and SuperAdmin roles
            break;
        default:
            throw new Error("Invalid role");
    }

    await connect();
    
    const user = await User.findOne({ email });
    if (!user) {
        throw new Error(`${role} not found`);
    }

    // Hash the OTP before storing it
    const hashedOtp = await bcrypt.hash(otp, 10);

    // Store hashed OTP in the user document
    user.otp = hashedOtp;
    user.otpExpires = Date.now() +  10 * 60 * 1000; // OTP expires in 10 minutes
    user.isOtpUsed = false; // To mark if OTP is used

    await user.save();
};

// Function to verify OTP based on role and email
const verifyOtpForUser = async (email, role, otp) => {
    let User;
    switch (role) {
        case 'mentor':
            User = Mentor;
            break;
        case 'mentee':
            User = Mentee;
            break;
        case 'admin':
            User = Admin;
            break;
        case 'superadmin':
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

    // Check if OTP matches, hasn't expired, and hasn't been used
    const isOtpValid = await bcrypt.compare(otp, user.otp);
    if (isOtpValid && user.otpExpires > Date.now() && !user.isOtpUsed) {
        user.isOtpUsed = true; // Mark OTP as used
        await user.save();
        return true; // OTP is valid
    }

    return false; // OTP is invalid or expired
};

// Main POST handler to send OTP or verify it
export async function POST(req) {
    const { email, role, otp } = await req.json();

    if (!email || !role) {
        return NextResponse.json(
            { message: "Email and role are required" },
            { status: 400 }
        );
    }

    try {
        if (otp) {
            // Verify OTP
            const isOtpValid = await verifyOtpForUser(email, role, otp);
            if (isOtpValid) {
                return NextResponse.json({ message: "OTP verified" }, { status: 200 });
            } else {
                return NextResponse.json({ message: "Invalid or expired OTP" }, { status: 400 });
            }
        } else {
            // Generate OTP and send it via email
            const generatedOtp = generateOtp();
            await storeOtpForUser(email, role, generatedOtp); // Store OTP in user document
            await sendOtpEmail(email, generatedOtp); // Send OTP email

            return NextResponse.json({ message: "OTP sent" }, { status: 200 });
        }
    } catch (error) {
        console.error(error);
        return NextResponse.json(
            { message: "Error processing request" },
            { status: 500 }
        );
    }
}