import mongoose from "mongoose";
import validator from "validator";

const { Schema } = mongoose;

// Mentor Schema
// Mentor Schema
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
      default: 0, // Count of meetings scheduled for the current semester
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
          max: 8, // Assuming semesters go from 1 to 8
        },
      },
    ], // This is now optional
  },
  { timestamps: true }
);

// Mentee Schema
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
    menteePersonalDetails: {
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
        type: Date,
        required: true,
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
    },
    mentorMujid: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

// Admin Schema
const adminSchema = new Schema(
  {
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
    password: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ["admin", "superadmin"],
      default: "admin",
    },
  },
  { timestamps: true }
);

// Meeting Schema
const meetingSchema = new Schema(
  {
    mentor: {
      type: Schema.Types.ObjectId,
      ref: "Mentor",
      required: true,
    },
    mentee: {
      type: Schema.Types.ObjectId,
      ref: "Mentee",
      required: true,
    },
    date: {
      type: Date,
      required: true,
    },
    topic: {
      type: String,
      required: true,
    },
    notes: {
      type: String,
    },
    feedback: {
      type: String,
    },
    semester: {
      type: Number,
      required: true, // E.g., 3 or 4 for Semester 3 or 4
    },
    completed: {
      type: Boolean,
      default: false, // Flag to indicate if the meeting was completed
    },
  },
  { timestamps: true }
);

// Adding sparse unique indexes to prevent duplicate errors for null values
mentorSchema.index({ email: 1 }, { unique: true, sparse: true });
menteeSchema.index({ "menteePersonalDetails.email": 1 }, { unique: true, sparse: true });
adminSchema.index({ email: 1 }, { unique: true, sparse: true });

// Exporting models
const Mentor = mongoose.models.Mentor || mongoose.model("Mentor", mentorSchema);
const Mentee = mongoose.models.Mentee || mongoose.model("Mentee", menteeSchema);
const Admin = mongoose.models.Admin || mongoose.model("Admin", adminSchema);
const Meeting = mongoose.models.Meeting || mongoose.model("Meeting", meetingSchema);

export { Mentor, Mentee, Admin, Meeting };
