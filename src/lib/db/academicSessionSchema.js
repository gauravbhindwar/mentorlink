import mongoose from "mongoose";
import { Mentor } from "./mentorSchema";
import { Mentee } from "./menteeSchema";

const academicSessionsSchema = new mongoose.Schema({
  start_year: { type: Number, required: true }, // Start year of the session
  end_year: { type: Number, required: true }, // End year of the session
  sessions: [
    {
      name: {
        type: String,
        required: true,
        validate: {
          validator: function (v) {
            return /^(JULY-DECEMBER|JANUARY-JUNE) \d{4}$/.test(v);
          },
          message: "Session must be JULY-DECEMBER YYYY or JANUARY-JUNE YYYY",
        },
      },
      semesters: [
        {
          semester_number: { type: Number }, // Semester number (1-8)
          start_date: { type: Date }, // Start date of the semester
          end_date: { type: Date }, // End date of the semester
          sections: [
            {
              name: {
                type: String,
                uppercase: true,
                validate: {
                  validator: function (v) {
                    // Validate single uppercase letter
                    return /^[A-Z]$/.test(v);
                  },
                  message: "Each section must be a single uppercase letter A-Z",
                },
              },
              meetings: [
                {
                  meeting_id: {
                    type: String, // Generate ObjectId instead of a string for better MongoDB practices
                  },
                  mentorMUJid: {
                    type: String,
                    ref: "Mentor",
                    uppercase: true,
                    validate: {
                      validator: function (v) {
                        return /^[A-Z0-9]+$/.test(v);
                      },
                      message:
                        "Mentor MUJid must be uppercase alphanumeric only",
                    },
                  },
                  mentee_ids: [
                    {
                      type: String,
                      ref: "Mentee",
                      uppercase: true,
                      validate: {
                        validator: function (v) {
                          return /^[A-Z0-9]+$/.test(v);
                        },
                        message:
                          "Mentee MUJid must be uppercase alphanumeric only",
                      },
                    },
                  ],
                  meeting_date: { type: Date },
                  meeting_time: {
                    type: String,
                    validate: {
                      validator: function (v) {
                        const timeRegex =
                          /^(0?[1-9]|1[0-2]):[0-5][0-9] (AM|PM)$/;
                        return timeRegex.test(v);
                      },
                      message:
                        "Invalid time format, please enter time in hh:mm AM/PM format",
                    },
                  },
                  isReportFilled: { type: Boolean, default: false },
                  meeting_notes: {
                    TopicOfDiscussion: { type: String },
                    TypeOfInformation: { type: String },
                    NotesToStudent: { type: String },
                    feedbackFromMentee: { type: String },
                    issuesRaisedByMentee: { type: String },
                    outcome: { type: String },
                    closureRemarks: { type: String },
                  },
                  scheduledAT: {
                    scheduleDate: {
                      type: Date,
                      default: null,
                    },
                    scheduleTime: {
                      type: String,
                      default: null,
                    },
                  },

                  created_at: { type: Date, default: Date.now },
                  updated_at: { type: Date, default: Date.now },
                },
              ],
            },
          ],
        },
      ],
    },
  ],
  created_at: { type: Date, default: Date.now }, // Creation date of the session
  updated_at: { type: Date, default: Date.now }, // Last updated date
});

// Middleware to enforce `session_id` equals `start_year`
academicSessionsSchema.pre("save", function (next) {
  this.session_id = this.start_year;
  next();
});

academicSessionsSchema.methods.getMentorMeetingCounts = async function () {
  const sessions = await this.model("AcademicSession").aggregate([
    { $unwind: "$semesters" },
    { $unwind: "$semesters.meetings" },
    {
      $group: {
        _id: "$semesters.meetings.mentor_id",
        meetingCount: { $sum: 1 },
      },
    },
  ]);
  return sessions;
};

academicSessionsSchema.methods.getMeetingWithMenteeDetails = async function (
  mentorId,
  meetingId
) {
  try {
    // First find the meeting
    const result = await this.model("AcademicSession").aggregate([
      { $unwind: "$sessions" },
      { $unwind: "$sessions.semesters" },
      { $unwind: "$sessions.semesters.sections" },
      { $unwind: "$sessions.semesters.sections.meetings" },
      {
        $match: {
          "sessions.semesters.sections.meetings.mentor_id": mentorId,
          "sessions.semesters.sections.meetings.meeting_id": meetingId,
        },
      },
    ]);

    if (!result.length) {
      throw new Error("Meeting not found");
    }

    const meeting = result[0].sessions.semesters.sections.meetings;

    // Fetch mentee details from Mentee collection
    const menteeDetails = await Promise.all(
      meeting.mentee_ids.map(async (mujId) => {
        const mentee = await Mentee.findOne({ MUJid: mujId })
          .select("MUJid name email phone academicYear semester section")
          .lean();
        return (
          mentee || {
            mujId,
            name: "Name not found",
            email: "Email not found",
            section: "Section not found",
            semester: "Semester not found",
          }
        );
      })
    );

    return {
      meeting,
      mentee_details: menteeDetails,
    };
  } catch (error) {
    console.error("Error fetching meeting with mentee details:", error);
    throw error;
  }
};

academicSessionsSchema.methods.getMentorDetails = async function (mentorMUJid) {
  try {
    const mentor = await Mentor.findOne({ MUJid: mentorMUJid })
      .select("name MUJid email phone_number")
      .lean();
    if (!mentor) {
      throw new Error("Mentor not found");
    }
    return mentor;
  } catch (error) {
    console.error("Error fetching mentor details:", error);
    throw error;
  }
};

const AcademicSession =
  mongoose.models.AcademicSession ||
  mongoose.model("AcademicSession", academicSessionsSchema);

export { AcademicSession };
