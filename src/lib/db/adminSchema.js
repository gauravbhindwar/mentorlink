import mongoose from "mongoose";
import validator from "validator";

const { Schema } = mongoose;

const adminSchema = new Schema(
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
        otp: { type: String },
        otpExpires: { type: Date },
        isOtpUsed: { type: Boolean, default: false },
        phone: {
            type: String,
            required: true,
            validate: {
                validator: function(value) {
                    // Allow +91 prefix (optional) followed by 10 digits
                    return /^(\+91)?[6-9]\d{9}$/.test(value);
                },
                message: "Invalid phone number. Must be a valid Indian phone number"
            },
        },
        roles: {
            type: [String],
            enum: ["mentor", "admin", "superadmin"],
            default: ["admin"],
        },
    },
    { timestamps: true }
);

adminSchema.index({ email: 1 }, { unique: true, sparse: true });
adminSchema.index({ mujid: 1 }, { unique: true, sparse: true });

const Admin = mongoose.models.Admin || mongoose.model("Admin", adminSchema);

export default Admin;
