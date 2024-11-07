import mongoose from "mongoose";
import validator from "validator";

const { Schema } = mongoose;

const mentorSchema = new Schema(
    {
        mujid: {
            type: String,
            required: true,
            unique: true,
            validate: [validator.isAlphanumeric, "mujid contains invalid characters"],
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
        assignedMentees: [
            {
                menteeMujid: {
                    type: String,
                    validate: [validator.isAlphanumeric, "mentee mujid contains invalid characters"],
                },
                year: {
                    type: Number,
                    validate: {
                        validator: (value) => value >= 1900 && value <= new Date().getFullYear(),
                        message: "Invalid year",
                    },
                },
                semester: {
                    type: Number,
                    min: 1,
                    max: 8,
                },
            },
        ],
    },
    { timestamps: true }
);

mentorSchema.index({ email: 1 }, { unique: true, sparse: true });

const Mentor = mongoose.models.Mentor || mongoose.model("Mentor", mentorSchema);

export default Mentor;
