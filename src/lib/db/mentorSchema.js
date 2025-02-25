import mongoose from "mongoose";

const mentorsSchema = new mongoose.Schema({
  name: { type: String, default: null },
  email: { type: String, required: true, unique: true }, // Unique email for the mentor
  MUJid: {
    type: String,
    default: null,
    uppercase: true,
    validate: {
      validator: function (v) {
        return /^[A-Z0-9]+$/.test(v);
      },
      message: (props) =>
        `${props.value} is not a valid MUJid! Must be uppercase alphanumeric only.`,
    },
  }, // Unique MUJID for the mentor
  phone_number: {
    type: String,
    default: null,
  },
  isFirstTimeLogin: { type: Boolean, default: true }, // Flag to check if the mentor is logging in for the first time
  address: { type: String, default: null }, // Mentor's address (optional)
  gender: { type: String, default: null }, // Gender of the mentor (optional)
  profile_picture: { type: String, default: null }, // URL to profile picture (optional)
  role: {
    type: [String],
    enum: ["mentor", "admin", "superadmin"],
    default: ["mentor"],
  }, 
  academicYear: { type: String, default: null }, // Academic year of the mentor
  academicSession: { type: String, default: null }, // Academic session of the mentor
  created_at: { type: Date, default: Date.now }, // Creation date of the mentor record
  updated_at: { type: Date, default: Date.now }, // Last update timestamp for the mentor record
  otp: { type: String, default: null },
  otpExpires: { type: Date, default: null },
  isOtpUsed: { type: Boolean, default: false },
  isActive: { 
    type: Boolean, 
    default: true,
    required: true // Make it required to ensure it's always set
  },
});

// Add a pre-save middleware to ensure MUJid is uppercase and isActive is always boolean
mentorsSchema.pre("save", function (next) {
  if (this.isModified('isActive')) {
    this.isActive = Boolean(this.isActive);
  }
  if (this.MUJid) {
    this.MUJid = this.MUJid.toUpperCase();
  }
  next();
});

const Mentor =
  mongoose.models.Mentor || mongoose.model("Mentor", mentorsSchema);

export { Mentor };
