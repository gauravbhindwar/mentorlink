import mongoose from "mongoose";
import { AcademicSession } from "./academicSessionSchema";
import {Mentee} from "./menteeSchema";

// Create a sub-schema for individual meetings
const individualMeetingSchema = new mongoose.Schema({
  meeting_id: String,
  semester: Number,
  meeting_date: { type: Date },
  meeting_time: {
    type: String,
    validate: {
      validator: function (v) {
        const timeRegex = /^(0?[1-9]|1[0-2]):[0-5][0-9] (AM|PM)$/;
        return timeRegex.test(v);
      },
      message: "Invalid time format, please enter time in hh:mm AM/PM format",
    },
  },
  isReportFilled: { type: Boolean, default: false },
  meeting_notes: {
    TopicOfDiscussion: { type: String },
    TypeOfInformation: { type: String },
    NotesToStudent: { type: String },
    isMeetingOnline: { type: Boolean, default: false },
    venue: { type: String, required: true },
    feedbackFromMentee: { type: String },
    issuesRaisedByMentee: { type: String },
    outcome: { type: String },
    closureRemarks: { type: String },
  },
  mentee_ids: [{
    type: String,
    ref: "Mentee"
  }],
  present_mentees: [{
    type: String,
    ref: "Mentee"
  }],
  sections: [String],
  scheduledAT: {
    scheduleDate: { type: Date, default: null },
    scheduleTime: { type: String, default: null },
  },
  emailsSentCount: {
    type: Number,
    default: 0
  },
});

// Main meeting schema that groups by mentor
const meetingSchema = new mongoose.Schema({
  mentorMUJid: {
    type: String,
    ref: "Mentor",
    required: true,
    uppercase: true,
    validate: {
      validator: function (v) {
        return /^[A-Z0-9]+$/.test(v);
      },
      message: "Mentor MUJid must be uppercase alphanumeric only",
    },
  },
  academicDetails: {
    academicYear: String,
    academicSession: String,
  },
  meetings: [individualMeetingSchema],
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now },
});

// Add method to add new meeting
meetingSchema.methods.addMeeting = async function(meetingData) {
  const mentees = await Mentee.find({
    mentorMujid: this.mentorMUJid,
    academicYear: this.academicDetails.academicYear,
    academicSession: this.academicDetails.academicSession,
    semester: meetingData.semester,
    section: { $in: meetingData.sections }
  });
  
  meetingData.mentee_ids = mentees.map(m => m.MUJid);
  this.meetings.push(meetingData);
  this.updated_at = new Date();
  return this.save();
};

// Add method to get meetings by semester
meetingSchema.methods.getMeetingsBySemester = function(semester) {
  return this.meetings.filter(meeting => meeting.semester === semester);
};

// Add this method to update mentee_ids
meetingSchema.methods.updateMenteeIds = async function() {
  for (let meeting of this.meetings) {
    const mentees = await Mentee.find({
      mentorMujid: this.mentorMUJid,
      academicYear: this.academicDetails.academicYear,
      academicSession: this.academicDetails.academicSession,
      semester: meeting.semester,
      section: { $in: meeting.sections }
    });
    
    meeting.mentee_ids = mentees.map(m => m.MUJid);
  }
  return this.save();
};

// Middleware to sync with academic session
meetingSchema.post('save', async function(doc) {
  try {
    const session = await AcademicSession.findOne({
      start_year: parseInt(doc.academicDetails.academicYear.split('-')[0]),
      'sessions.name': doc.academicDetails.academicSession
    });

    if (session) {
      // Group meetings by semester
      const meetingsBySemester = doc.meetings.reduce((acc, meeting) => {
        if (!acc[meeting.semester]) {
          acc[meeting.semester] = [];
        }
        acc[meeting.semester].push(meeting);
        return acc;
      }, {});

      // Update each semester's meetings
      for (const [semester, meetings] of Object.entries(meetingsBySemester)) {
        const semesterDoc = session.sessions
          .find(s => s.name === doc.academicDetails.academicSession)
          ?.semesters
          .find(sem => sem.semester_number === parseInt(semester));

        if (semesterDoc) {
          // Update meetings array with new meeting IDs
          meetings.forEach(meeting => {
            if (!semesterDoc.meetings.includes(meeting._id)) {
              semesterDoc.meetings.push(meeting._id);
            }
          });
        }
      }
      await session.save();
    }
  } catch (error) {
    console.error('Error syncing meetings to academic session:', error);
  }
});

// Static method to find or create mentor's meetings document
meetingSchema.statics.findOrCreateMentorMeetings = async function(mentorId, academicDetails) {
  let mentorMeetings = await this.findOne({
    mentorMUJid: mentorId,
    'academicDetails.academicYear': academicDetails.academicYear,
    'academicDetails.academicSession': academicDetails.academicSession
  });

  if (!mentorMeetings) {
    mentorMeetings = new this({
      mentorMUJid: mentorId,
      academicDetails,
      meetings: []
    });
  }

  return mentorMeetings;
};

const Meeting = mongoose.models.Meeting || mongoose.model("Meeting", meetingSchema);

export { Meeting };
