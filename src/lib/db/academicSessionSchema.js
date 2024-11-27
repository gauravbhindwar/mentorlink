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
              mentees_assigned: [
                {
                  mentee_id: { type: String, ref: "Mentee" },
                  name: String,
                  email: String,
                  phone: String,
                  mentor_id: { type: String, ref: "Mentor" },
                  parents: {
                    father: {
                      name: String,
                      phone: String,
                      email: String,
                    },
                    mother: {
                      name: String,
                      phone: String,
                      email: String,
                    },
                    guardian: {
                      name: String,
                      phone: String,
                      email: String,
                      relation: String
                    }
                  },
                  assigned_at: { type: Date, default: Date.now },
                },
              ],
              meetings: [
                {
                  meeting_id: {
                    type: String, // Generate ObjectId instead of a string for better MongoDB practices
                  },
                  mentor_id: {
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
                  meeting_notes: {
                    TopicOfDiscussion: { type: String },
                    TypeOfInformation: { type: String },
                    NotesToStudent: { type: String },
                    feedbackFromMentee: { type: String },
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

academicSessionsSchema.methods.getMentorsWithMeetings = async function (filters) {
  const { session, semester, section } = filters;

  const matchStage = {
    'sessions.name': session
  };

  if (semester) {
    matchStage['sessions.semesters.semester_number'] = parseInt(semester);
  }

  if (section) {
    matchStage['sessions.semesters.sections.name'] = section.toUpperCase();
  }

  const meetings = await this.model("AcademicSession").aggregate([
    { $unwind: '$sessions' },
    { $unwind: '$sessions.semesters' },
    { $unwind: '$sessions.semesters.sections' },
    { $unwind: '$sessions.semesters.sections.meetings' },
    { $match: matchStage },
    {
      $group: {
        _id: '$sessions.semesters.sections.meetings.mentor_id',
        meetingCount: { $sum: 1 }
      }
    }
  ]);

  // Fetch mentor details
  const mentorDetails = await Promise.all(
    meetings.map(async (meeting) => {
      const mentor = await Mentor.findOne({ MUJid: meeting._id })
        .select('MUJid name email phone_number')
        .lean();
      return {
        MUJid: mentor?.MUJid || meeting._id,
        mentorName: mentor?.name || 'Unknown',
        mentorEmail: mentor?.email || 'N/A',
        mentorPhone: mentor?.phone_number || 'N/A',
        meetingCount: meeting.meetingCount
      };
    })
  );

  return mentorDetails;
};

academicSessionsSchema.methods.assignAndFetchMentees = async function(sessionName, semesterNumber, sectionName) {
  try {
    const mentees = await Mentee.find({
      academicSession: sessionName,
      semester: semesterNumber,
      section: sectionName
    }).select('MUJid name email phone mentorMujid parents');

    if (!mentees.length) return { success: false, message: 'No mentees found' };

    const menteesWithDetails = mentees.map(mentee => ({
      mentee_id: mentee.MUJid,
      name: mentee.name,
      email: mentee.email,
      phone: mentee.phone,
      mentor_id: mentee.mentorMujid,
      parents: {
        father: {
          name: mentee.parents?.father?.name || '',
          phone: mentee.parents?.father?.phone || '',
          email: mentee.parents?.father?.email || ''
        },
        mother: {
          name: mentee.parents?.mother?.name || '',
          phone: mentee.parents?.mother?.phone || '',
          email: mentee.parents?.mother?.email || ''
        },
        guardian: mentee.parents?.guardian ? {
          name: mentee.parents.guardian.name || '',
          phone: mentee.parents.guardian.phone || '',
          email: mentee.parents.guardian.email || '',
          relation: mentee.parents.guardian.relation || ''
        } : null
      },
      assigned_at: new Date()
    }));

    return { success: true, mentees: menteesWithDetails };
  } catch (error) {
    console.error('Error assigning mentees:', error);
    return { success: false, message: error.message };
  }
};

academicSessionsSchema.methods.archivePreviousSession = async function(currentSession) {
  try {
    console.log('Starting archive process for:', currentSession);
    
    const [currentMonth, currentYear] = currentSession.split(' ');
    const isJanuaryJune = currentMonth === 'JANUARY-JUNE';
    
    const previousSession = isJanuaryJune ? 
      `JULY-DECEMBER ${parseInt(currentYear) - 1}` : 
      `JANUARY-JUNE ${currentYear}`;

    console.log('Looking for previous session:', previousSession);

    // Debug: Check mentees in previous session
    const menteeCount = await Mentee.countDocuments({ academicSession: previousSession });
    console.log(`Found ${menteeCount} mentees in previous session`);

    const mentees = await Mentee.find({
      academicSession: previousSession
    }).select('MUJid name email phone mentorMujid semester section parents').lean();

    console.log('Mentee sample:', mentees.slice(0, 2));

    if (!mentees.length) {
      console.log('No mentees found in previous session');
      return { success: false, message: 'No mentees found in previous session' };
    }

    // Debug: Group mentees by mentor
    const mentorGroups = {};
    mentees.forEach(mentee => {
      if (!mentorGroups[mentee.mentorMujid]) {
        mentorGroups[mentee.mentorMujid] = [];
      }
      mentorGroups[mentee.mentorMujid].push(mentee);
    });

    console.log('Mentor distribution:', Object.keys(mentorGroups).map(mentorId => ({
      mentorId,
      menteeCount: mentorGroups[mentorId].length
    })));

    // Process mentor assignments with detailed logging
    const mentorAssignments = await Promise.all(
      Object.entries(mentorGroups).map(async ([mentorId, mentorMentees]) => {
        console.log(`Processing mentor ${mentorId} with ${mentorMentees.length} mentees`);
        
        const semesterGroups = {};
        mentorMentees.forEach(mentee => {
          if (!semesterGroups[mentee.semester]) {
            semesterGroups[mentee.semester] = {};
          }
          if (!semesterGroups[mentee.semester][mentee.section]) {
            semesterGroups[mentee.semester][mentee.section] = [];
          }
          
          semesterGroups[mentee.semester][mentee.section].push({
            mentee_id: mentee.MUJid,
            name: mentee.name,
            email: mentee.email,
            phone: mentee.phone,
            mentor_id: mentorId,
            parents: {
              father: mentee.parents?.father || {},
              mother: mentee.parents?.mother || {},
              guardian: mentee.parents?.guardian || null
            },
            assigned_at: new Date()
          });
        });

        console.log(`Mentor ${mentorId} semester distribution:`, 
          Object.keys(semesterGroups).map(sem => ({
            semester: sem,
            sections: Object.keys(semesterGroups[sem]).length
          }))
        );

        return {
          mentor_id: mentorId,
          assignments: Object.entries(semesterGroups).map(([semester, sections]) => ({
            semester_number: parseInt(semester),
            sections: Object.entries(sections).map(([section, mentees]) => ({
              name: section,
              mentees_assigned: mentees
            }))
          }))
        };
      })
    );

    console.log('Archive process completed successfully');
    return {
      success: true,
      previousSession,
      assignmentData: mentorAssignments,
      totalMentees: mentees.length,
      totalMentors: mentorAssignments.length,
      debug: {
        menteeCount,
        mentorCount: Object.keys(mentorGroups).length,
        sampleMentee: mentees[0]
      }
    };

  } catch (error) {
    console.error('Archive process failed:', error);
    console.error('Stack trace:', error.stack);
    return { 
      success: false, 
      message: error.message,
      error: {
        stack: error.stack,
        details: error
      }
    };
  }
};

const AcademicSession =
  mongoose.models.AcademicSession ||
  mongoose.model("AcademicSession", academicSessionsSchema);

export { AcademicSession };
