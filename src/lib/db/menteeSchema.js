import mongoose from "mongoose";

const menteesSchema = new mongoose.Schema({
    name: { type: String, required: true }, 
    email: { type: String, required: true, unique: true },
    MUJid: { type: String, required: true, unique: true  ,
        validate: {
        validator: (value) => /^[A-Z0-9]+$/.test(value),
        message: "mujid must be alphanumeric and uppercase, with no special characters or symbols",
    },},
    phone: {
        type: String,
        required: false,
        validate: {
            validator: (value) => /^\d{10}$/.test(value),
            message: "Phone number must be a 10-digit number"
        }
    },
    address: { 
        type: String,
        default: ''  // Provide a default empty string
    },
    yearOfRegistration: {    type: Number,
        required: true,
        validate: {
            validator: (value) => {
                const currentYear = new Date().getFullYear();
                return value >= 1900 && value <= currentYear;
            },
            message: "Invalid year of registration",
        },},
    section: { type: String, required: true },
    semester: { type: Number, required: true, min: 1, max: 8 },
    academicYear: { type: String, required: true },
    academicSession: { type: String, required: true },
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
    mentorMujid: { 
        type: String,
        required: function() {
            // Only required if it's not being unassigned
            return this.mentorMujid !== null;
        },
        default: null
    },
    mentorEmailid:{
        type: String,
        required: function() {
            return this.mentorEMailid !== null;
        },
        default: null
    },
    created_at: { type: Date, default: Date.now }, // Creation date of the mentee record
    updated_at: { type: Date, default: Date.now }, // Last update timestamp for the mentee record
    otp: { type: String },
    password: { type: String },
    otpExpires: { type: Date },
    isOtpUsed: { type: Boolean, default: false }
});

const Mentee = mongoose.models.Mentee || mongoose.model("Mentee", menteesSchema);

export { Mentee };