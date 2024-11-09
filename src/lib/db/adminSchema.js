import mongoose from "mongoose";
import validator from "validator";

const { Schema } = mongoose;

const adminSchema = new Schema(
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
        role: {
            type: String,
            enum: ["admin", "superadmin"],
            default: "admin",
        },
        otp: { type: String },
        otpExpires: { type: Date },
        isOtpUsed: { type: Boolean, default: false }
    },
    { timestamps: true }
);

adminSchema.index({ email: 1 }, { unique: true, sparse: true });
adminSchema.index({ mujid: 1 }, { unique: true, sparse: true });

const Admin = mongoose.models.Admin || mongoose.model("Admin", adminSchema);

export default Admin;
