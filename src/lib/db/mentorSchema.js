import mongoose from "mongoose";
import validator from "validator";

const { Schema } = mongoose;

const mentorSchema = new Schema(
    {
        mujid: {
            type: String,
            required: true,
            unique: true,
            validate: {
                validator: (value) => /^[A-Z0-9]+$/.test(value),
                message: "mujid must be alphanumeric and uppercase, with no special characters or symbols",
            },
        },
        name: {
            type: String,
            required: true,
            trim: true,
            validate: {
                validator: (value) => validator.isAlpha(value.replace(/\s/g, "")),
                message: "Name contains invalid characters",
            },
        },
        email: {
            type: String,
            required: true,
            unique: true,
            trim: true,
            lowercase: true,
            validate: [validator.isEmail, "Invalid email format"],
        },
        phone: {
            type: String,
            required: true,
            unique: true,
            trim: true,
        },
        role: {
            type: String,
            enum: ["mentor", "admin", "superadmin"],
            default: "mentor",
        },
        meetingsScheduled: {
            type: Number,
            default: 0,
        },
        otp: { type: String },
        otpExpires: { type: Date },
        isOtpUsed: { type: Boolean, default: false },
        year: {
            type: Number,
            required: false,
            validate: {
                validator: (value) => {
                    const currentYear = new Date().getFullYear();
                    return value >= currentYear - 20 && value <= currentYear;
                },
                message: "Year must be within the past 20 years and the current year",
            },
        },
        term: {
            type: String,
            enum: ["odd", "even"],
            required: false,
        },
        semester: {
            type: Number,
            min: 1,
            max: 8,
            required: false,
        },
        section: {
            type: String,
            required: false,
        }
    }
    ,

    { timestamps: true }
);

mentorSchema.index({ email: 1 }, { unique: true, sparse: true });
mentorSchema.index({ mujid: 1 }, { unique: true, sparse: true });

const Mentor = mongoose.models.Mentor || mongoose.model("Mentor", mentorSchema);

export default Mentor;
