import mongoose from "mongoose";
import validator from "validator";

const { Schema } = mongoose;

// Mentor Schema
const mentorSchema = new Schema(
  {
    mujid: {
      type: String,
      required: true,
      unique: true,
      validate: {
        validator: async function (value) {
          if (!validator.isAlphanumeric(value)) {
            throw new Error("mujid contains invalid characters");
          }
          const user = await this.constructor.findOne({ mujid: value });
          if (user && user.id !== this.id) {
            throw new Error("mujid already exists");
          }
          return true;
        },
        message: () => "The specified mujid is already in use",
      },
    },
    name: {
      type: String,
      required: true,
      trim: true,
      validate: {
        validator: function (value) {
          return validator.isAlpha(value.replace(/\s/g, ''));
        },
        message: () => "Name contains invalid characters",
      },
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      validate: {
        validator: async function (value) {
          if (!validator.isEmail(value)) {
            throw new Error("Invalid email format");
          }
          const user = await this.constructor.findOne({ email: value });
          if (user && user.id !== this.id) {
            throw new Error("email already exists");
          }
          return true;
        },
        message: () => "The specified email is already in use",
      },
    },
    phone: {
      type: Number,
      required: true,
      unique: true,
      trim: true,
    },
    role: {
      type: [String],
      enum: ['mentor', 'admin', 'superadmin'],
      default: ['mentor'],
    },  // Allow multiple roles
    meetingsScheduled: {
      type: Number,
      default: 0,  // Count of meetings scheduled for the current semester
    }
  },
  { timestamps: true }
);

const Mentor = mongoose.models.Mentor || mongoose.model("Mentor", mentorSchema);

// Mentee Schema
const menteeSchema = new Schema(
  {
    mujid: {
      type: String,
      required: true,
      unique: true,
      validate: {
        validator: async function (value) {
          if (!validator.isAlphanumeric(value)) {
            throw new Error("mujid contains invalid characters");
          }
          return true;
        },
        message: () => "The specified mujid is invalid",
      },
    },
    yearOfRegistration: {
      type: Number,
      required: true,
      validate: {
        validator: function (value) {
          const currentYear = new Date().getFullYear();
          return value >= 1900 && value <= currentYear;
        },
        message: () => "Invalid year of registration",
      },
    },
    menteePersonalDetails: {
      name: {
        type: String,
        required: true,
        trim: true,
        validate: {
          validator: function (value) {
            return validator.isAlpha(value.replace(/\s/g, ""));
          },
          message: () => "Name contains invalid characters",
        },
      },
      email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true,
        validate: {
          validator: function (value) {
            return validator.isEmail(value);
          },
          message: () => "Invalid email format",
        },
      },
      phone: {
        type: Number,
        required: true,
        trim: true,
      },
      fatherName: {
        type: String,
        required: true,
        trim: true,
        validate: {
          validator: function (value) {
            return validator.isAlpha(value.replace(/\s/g, ""));
          },
          message: () => "Father's name contains invalid characters",
        },
      },
      motherName: {
        type: String,
        required: true,
        trim: true,
        validate: {
          validator: function (value) {
            return validator.isAlpha(value.replace(/\s/g, ""));
          },
          message: () => "Mother's name contains invalid characters",
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
        validate: {
          validator: function (value) {
            return validator.isEmail(value);
          },
          message: () => "Invalid parents' email format",
        },
      },
    },
    mentorMujid: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

const Mentee = mongoose.models.Mentee || mongoose.model("Mentee", menteeSchema);

// Admin Schema
const adminSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      validate: {
        validator: function (value) {
          return validator.isAlpha(value.replace(/\s/g, ''));
        },
        message: () => "Name contains invalid characters",
      },
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      validate: {
        validator: async function (value) {
          if (!validator.isEmail(value)) {
            throw new Error("Invalid email format");
          }
          const user = await this.constructor.findOne({ email: value });
          if (user && user.id !== this.id) {
            throw new Error("email already exists");
          }
          return true;
        },
        message: () => "The specified email is already in use",
      },
    },
    password: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ['admin', 'superadmin'],
      default: 'admin',
    },
  },
  { timestamps: true }
);

const Admin = mongoose.models.Admin || mongoose.model("Admin", adminSchema);

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
      required: true,  // E.g., 3 or 4 for Semester 3 or 4
    },
    completed: {
      type: Boolean,
      default: false,  // Flag to indicate if the meeting was completed
    },
  },
  { timestamps: true }
);

const Meeting = mongoose.models.Meeting || mongoose.model("Meeting", meetingSchema);

export { Mentor, Mentee, Admin, Meeting };