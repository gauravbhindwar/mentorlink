import mongoose from "mongoose";
import validator from "validator";

const { Schema } = mongoose;

const menteeSchema = new Schema(
    {
        mujid: {
            type: String,
            required: true,
            unique: true,
            validate: [validator.isAlphanumeric, "mujid contains invalid characters"],
        },
        yearOfRegistration: {
            type: Number,
            required: true,
            validate: {
                validator: (value) => {
                    const currentYear = new Date().getFullYear();
                    return value >= 1900 && value <= currentYear;
                },
                message: "Invalid year of registration",
            },
        },
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
            trim: true,
        },
        fatherName: {
            type: String,
            required: true,
            trim: true,
            validate: {
                validator: (value) => validator.isAlpha(value.replace(/\s/g, "")),
                message: "Father's name contains invalid characters",
            },
        },
        motherName: {
            type: String,
            required: true,
            trim: true,
            validate: {
                validator: (value) => validator.isAlpha(value.replace(/\s/g, "")),
                message: "Mother's name contains invalid characters",
            },
        },
        dateOfBirth: {
            type: String,
            required: false,
        },
        parentsPhone: {
            type: String,
            required: true,
            trim: true,
        },
        parentsEmail: {
            type: String,
            required: true,
            trim: true,
            lowercase: true,
            validate: [validator.isEmail, "Invalid parents' email format"],
        },
        mentorMujid: {
            type: String,
            required: true,
        },
        otp: { type: String },
        otpExpires: { type: Date },
        isOtpUsed: { type: Boolean, default: false }
    },
    { timestamps: true, toJSON: { getters: true }, toObject: { getters: true } }
);

menteeSchema.index({ email: 1 }, { unique: true, sparse: true });
menteeSchema.index({ mujid: 1 }, { unique: true, sparse: true });

const Mentee = mongoose.models.Mentee || mongoose.model("Mentee", menteeSchema);

export default Mentee;