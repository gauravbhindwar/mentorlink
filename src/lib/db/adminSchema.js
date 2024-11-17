import mongoose from "mongoose";

const adminSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    MUJid: { type: String, required: true, unique: true },
    phone_number: { type: String, required: true },
    role: { type: [String], enum: ['mentor', 'admin', 'superadmin'], default: ['admin'] }, // Allow 'mentor' as a valid value
    created_at: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now },
    otp: { type: String },
    otpExpires: { type: Date },
    isOtpUsed: { type: Boolean, default: false }
});

const Admin = mongoose.models.Admin || mongoose.model("Admin", adminSchema);

export { Admin };