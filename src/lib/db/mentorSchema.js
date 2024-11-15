import mongoose from "mongoose";

const mentorsSchema = new mongoose.Schema({
    name: { type: String, required: true }, // Full name of the mentor
    email: { type: String, required: true, unique: true }, // Unique email for the mentor
    MUJid: { type: String, required: true, unique: true  ,
        validate: {
        validator: (value) => /^[A-Z0-9]+$/.test(value),
        message: "mujid must be alphanumeric and uppercase, with no special characters or symbols",
    },}, // Unique MUJID for the mentor
    phone_number: { 
        type: String, 
        required: true,
        validate: {
            validator: (value) => /^\d{10}$/.test(value),
            message: "Phone number must be a 10-digit number"
        }
    }, // Contact number of the mentor
    address: { type: String }, // Mentor's address (optional)
    gender: { type: String }, // Gender of the mentor (optional)
    profile_picture: { type: String }, // URL to profile picture (optional)
    role: { type: [String], enum: ['mentor', 'admin', 'superadmin'], default: ['mentor'] }, // Role of the mentor
    created_at: { type: Date, default: Date.now }, // Creation date of the mentor record
    updated_at: { type: Date, default: Date.now }, // Last update timestamp for the mentor record
    otp: { type: String },
    otpExpires: { type: Date },
    isOtpUsed: { type: Boolean, default: false }
});

const Mentor = mongoose.models.Mentor || mongoose.model("Mentor", mentorsSchema);

export { Mentor };