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
                  present_mentees: [
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
                    isMeetingOnline: { type: Boolean, default: false },
                    venue: { type: String, required: true }, // Make venue required
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

// Add indexes for frequently queried fields
academicSessionsSchema.index({ start_year: 1 });
academicSessionsSchema.index({ "sessions.name": 1 });
academicSessionsSchema.index({ "sessions.semesters.semester_number": 1 });
academicSessionsSchema.index({ "sessions.semesters.sections.name": 1 });

// Middleware to enforce `session_id` equals `start_year`
academicSessionsSchema.pre("save", function (next) {
  this.session_id = this.start_year;
  next();
});

// Ensure data consistency on save
academicSessionsSchema.pre("save", function (next) {
  // Format session names
  this.sessions.forEach((session) => {
    session.name = session.name.trim().toUpperCase();
  });

  // Format section names
  this.sessions.forEach((session) => {
    session.semesters.forEach((semester) => {
      semester.sections.forEach((section) => {
        section.name = section.name.trim().toUpperCase();
      });
    });
  });

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
    const result = await this.model("AcademicSession").aggregate([
      { $unwind: "$sessions" },
      { $unwind: "$sessions.semesters" },
      { $unwind: "$sessions.semesters.sections" },
      { $unwind: "$sessions.semesters.sections.meetings" },
      {
        $match: {
          "sessions.semesters.sections.meetings.mentorMUJid": mentorId,
          "sessions.semesters.sections.meetings.meeting_id": meetingId,
        },
      },
      {
        $project: {
          meeting: "$sessions.semesters.sections.meetings",
          section: "$sessions.semesters.sections.name",
          semester: "$sessions.semesters.semester_number",
          session: "$sessions.name",
          _id: 0,
        },
      },
    ]);

    if (!result.length) {
      throw new Error("Meeting not found");
    }

    const meeting = result[0].meeting;

    // Fetch mentee details from Mentee collection
    const menteeDetails = await Promise.all(
      meeting.mentee_ids.map(async (mujId) => {
        const mentee = await Mentee.findOne({ MUJid: mujId })
          .select("MUJid name email phone academicYear semester section")
          .lean();
        return (
          mentee || {
            MUJid: mujId,
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
      section: result[0].section,
      semester: result[0].semester,
      session: result[0].session,
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

// Add a method to find meetings by criteria
academicSessionsSchema.methods.findMeetingsByCriteria = async function (
  year,
  session,
  semester,
  section
) {
  const query = {
    start_year: parseInt(year),
    "sessions.name": session,
    "sessions.semesters.semester_number": parseInt(semester),
  };

  if (section) {
    query["sessions.semesters.sections.name"] = section.toUpperCase();
  }

  return this.model("AcademicSession").findOne(query);
};

const AcademicSession =
  mongoose.models.AcademicSession ||
  mongoose.model("AcademicSession", academicSessionsSchema);

export { AcademicSession };
