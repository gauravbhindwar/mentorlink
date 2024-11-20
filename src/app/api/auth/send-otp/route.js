import nodemailer from "nodemailer";
import bcrypt from "bcryptjs";
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

// Modified function to handle nested schema structure
const storeOtpForUser = async (email, role, otp) => {
    let User;
    let query;
    let update;

    const hashedOtp = await bcrypt.hash(otp, 10);
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    switch (role) {
        case 'mentor':
            User = Mentor;
            // Find mentor by email in nested structure
            query = { 'academicRecords.sessions.mentorInfo.email': email };
            update = {
                $set: {
                    'academicRecords.$[].sessions.$[session].mentorInfo.auth': {
                        otp: hashedOtp,
                        otpExpires: otpExpires,
                        isOtpUsed: false
                    }
                }
            };
            break;
        case 'admin':
        case 'superadmin':
            User = Admin;
            // Standard update for admin
            query = { email };
            update = {
                otp: hashedOtp,
                otpExpires: otpExpires,
                isOtpUsed: false
            };
            break;
        case 'mentee':
            User = Mentee;
            // Standard update for mentee
            query = { email };
            update = {
                otp: hashedOtp,
                otpExpires: otpExpires,
                isOtpUsed: false
            };
            break;
        default:
            throw new Error("Invalid role");
    }

    await connect();
    
    if (role === 'mentor') {
        const user = await User.findOne(query);
        if (!user) {
            throw new Error(`${role} not found`);
        }

        // Update auth info for all matching sessions
        await User.updateOne(
            query,
            update,
            {
                arrayFilters: [
                    { 'session.mentorInfo.email': email }
                ]
            }
        );
        return user;
    } else {
        // For non-mentor roles, use standard update
        const user = await User.findOneAndUpdate(query, update, { new: true });
        if (!user) {
            throw new Error(`${role} not found`);
        }
        return user;
    }
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

        const generatedOtp = generateOtp();
        await storeOtpForUser(email, role, generatedOtp);
        await sendOtpEmail(email, generatedOtp);

        return NextResponse.json({ 
            success: true, 
            message: "OTP sent successfully" 
        }, { status: 200 });
    } catch (error) {
        console.error('Error sending OTP:', error);
        return NextResponse.json(
            { 
                success: false, 
                message: error.message || "Error processing request" 
            },
            { status: 500 }
        );
    }
}