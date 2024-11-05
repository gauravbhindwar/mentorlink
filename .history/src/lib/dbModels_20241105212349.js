import mongoose from "mongoose";

const { Schema } = mongoose;

const mentorSchema = new Schema(
  {
    mujid: {
      type: String,
      required: true,
      unique: true,
      validate: {
        validator: async function (value) {
          const user = await this.constructor.findOne({ mujid: value });
          if (user && user.id !== this.id) {
            throw new Error("mujid already exists");
          }
          return true;
        },
        message: (props) => "The specified mujid is already in use",   // can be used to show error popup message by sending props
      },
    },
    name: {
      type: String,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      validate: {
        validator: async function (value) {
          const user = await this.constructor.findOne({ email: value });
          if (user && user.id !== this.id) {
            throw new Error("email already exists");
          }
          return true;
        },
        message: (props) => "The specified email address is already in use",         // can be used to show error popup message by sending props
      },
    },
    phone: {
      type: String,
      unique: false,
      sparse: true, // This allows multiple documents with null values for the phone field
    },
    password: {
      type: String,
      required: false,
    },
    designation: {
      type: String,
      unique: false,
      required: false,
    },
    lastLogin: {
      type: Date,
      default: Date.now,
    },
    isVerfied: {
      type: Boolean,
      default: false,
    },
    jwtSecretKey: {
      type: String,
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

const Mentor = mongoose.models.Mentor || mongoose.model("Mentor", mentorSchema);

//Mentee schema

const menteeSchema = new Schema(
  {
    mujid: {
      type: String,
      required: true,
      unique: true,
      validate: {
        validator: async function (value) {
          const user = await this.constructor.findOne({ mujid: value });
          if (user && user.id !== this.id) {
            throw new Error("mujid already exists");
          }
          return true;
        },
        message: (props) => "The specified mujid is already in use",   // can be used to show error popup message by sending props
      },
    },
    name: {
      type: String,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      validate: {
        validator: async function (value) {
          const user = await this.constructor.findOne({ email: value });
          if (user && user.id !== this.id) {
            throw new Error("email already exists");
          }
          return true;
        },
        message: (props) => "The specified email address is already in use",         // can be used to show error popup message by sending props
      },
    },
    phone: {
      type: String,
      unique: false,
      sparse: true, // This allows multiple documents with null values for the phone field
    },
    password: {
      type: String,
      required: false,
    },
    designation: {
      type: String,
      unique: false,
      required: false,
    },
    lastLogin: {
      type: Date,
      default: Date.now,
    },
    isVerfied: {
      type: Boolean,
      default: false,
    },
    jwtSecretKey: {
      type: String,
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



const formSchema = new Schema(
  {
    allSelectedCourses: {
      type: Map,
      of: {
        labCourses: String,
        theoryCourses: String,
      },
      required: true,
    },
    Name: {
      type: String,
      required: true,
      default: "Name Not Added",
    },
    mujid: {
      type: String,
      required: true,
    },
    Phone: {
      type: String,
      unique: false,
      sparse: true, // This allows multiple documents with null values for the phone field
    },
    Designation: {
      type: String,
      unique: false,
      sparse: true,
    },
    email: {
      type: String,
      required: true,
    },
    isEven: {
      type: Boolean,
      required: true,
      default: false,
    },
  },
  { timestamps: true }
);

const Form = mongoose.models.Form || mongoose.model("Form", formSchema);

const termSchema = new Schema(
  {
    forTerm: {
      type: String,
      required: true,
    },
    semestersInCurrentTerm: {
      type: [Number],
      required: true,
    },
  },
  { timestamps: true }
);
const Term = mongoose.models.Term || mongoose.model("Term", termSchema);

export { Mentor, Term, Course, Form };
