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
      semesters: [
        {
          semester_number: { type: Number }, // Semester number (1-8)
          start_date: { type: Date }, // Start date of the semester
          end_date: { type: Date }, // End date of the semester
          meetings: [
            {
              type: mongoose.Schema.Types.ObjectId,
              ref: 'Meeting'
            }
          ]
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
      sections: meeting.sections,
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

const AcademicSession =
  mongoose.models.AcademicSession ||
  mongoose.model("AcademicSession", academicSessionsSchema);

export { AcademicSession };
