import mongoose from "mongoose";

const adminSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    MUJid: { type: String, required: true, unique: true },
    phone_number: { type: String, required: true },
    role: { type: [String], enum: ['mentor', 'admin', 'superadmin'], default: ['admin'] }, // Allow 'mentor' as a valid value
    created_at: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now },
    otp: { type: String },
    otpExpires: { type: Date },
    isOtpUsed: { type: Boolean, default: false },
    isVerified: { type: Boolean, default: false }  // Add this new field
});

// Update methods to handle OTP state
adminSchema.methods.resetOtp = function() {
    this.otp = undefined;
    this.otpExpires = undefined;
    this.isOtpUsed = false;
    // Don't reset isVerified here
};

adminSchema.methods.markOtpAsUsed = function() {
    this.isOtpUsed = true;
    this.isVerified = true;  // Set verified state
    this.otp = undefined;
    this.otpExpires = undefined;
};

// Update pre-save middleware
adminSchema.pre('save', function(next) {
    if (this.isModified('otp')) {
        // If new OTP is being set
        if (this.otp) {
            this.isOtpUsed = false;
        }
    }
    if (this.isModified('updated_at')) {
        this.updated_at = Date.now();
    }
    next();
});

const Admin = mongoose.models.Admin || mongoose.model("Admin", adminSchema);

export { Admin };