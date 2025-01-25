import mongoose from "mongoose";
import { AcademicSession } from "./academicSessionSchema";
import { Mentee } from "./menteeSchema";
import { Mentor } from "./mentorSchema";

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
    type: String
  }],
  present_mentees: [{
    type: String
  }],
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
    semester: meetingData.semester
  }).select('MUJid');
  
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
      semester: meeting.semester
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

meetingSchema.statics.getMentorMeetingsData = async function(year, session, semester, page = 0, limit = 10) {
  const skip = page * limit;
  
  const meetings = await this.aggregate([
    {
      $match: {
        'academicDetails.academicYear': year,
        'academicDetails.academicSession': session,
        ...(semester && { 'meetings.semester': parseInt(semester) })
      }
    },
    {
      $lookup: {
        from: 'mentors',
        localField: 'mentorMUJid',
        foreignField: 'MUJid',
        as: 'mentorInfo'
      }
    },
    {
      $unwind: '$mentorInfo'
    },
    {
      $project: {
        MUJid: '$mentorMUJid',
        mentorName: '$mentorInfo.name',
        mentorEmail: '$mentorInfo.email',
        mentorPhone: '$mentorInfo.phone_number',
        meetingCount: { $size: '$meetings' }
      }
    }
  ]).skip(skip).limit(limit);

  const total = await this.countDocuments({
    'academicDetails.academicYear': year,
    'academicDetails.academicSession': session,
    ...(semester && { 'meetings.semester': parseInt(semester) })
  });

  return { meetings, total };
};

meetingSchema.statics.getMentorMeetings = async function(mentorMUJid, year, session, semester) {
  const academicYear = `${parseInt(year) - 1}-${year}`; // Convert year to academic year format

  const meetings = await this.aggregate([
    {
      $match: {
        mentorMUJid: mentorMUJid,
        'academicDetails.academicYear': academicYear,
        'academicDetails.academicSession': session
      }
    },
    {
      $unwind: '$meetings'
    },
    {
      $match: {
        'meetings.semester': parseInt(semester)
      }
    },
    {
      $lookup: {
        from: 'mentors',
        localField: 'mentorMUJid',
        foreignField: 'MUJid',
        as: 'mentorInfo'
      }
    },
    {
      $unwind: '$mentorInfo'
    },
    {
      $lookup: {
        from: 'mentees',
        localField: 'meetings.mentee_ids',
        foreignField: 'MUJid',
        as: 'menteeDetails'
      }
    },
    {
      $project: {
        'meetings': 1,
        'mentorInfo.name': 1,
        'menteeDetails.name': 1,
        'menteeDetails.MUJid': 1,
        'menteeDetails.meetingsAttended': 1
      }
    }
  ]);

  return meetings.map(meeting => ({
    ...meeting.meetings,
    mentorName: meeting.mentorInfo.name,
    menteeDetails: meeting.menteeDetails.map(mentee => ({
      name: mentee.name,
      MUJid: mentee.MUJid,
      meetingsAttended: mentee.meetingsAttended.length
    }))
  }));
};

meetingSchema.statics.getMeetingWithMenteeDetails = async function(
  mentorId,
  meetingId,
  year,
  session
) {
  const academicYear = `${parseInt(year) - 1}-${year}`;
  
  try {
    const meeting = await this.findOne({
      mentorMUJid: mentorId,
      'academicDetails.academicYear': academicYear,
      'academicDetails.academicSession': session,
      'meetings.meeting_id': meetingId
    });

    if (!meeting) return null;

    const targetMeeting = meeting.meetings.find(m => m.meeting_id === meetingId);
    if (!targetMeeting) return null;

    // Get details for all mentees (both present and absent)
    const allMenteeDetails = await Promise.all(
      targetMeeting.mentee_ids.map(async (menteeId) => {
        try {
          const mentee = await Mentee.findOne({ 
            MUJid: menteeId 
          })
          .select('name MUJid email')
          .lean();

          return {
            ...mentee,
            MUJid: mentee?.MUJid || menteeId,
            name: mentee?.name || 'Unknown',
            email: mentee?.email || 'N/A',
            isPresent: targetMeeting.present_mentees?.includes(menteeId) || false
          };
        } catch (err) {
          console.error(`Error fetching mentee ${menteeId}:`, err);
          return {
            MUJid: menteeId,
            name: 'Unknown',
            email: 'N/A',
            isPresent: false
          };
        }
      })
    );

    return {
      ...targetMeeting.toObject(),
      mentee_details: allMenteeDetails,
      attendance: {
        total: targetMeeting.mentee_ids.length,
        present: targetMeeting.present_mentees?.length || 0,
        percentage: Math.round((targetMeeting.present_mentees?.length || 0) / targetMeeting.mentee_ids.length * 100)
      }
    };
  } catch (error) {
    console.error('Error in getMeetingWithMenteeDetails:', error);
    return null;
  }
};

const Meeting = mongoose.models.Meeting || mongoose.model("Meeting", meetingSchema);

export { Meeting };
