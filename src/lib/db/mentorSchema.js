import mongoose from "mongoose";

const mentorsSchema = new mongoose.Schema({
    name: { type: String, required: true }, // Full name of the mentor
    email: { type: String, required: true, unique: true }, // Unique email for the mentor
    MUJid: { 
        type: String, 
        required: true, 
        unique: true,
        uppercase: true,
        validate: {
            validator: function(v) {
                return /^[A-Z0-9]+$/.test(v);
            },
            message: props => `${props.value} is not a valid MUJid! Must be uppercase alphanumeric only.`
        }
    }, // Unique MUJID for the mentor
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
    academicYear: { type: String, required: true }, // Academic year of the mentor
    academicSession: { type: String, required: true }, // Academic session of the mentor
    created_at: { type: Date, default: Date.now }, // Creation date of the mentor record
    updated_at: { type: Date, default: Date.now }, // Last update timestamp for the mentor record
    otp: { type: String },
    otpExpires: { type: Date },
    isOtpUsed: { type: Boolean, default: false }
});

// Add a pre-save middleware to ensure MUJid is uppercase
mentorsSchema.pre('save', function(next) {
    if (this.MUJid) {
        this.MUJid = this.MUJid.toUpperCase();
    }
    next();
});

const Mentor = mongoose.models.Mentor || mongoose.model("Mentor", mentorsSchema);

export { Mentor };