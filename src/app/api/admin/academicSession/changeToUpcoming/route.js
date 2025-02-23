import { NextResponse } from "next/server";
import { connect } from "@/lib/dbConfig";
import { AcademicSession } from "@/lib/db/academicSessionSchema";
import { Mentor } from "@/lib/db/mentorSchema";
import { Mentee } from "@/lib/db/menteeSchema";
import { Meeting } from "@/lib/db/meetingSchema";
import mongoose from "mongoose";

export async function PUT(request) {
  let mongoSession;
  try {
    await connect();
    mongoSession = await mongoose.startSession();
    await mongoSession.startTransaction();

    const { currentSession, upcomingSession } = await request.json();

    // Get current session data - remove .lean() to get a Mongoose document
    const currentAcademicSession = await AcademicSession.findOne({
      start_year: currentSession.start_year,
      end_year: currentSession.end_year,
      isCurrent: true
    });

    if (!currentAcademicSession) {
      throw new Error("Current session not found");
    }

    // Find the active session - try both current and upcoming session names
    const activeSession = currentAcademicSession.sessions?.[0]; // Get the first session since it's current

    if (!activeSession) {
      throw new Error(`No active session found in academic year ${currentSession.start_year}-${currentSession.end_year}`);
    }

    console.log('Found active session:', activeSession.name);

    // Save current session name for later use
    currentSession.sessionName = activeSession.name;

    // Format academic years
    const currentAcademicYear = `${currentSession.start_year}-${currentSession.end_year}`;
    const upcomingAcademicYear = `${upcomingSession.start_year}-${upcomingSession.end_year}`;

    // Single data fetch for all required data
    const [allMentees, allMentors, allMeetingDocs] = await Promise.all([
      Mentee.find({
        academicYear: currentAcademicYear
      }).lean(),
      Mentor.find({
        $or: [
          { academicYear: currentAcademicYear },
          { academicSession: activeSession.name },
          { isActive: true }
        ]
      }).select({
        MUJid: 1,
        name: 1,
        email: 1,
        phone_number: 1,
        role: 1,
        gender: 1,
        address: 1,
        profile_picture: 1,
        isActive: 1,
        created_at: 1
      }).lean(),
      Meeting.find({
        'academicDetails.academicYear': currentAcademicYear,
        'academicDetails.academicSession': activeSession.name
      }).lean()
    ]);

    // Process graduating and continuing mentees
    const graduatingMentees = allMentees.filter(m => m.semester === 8);
    const continuingMentees = allMentees.filter(m => m.semester < 8);

    // Store graduated mentees data first
    if (graduatingMentees.length > 0) {
      // Get their meetings attendance data
      const graduatingMeetings = allMeetingDocs.filter(m => 
        m.mentee_ids?.some(id => graduatingMentees.map(gm => gm.MUJid).includes(id))
      );

      // Process and store graduated mentees with their complete history
      currentAcademicSession.sessions[0].graduatedMentees = graduatingMentees.map(mentee => {
        const menteeMeetings = graduatingMeetings.filter(m => 
          m.mentee_ids.includes(mentee.MUJid)
        );

        return {
          MUJid: mentee.MUJid,
          name: mentee.name,
          email: mentee.email,
          mentorMujid: mentee.mentorMujid,
          semester: mentee.semester,
          academicYear: mentee.academicYear,
          academicSession: mentee.academicSession,
          mentorRemarks: mentee.mentorRemarks,
          meetingsAttended: menteeMeetings.map(m => ({
            meeting_id: m.meeting_id,
            date: m.meeting_date,
            wasPresent: m.present_mentees?.includes(mentee.MUJid)
          })),
          graduatedAt: new Date()
        };
      });
      // Save the academic session with graduated data
      await currentAcademicSession.save({ session: mongoSession });

      // Only after saving, remove graduated mentees
      await Mentee.deleteMany({
        MUJid: { $in: graduatingMentees.map(m => m.MUJid) }
      }).session(mongoSession);
    }

    // Update academic session statuses
    await AcademicSession.findOneAndUpdate(
      {
        start_year: currentSession.start_year,
        end_year: currentSession.end_year,
        isCurrent: true
      },
      {
        $set: {
          isCurrent: false,
          isArchived: true,
          archivedAt: new Date()
        }
      },
      { session: mongoSession }
    );

    // 2. Set new session as current
    const newCurrentSession = await AcademicSession.findOneAndUpdate(
      {
        start_year: upcomingSession.start_year,
        end_year: upcomingSession.end_year,
        'sessions.name': upcomingSession.sessionName
      },
      { 
        $set: { 
          isCurrent: true,
          isArchived: false,
          archivedAt: null
        } 
      },
      { new: true, session: mongoSession }
    );

    if (!newCurrentSession) {
      throw new Error("Upcoming session not found");
    }

    // Process mentors with their mentees and meetings
    const processedMentors = allMentors.map(mentor => {
      const mentorMentees = allMentees.filter(m => m.mentorMujid === mentor.MUJid);
      const mentorMeetings = allMeetingDocs.flatMap(doc => 
        (doc.meetings || []).map(meeting => ({
          ...meeting,
          mentorMUJid: doc.mentorMUJid,
          academicDetails: doc.academicDetails
        }))
      ).filter(m => m.mentorMUJid === mentor.MUJid);

      return {
        ...mentor,
        mentees: mentorMentees.map(mentee => ({
          MUJid: mentee.MUJid,
          name: mentee.name,
          email: mentee.email,
          phone: mentee.phone,
          semester: mentee.semester,
          yearOfRegistration: mentee.yearOfRegistration,
          mentorRemarks: mentee.mentorRemarks,
          meetingsAttended: mentee.meetingsAttended
        })),
        meetingStats: {
          total: mentorMeetings.length,
          completedReports: mentorMeetings.filter(m => m.isReportFilled).length,
          lastMeetingDate: mentorMeetings.length > 0 
            ? new Date(Math.max(...mentorMeetings.map(m => new Date(m.created_at))))
            : null
        }
      };
    });

    // Process mentors and store in the active session
    if (Array.isArray(activeSession.mentors)) {
      // Update existing mentors
      processedMentors.forEach(newMentor => {
        const existingIndex = activeSession.mentors.findIndex(
          m => m.MUJid === newMentor.MUJid
        );
        
        if (existingIndex !== -1) {
          activeSession.mentors[existingIndex] = {
            ...activeSession.mentors[existingIndex],
            ...newMentor,
            updated_at: new Date()
          };
        } else {
          activeSession.mentors.push({
            ...newMentor,
            created_at: new Date(),
            updated_at: new Date()
          });
        }
      });
    } else {
      // Create new mentors array
      activeSession.mentors = processedMentors.map(mentor => ({
        ...mentor,
        created_at: new Date(),
        updated_at: new Date()
      }));
    }

    // Mark the academic session as modified
    currentAcademicSession.markModified('sessions');
    await currentAcademicSession.save({ session: mongoSession });

    // Process current session data using the already fetched data
    const currentSessionData = currentAcademicSession.sessions.find(
      s => s.name === currentSession.sessionName
    );

    if (currentSessionData) {
      currentSessionData.mentors = processedMentors;

      // Process meetings for each semester using allMeetings
      currentSessionData.semesters.forEach(sem => {
        const semesterMeetings = allMeetingDocs.flatMap(doc => 
          (doc.meetings || []).map(meeting => ({
            ...meeting,
            mentorMUJid: doc.mentorMUJid,
            academicDetails: doc.academicDetails
          }))
        ).filter(m => m.semester === sem.semester_number);
        
        // Process meetings in pages with duplicate checking
        const MEETINGS_PER_PAGE = 25;
        sem.meetingPages = [];

        // Create a Set to track unique meeting IDs
        const processedMeetingIds = new Set();

        for (let i = 0; i < semesterMeetings.length; i += MEETINGS_PER_PAGE) {
          const pageMeetings = semesterMeetings.slice(i, i + MEETINGS_PER_PAGE);
          
          const processedMeetings = pageMeetings
            .filter(meeting => {
              // Only process meetings that haven't been processed yet
              if (processedMeetingIds.has(meeting.meeting_id)) {
                return false;
              }
              processedMeetingIds.add(meeting.meeting_id);
              return true;
            })
            .map(meeting => {
              const mentor = allMentors.find(m => m.MUJid === meeting.mentorMUJid);
              const meetingMentees = allMentees.filter(m => 
                meeting.mentee_ids?.includes(m.MUJid)
              );

              return {
                meeting_id: meeting.meeting_id,
                mentorMUJid: meeting.mentorMUJid,
                mentorDetails: mentor ? {
                  name: mentor.name,
                  email: mentor.email,
                  phone_number: mentor.phone_number
                } : {},
                semester: meeting.semester,
                meeting_date: meeting.meeting_date,
                meeting_time: meeting.meeting_time,
                isReportFilled: meeting.isReportFilled,
                meeting_notes: meeting.meeting_notes || {},
                mentees: meetingMentees.map(mentee => ({
                  MUJid: mentee.MUJid,
                  name: mentee.name,
                  email: mentee.email,
                  isPresent: meeting.present_mentees?.includes(mentee.MUJid),
                  mentorRemarks: mentee.mentorRemarks || ''
                })),
                scheduledAT: meeting.scheduledAT || {},
                emailsSentCount: meeting.emailsSentCount || 0,
                archived: true,
                archivedAt: new Date(),
                attendance: {
                  total: meeting.mentee_ids?.length || 0,
                  present: meeting.present_mentees?.length || 0,
                  percentage: meeting.mentee_ids?.length 
                    ? Math.round((meeting.present_mentees?.length || 0) / meeting.mentee_ids.length * 100)
                    : 0
                }
              };
            });

          if (processedMeetings.length > 0) {
            sem.meetingPages.push({
              pageNumber: Math.floor(i / MEETINGS_PER_PAGE) + 1,
              meetings: processedMeetings
            });
          }
        }

        console.log(`Processed ${sem.meetingPages.reduce((sum, page) => sum + page.meetings.length, 0)} meetings for semester ${sem.semester_number}`);
      });

      // Save the processed data first
      await currentAcademicSession.save({ session: mongoSession });

      // After saving, delete all processed meetings
      await Meeting.deleteMany({
        'academicDetails.academicYear': currentAcademicYear,
        'academicDetails.academicSession': currentSession.sessionName
      }).session(mongoSession);

      console.log('Deleted archived meetings');
    }

    // 4. Update continuing mentees
    if (continuingMentees.length > 0) {
      await Mentee.bulkWrite(
        continuingMentees.map(mentee => ({
          updateOne: {
            filter: { MUJid: mentee.MUJid },
            update: {
              $set: {
                semester: mentee.semester + 1,
                academicYear: upcomingAcademicYear,
                academicSession: upcomingSession.sessionName,
                updated_at: new Date()
              }
            }
          }
        })),
        { session: mongoSession }
      );
    }

    // 6. Update mentors in bulk
    if (allMentors.length > 0) {
      await Mentor.bulkWrite(
        allMentors.map(mentor => ({
          updateOne: {
            filter: { MUJid: mentor.MUJid },
            update: {
              $set: {
                academicYear: upcomingAcademicYear,
                academicSession: upcomingSession.sessionName,
                updated_at: new Date()
              }
            }
          }
        })),
        { session: mongoSession }
      );
    }

    // Commit the transaction
    await mongoSession.commitTransaction();
    mongoSession.endSession();

    return NextResponse.json({
      message: "Session changed successfully",
      stats: {
        mentorsProcessed: processedMentors.length,
        graduatedMentees: graduatingMentees.length,
        continuingMentees: continuingMentees.length,
        archivedMeetings: allMeetingDocs.flatMap(doc => 
          (doc.meetings || []).map(meeting => ({
            ...meeting,
            mentorMUJid: doc.mentorMUJid,
            academicDetails: doc.academicDetails
          }))
        ).length // Add count of archived meetings
      }
    });

  } catch (error) {
    if (mongoSession && mongoSession.inTransaction()) {
      await mongoSession.abortTransaction();
    }
    console.error("Error in change to upcoming process:", error);
    return NextResponse.json({
      error: "Error changing to upcoming session",
      details: error.message
    }, { status: 500 });
  } finally {
    if (mongoSession) {
      await mongoSession.endSession();
    }
  }
}
