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
        message: () => "The specified mujid is already in use",   // can be used to show error popup message by sending props
      },
    },
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
        message: () => "The specified email is already in use",   // can be used to show error popup message by sending props
      },
    },
    role: {
      type: String,
      enum: ['mentor', 'admin', 'superadmin'],
      default: 'mentor'
    },
    admin: {
      type: Schema.Types.ObjectId,
      ref: 'Admin',
      required: function () {
        return this.role !== 'mentor';
      }
    }
  },
  { timestamps: true }
);

const Mentor = mongoose.models.Mentor || mongoose.model("Mentor", mentorSchema);

// Mentee schema
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
    password: {
      type: String,
      required: true
    },
    token: {
      type: String,
      required: false,
      default: null,
    },
    tokenUsed: { type: Boolean, default: false },
    tokenExpiry: { type: Date },
    // courses: [{ type: Schema.Types.ObjectId, ref: "Course" }],
  },
  { timestamps: true }
);

const Mentee = mongoose.models.Mentee || mongoose.model("Mentee", menteeSchema);

// Admin schema
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
      required: true
    },
    role: {
      type: String,
      enum: ['admin', 'superadmin'],
      default: 'admin'
    }
  },
  { timestamps: true }
);

const Admin = mongoose.models.Admin || mongoose.model("Admin", adminSchema);




export { Mentor, Mentee, Admin };
