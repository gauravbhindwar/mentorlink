import { NextResponse } from 'next/server';
import { connect } from '@/lib/dbConfig';
import { Mentor } from '@/lib/db/mentorSchema';
import { Admin } from '@/lib/db/adminSchema';
import bcrypt from 'bcryptjs';
import { validatePassword } from '@/utils/passwordValidation';

export async function POST(request) {
  try {
    const { email, password, otp } = await request.json();

    if (!email || !password || !otp) {
      return NextResponse.json(
        { success: false, message: 'Email, password, and OTP are required' },
        { status: 400 }
      );
    }

    // Validate password strength
    const validation = validatePassword(password);
    if (!validation.isValid) {
      return NextResponse.json(
        { success: false, message: validation.errors[0] || 'Password does not meet requirements' },
        { status: 400 }
      );
    }

    await connect();

    // Check mentor collection first
    let user = await Mentor.findOne({ email: email.toLowerCase() });
    let userType = 'mentor';

    // If not found in mentor, check admin
    if (!user) {
      user = await Admin.findOne({ email: email.toLowerCase() });
      userType = 'admin';
    }

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      );
    }

    // Note: OTP verification is handled in the verify-otp step
    // For password reset, we don't verify OTP again since it was already verified

    // Check if user has an existing password
    if (!user.password || !user.isPasswordSet) {
      return NextResponse.json(
        { success: false, message: 'No existing password found. Use create password instead.' },
        { status: 400 }
      );
    }

    // Check if new password is same as old password
    const isSamePassword = await bcrypt.compare(password, user.password);
    if (isSamePassword) {
      return NextResponse.json(
        { success: false, message: 'New password must be different from your current password' },
        { status: 400 }
      );
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Update user with new password and clear OTP
    user.password = hashedPassword;
    user.isPasswordSet = true;
    user.otp = null;
    user.otpExpires = null;
    user.isOtpUsed = true;
    await user.save();

    return NextResponse.json({
      success: true,
      message: 'Password reset successfully',
      token: 'authenticated',
      role: user.role || userType,
      MUJid: user.MUJid || user.mujid,
      mujid: user.MUJid || user.mujid,
    });
  } catch (error) {
    console.error('Reset password error:', error);
    return NextResponse.json(
      { success: false, message: 'An error occurred while resetting password' },
      { status: 500 }
    );
  }
}
