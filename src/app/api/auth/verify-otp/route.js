// route.js
import { connect } from "../../../../lib/dbConfig";
import { Mentor, Mentee, Admin } from "../../../../lib/dbModels";
import { NextResponse } from 'next/server';
import bcrypt from "bcryptjs";

const verifyOtpForUser = async (email, role, otp) => {
    try {
        console.log('Connecting to database...');
        await connect();
        let User;

        switch (role.toLowerCase()) {
            case 'mentor':
                User = Mentor;
                console.log('Searching for mentor with email:', email);
                const mentor = await User.findOne({
                    'academicRecords.sessions.mentorInfo.email': email
                });

                if (!mentor) {
                    console.log('No mentor found with email:', email);
                    return { success: false, message: `No ${role} found with email ${email}` };
                }

                // Get the current session's mentor info
                const currentSession = mentor.academicRecords
                    .flatMap(record => record.sessions)
                    .find(session => session.mentorInfo.email === email);

                if (!currentSession) {
                    return { success: false, message: "Session not found" };
                }

                const mentorInfo = currentSession.mentorInfo;

                console.log('Found mentor:', {
                    email: mentorInfo.email,
                    hasOTP: !!mentorInfo.auth?.otp,
                    otpExpires: mentorInfo.auth?.otpExpires,
                    isUsed: mentorInfo.auth?.isOtpUsed
                });

                // If already verified, allow login
                if (mentorInfo.auth?.isVerified) {
                    return { 
                        success: true, 
                        message: "Already verified",
                        mujid: mentorInfo.MUJid,
                        isVerified: true
                    };
                }

                // Check if OTP exists
                if (!mentorInfo.auth?.otp) {
                    mentorInfo.auth = mentorInfo.auth || {};
                    mentorInfo.auth.otp = undefined;
                    mentorInfo.auth.otpExpires = undefined;
                    mentorInfo.auth.isOtpUsed = false;
                    await mentor.save();
                    return { 
                        success: false, 
                        message: "No valid OTP found. Please request a new OTP.",
                        requireNewOtp: true 
                    };
                }

                // Check if OTP is already used
                if (mentorInfo.auth.isOtpUsed) {
                    mentorInfo.auth.otp = undefined;
                    mentorInfo.auth.otpExpires = undefined;
                    await mentor.save();
                    return { success: false, message: "OTP has already been used" };
                }

                // Check OTP expiration
                if (mentorInfo.auth.otpExpires < Date.now()) {
                    mentorInfo.auth.otp = undefined;
                    mentorInfo.auth.otpExpires = undefined;
                    await mentor.save();
                    return { success: false, message: "OTP expired" };
                }

                // Verify OTP
                const mentorOtpValid = await bcrypt.compare(otp, mentorInfo.auth.otp);
                if (!mentorOtpValid) {
                    return { success: false, message: "Invalid OTP" };
                }

                // Mark OTP as used after successful verification
                mentorInfo.auth.isOtpUsed = true;
                mentorInfo.auth.isVerified = true;
                mentorInfo.auth.otp = undefined;
                mentorInfo.auth.otpExpires = undefined;
                await mentor.save();

                return { 
                    success: true, 
                    message: "Verified successfully",
                    mujid: mentorInfo.MUJid,
                    isVerified: true
                };

            case 'admin':
            case 'superadmin':
                User = Admin;
                console.log('Searching for admin with email:', email);
                const admin = await User.findOne({ 
                    email: { $regex: new RegExp(`^${email}$`, 'i') }
                });

                if (!admin) {
                    console.log('No admin found with email:', email);
                    return { success: false, message: `No ${role} found with email ${email}` };
                }

                console.log('Found admin:', {
                    email: admin.email,
                    hasOTP: !!admin.otp,
                    otpExpires: admin.otpExpires,
                    isUsed: admin.isOtpUsed,
                    isVerified: admin.isVerified
                });

                // If already verified, allow login
                if (admin.isVerified) {
                    return { 
                        success: true, 
                        message: "Already verified",
                        mujid: admin.MUJid,
                        isVerified: true
                    };
                }

                // Check if OTP exists
                if (!admin.otp) {
                    admin.resetOtp(); // Reset OTP state
                    await admin.save();
                    return { 
                        success: false, 
                        message: "No valid OTP found. Please request a new OTP.",
                        requireNewOtp: true 
                    };
                }

                // Check if OTP is already used
                if (admin.isOtpUsed) {
                    admin.resetOtp(); // Reset OTP state for next use
                    await admin.save();
                    return { success: false, message: "OTP has already been used" };
                }

                // Check OTP expiration
                if (admin.otpExpires < Date.now()) {
                    admin.resetOtp();
                    await admin.save();
                    return { success: false, message: "OTP expired" };
                }

                // Verify OTP
                const adminOtpValid = await bcrypt.compare(otp, admin.otp);
                if (!adminOtpValid) {
                    return { success: false, message: "Invalid OTP" };
                }

                // Mark OTP as used after successful verification
                admin.markOtpAsUsed();
                await admin.save();

                return { 
                    success: true, 
                    message: "Verified successfully",
                    mujid: admin.MUJid,
                    isVerified: true
                };

            default:
                return { success: false, message: "Invalid role" };
        }
    } catch (error) {
        console.error('Verification error:', error);
        throw error;
    }
};

export async function POST(req) {
    try {
        const { email, role, otp } = await req.json();
        console.log('Starting OTP verification for:', { email, role, hasOTP: !!otp });

        if (!email || !role || !otp) {
            return NextResponse.json({
                success: false,
                message: "Missing required fields",
                verified: false
            }, { status: 400 });
        }

        const result = await verifyOtpForUser(email, role, otp);
        
        // If OTP needs to be regenerated
        if (result.requireNewOtp) {
            return NextResponse.json({
                success: false,
                message: result.message,
                verified: false,
                requireNewOtp: true
            }, { status: 401 }); // Use 401 for authentication failure requiring new OTP
        }
        
        return NextResponse.json({
            ...result,
            verified: result.success
        }, { status: result.success ? 200 : 400 });

    } catch (error) {
        console.error('OTP verification error:', error);
        return NextResponse.json({
            success: false,
            message: "Verification failed: " + error.message,
            verified: false
        }, { status: 500 });
    }
}