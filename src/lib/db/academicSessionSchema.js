import mongoose from "mongoose";
import { Mentor } from "./mentorSchema";
import { Meeting } from "./meetingSchema";

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
      mentors: [{
        MUJid: String,
        name: String,
        email: String,
        phone_number: String,
        mentees: [{
          MUJid: String,
          name: String,
          email: String,
          semester: Number,
          mentorRemarks: String
        }]
      }],
      graduatedMentees: [{
        MUJid: String,
        name: String,
        email: String,
        mentorMujid: String,
        semester: Number,
        academicYear: String,
        academicSession: String,
        mentorRemarks: String,
        meetingsAttended: [String],
        graduatedAt: Date
      }],
      semesters: [
        {
          semester_number: { type: Number }, // Semester number (1-8)
          start_date: { type: Date }, // Start date of the semester
          end_date: { type: Date }, // End date of the semester
          meetingPages: [
            {
              pageNumber: { type: Number },
              meetings: [
                {
                  meeting_id: { type: String },
                  mentorMUJid: { type: String },
                  mentorDetails: {
                    name: String,
                    email: String,
                    phone_number: String
                  },
                  semester: { type: Number },
                  meeting_date: { type: Date },
                  meeting_time: {
                    type: String,
                    validate: {
                      validator: function(v) {
                        return /^(0?[1-9]|1[0-2]):[0-5][0-9] (AM|PM)$/.test(v);
                      },
                      message: "Invalid time format, please enter time in hh:mm AM/PM format"
                    }
                  },
                  isReportFilled: { type: Boolean, default: false },
                  meeting_notes: {
                    TopicOfDiscussion: String,
                    TypeOfInformation: String,
                    NotesToStudent: String,
                    isMeetingOnline: { type: Boolean, default: false },
                    venue: { type: String },
                    feedbackFromMentee: String,
                    issuesRaisedByMentee: String,
                    outcome: String,
                    closureRemarks: String
                  },
                  mentees: {
                    type: [{
                      MUJid: String,
                      name: String,
                      email: String,
                      isPresent: Boolean,
                      mentorRemarks: String
                    }],
                    validate: [arrayLimit, 'Exceeds the limit of 50 mentees per meeting']
                  },
                  scheduledAT: {
                    scheduleDate: { type: Date },
                    scheduleTime: String
                  },
                  emailsSentCount: { type: Number, default: 0 },
                  attendance: {
                    total: { type: Number, default: 0 },
                    present: { type: Number, default: 0 },
                    percentage: { type: Number, default: 0 }
                  }
                }
              ]
            }
          ]
        },
      ],
    },
  ],
  created_at: { type: Date, default: Date.now }, // Creation date of the session
  updated_at: { type: Date, default: Date.now }, // Last updated date
  isArchived: { type: Boolean, default: false },
  archivedAt: { type: Date, default: null },
  isCurrent: { type: Boolean, default: false } // Add at root level
});

// Add validator function for array limits
function arrayLimit(val) {
  return val.length <= 50;
}

// Add indexes for frequently queried fields
academicSessionsSchema.index({ start_year: 1 });
academicSessionsSchema.index({ "sessions.name": 1 });
academicSessionsSchema.index({ "sessions.semesters.semester_number": 1 });
academicSessionsSchema.index({ "sessions.semesters.meetingPages.pageNumber": 1 });

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

  next();
});

academicSessionsSchema.methods.getMentorMeetingCounts = async function () {
  const meetings = await Meeting.aggregate([
    {
      $group: {
        _id: "$mentorMUJid",
        meetingCount: { $sum: 1 }
      }
    }
  ]);
  return meetings;
};

academicSessionsSchema.methods.getMeetingWithMenteeDetails = async function (
  mentorId,
  meetingId
) {
  try {
    const meeting = await Meeting.findOne({
      mentorMUJid: mentorId,
      meeting_id: meetingId
    }).populate('mentee_ids');

    if (!meeting) {
      throw new Error("Meeting not found");
    }

    return {
      meeting,
      semester: meeting.semester,
      sessionName: meeting.academicDetails.academicSession
    };
  } catch (error) {
    console.error("Error fetching meeting details:", error);
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

// Updated methods to use Meeting schema directly
academicSessionsSchema.statics.findMeetingsByCriteria = async function(year, session, semester) {
  const meetings = await Meeting.find({
    'academicDetails.academicYear': year,
    'academicDetails.academicSession': session,
    'academicDetails.semester': semester
  }).populate('mentee_ids present_mentees');
  
  return meetings;
};

// Replace the existing changeCurrentSession method with this new one
academicSessionsSchema.statics.changeCurrentSession = async function(academicYear, sessionName) {
  // First, unset all current sessions
  await this.updateMany(
    { isCurrent: true },
    { $set: { isCurrent: false } }
  );

  // Set the new current session
  const result = await this.findOneAndUpdate(
    {
      $or: [
        { start_year: parseInt(academicYear.split('-')[0]) },
        { end_year: parseInt(academicYear.split('-')[1]) }
      ],
      "sessions.name": sessionName
    },
    { $set: { isCurrent: true } },
    { new: true }
  );

  return result;
};

const AcademicSession =
  mongoose.models.AcademicSession ||
  mongoose.model("AcademicSession", academicSessionsSchema);

export { AcademicSession };
