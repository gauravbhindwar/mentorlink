import mongoose from 'mongoose';
import validator from 'validator';

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
      enum: ['mentor', 'admin', 'super admin'],
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
          const user = await this.constructor.findOne({ mujid: value });
          if (user && user.id !== this.id) {
            throw new Error("mujid already exists");
          }
          return true;
        },
        message: () => "The specified mujid is already in use",
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
      fatherName: {
        type: String,
        trim: true,
        validate: {
          validator: function (value) {
            return validator.isAlpha(value.replace(/\s/g, ''));
          },
          message: () => "Name contains invalid characters",
        },
      },
      motherName: {
        type: String,
        trim: true,
        validate: {
          validator: function (value) {
            return validator.isAlpha(value.replace(/\s/g, ''));
          },
          message: () => "Name contains invalid characters",
        },
      },
      dateOfBirth: {
        type: Date,
        required: true,
      },
      parentsPhone: {
        type: Number,
        required: true,
        unique: true,
        trim: true,
      },
      parentsEmail: {
        type: String,
        required: true,
        unique: false,
        trim: true,
        lowercase: true,
        validate: {
          validator: async function (value) {
            if (!validator.isEmail(value)) {
              throw new Error("Invalid email format");
            }
          },
        },
      },
    },
    password: {
      type: String,
      required: false,
    },
    token: {
      type: String,
      required: false,
      default: null,
    },
    tokenUsed: { type: Boolean, default: false },
    tokenExpiry: { type: Date },
    mentorMujid: {
      type: String,
      required: true,
    },  // Store mentor's mujid instead of ObjectId
  },
  { timestamps: true }
);

const Mentee = mongoose.models.Mentee || mongoose.model("Mentee", menteeSchema);

export { Mentor, Mentee };
