import mongoose from "mongoose";

const menteesSchema = new mongoose.Schema({
    name: { type: String, required: true }, // Full name of the mentee
    email: { type: String, required: true, unique: true }, // Unique email for the mentee
    MUJid: { type: String, required: true, unique: true  ,
        validate: {
        validator: (value) => /^[A-Z0-9]+$/.test(value),
        message: "mujid must be alphanumeric and uppercase, with no special characters or symbols",
    },}, // Unique MUJID for the mentee
    phone: { 
        type: String, 
        required: true,
        validate: {
            validator: (value) => /^\d{10}$/.test(value),
            message: "Phone number must be a 10-digit number"
        }
    }, // Contact number of the mentee
    address: { type: String, default: '' }, // Change to have a default empty string
    dob: { type: Date, required: false }, // Change to not required
    gender: { type: String }, // Gender of the mentee (optional)
    profile_picture: { type: String }, // URL to profile picture (optional)
    yearOfRegistration: {    type: Number,
        required: true,
        validate: {
            validator: (value) => {
                const currentYear = new Date().getFullYear();
                return value >= 1900 && value <= currentYear;
            },
            message: "Invalid year of registration",
        },}, // Year of registration for the mentee
    section: { type: String, required: true },
    current_semester: { type: Number, required: true, min: 1, max: 8 },
    startYear: { type: Number, required: true }, // Add startYear field
    endYear: { type: Number, required: true }, // Add endYear field
    academicSession: { type: String, required: true }, // Add academicSession field
    parents: {
        father: {
            name: { type: String },
            email: { type: String },
            phone: { type: String },
            alternatePhone: { type: String }
        },
        mother: {
            name: { type: String },
            email: { type: String },
            phone: { type: String },
            alternatePhone: { type: String }
        },
        guardian: {
            name: { type: String },
            email: { type: String },
            phone: { type: String },
            relation: { type: String }
        }
    },
    created_at: { type: Date, default: Date.now }, // Creation date of the mentee record
    updated_at: { type: Date, default: Date.now }, // Last update timestamp for the mentee record
    otp: { type: String },
    otpExpires: { type: Date },
    isOtpUsed: { type: Boolean, default: false }
});

const Mentee = mongoose.models.Mentee || mongoose.model("Mentee", menteesSchema);

export { Mentee };