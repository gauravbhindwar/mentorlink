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
            name: { type: String, default: null },
            email: { type: String, default: null },
            phone: { type: String, default: null },
            alternatePhone: { type: String, default: null }
        },
        mother: {
            name: { type: String, default: null },
            email: { type: String, default: null },
            phone: { type: String, default: null },
            alternatePhone: { type: String, default: null }
        },
        guardian: {
            name: { type: String, default: null },
            email: { type: String, default: null },
            phone: { type: String, default: null },
            relation: { type: String, default: null }
        }
    },
    mentorMujid: { 
        type: String,
        required: function() {
            return this.mentorMujid !== null;
        },
        default: null
    },
    mentorEmailid:{
        type: String,
        required: function() {
            return this.mentorEmailid !== null;
        },
        default: null
    },
    otp: { type: String },
    otpExpires: { type: Date },
    isOtpUsed: { type: Boolean, default: false },
    
    created_at: { 
        type: Date, 
        default: () => new Date() 
    },
    updated_at: { 
        type: Date, 
        default: () => new Date() 
    }
});

// Add pre-save middleware to update timestamps
menteesSchema.pre('save', function(next) {
    this.updated_at = new Date();
    if (!this.created_at) {
        this.created_at = new Date();
    }
    next();
});

const Mentee = mongoose.models.Mentee || mongoose.model("Mentee", menteesSchema);

export { Mentee };