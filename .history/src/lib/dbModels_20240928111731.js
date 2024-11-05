import mongoose from "mongoose";

const { Schema } = mongoose;

const userSchema = new Schema(
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
        message: (props) => "The specified mujid is already in use",
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
        message: (props) => "The specified email address is already in use",
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
    ext: {
      type: String,
      required: false,
    },
    designation: {
      type: String,
      unique: false,
      required: false,
    },
    isAdmin: {
      type: Boolean,
      required: false,
      default: false,
    },
    lastLogin: {
      type: Date,
      default: Date.now,
    },
    isVerfied: {
      type: Boolean,
      default: false,
    },
    isFormFilled: {
      type: Boolean,
      required: false,
      default: false, // need to reset this every time when admin enable option to fill form (from false to true)
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
    courses: [{ type: Schema.Types.ObjectId, ref: "Course" }],
  },
  { timestamps: true }
);

const User = mongoose.models.User || mongoose.model("User", userSchema);
const courseSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
      default: "Description Not Added",
    },
    forSemester: {
      type: String,
      required: true,
    },
    isEven: {
      type: Boolean,
    },
    courseClassification: {
      type: String,
      enum: ["THEORY", "LAB"],
      required: true,
    },
    courseCode: {
      type: String,
      required: true,
    },
    courseCredit: {
      type: String,
      required: true,
    },
    courseType: {
      type: String,
      enum: ["CORE", "ELECTIVE"],
      required: true,
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

const Course = mongoose.models.Course || mongoose.model("Course", courseSchema);

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

export { User, Term, Course, Form };
