import { NextResponse } from "next/server";
import { connect } from "@/lib/dbConfig";
import { AcademicSession } from "@/lib/db/academicSessionSchema";
import { Mentor } from "@/lib/db/mentorSchema";
import { Mentee } from "@/lib/db/menteeSchema";
import { Meeting } from "@/lib/db/meetingSchema";
import mongoose from "mongoose";

export async function PUT(request) {
  let session;
  try {
    await connect();
    session = await mongoose.startSession();
    await session.startTransaction();

    const { start_year, end_year } = await request.json();

    // Get all data before archiving
    const academicYear = `${start_year}-${end_year}`;
    
    // Find the session first to get current session name
    const academicSession = await AcademicSession.findOne({
      start_year: parseInt(start_year),
      end_year: parseInt(end_year)
    });

    if (!academicSession) {
      throw new Error('Academic session not found');
    }

    const currentSessionName = academicSession.sessions[0].name;

    // Get all related data with complete mentor information
    const [mentors, mentees, meetings] = await Promise.all([
      Mentor.find({ 
        academicYear,
        academicSession: currentSessionName 
      }).select('MUJid name email phone_number gender profile_picture role academicYear academicSession').lean(),
      Mentee.find({ 
        academicYear,
        academicSession: currentSessionName
      }).lean(),
      Meeting.find({
        'academicDetails.academicYear': academicYear,
        'academicDetails.academicSession': currentSessionName
      }).lean()
    ]);

    // Group mentees by mentor
    const menteesByMentor = mentees.reduce((acc, mentee) => {
      if (!acc[mentee.mentorMujid]) {
        acc[mentee.mentorMujid] = [];
      }
      acc[mentee.mentorMujid].push(mentee);
      return acc;
    }, {});

    // Store complete mentor information with their mentees
    academicSession.sessions[0].mentors = mentors.map(mentor => ({
      MUJid: mentor.MUJid,
      name: mentor.name,
      email: mentor.email,
      phone_number: mentor.phone_number,
      gender: mentor.gender,
      profile_picture: mentor.profile_picture,
      role: mentor.role,
      academicYear: mentor.academicYear,
      academicSession: mentor.academicSession,
      mentees: (menteesByMentor[mentor.MUJid] || []).map(mentee => ({
        MUJid: mentee.MUJid,
        name: mentee.name,
        email: mentee.email,
        semester: mentee.semester,
        mentorRemarks: mentee.mentorRemarks
      }))
    }));

    // Store graduating mentees (semester 8)
    academicSession.sessions[0].graduatedMentees = mentees
      .filter(mentee => mentee.semester === 8)
      .map(mentee => ({
        MUJid: mentee.MUJid,
        name: mentee.name,
        email: mentee.email,
        mentorMujid: mentee.mentorMujid,
        semester: mentee.semester,
        academicYear: mentee.academicYear,
        academicSession: mentee.academicSession,
        mentorRemarks: mentee.mentorRemarks,
        meetingsAttended: mentee.meetingsAttended || [],
        graduatedAt: new Date()
      }));

    // Process meetings with complete mentor details
    const processedMeetings = meetings.flatMap(meetingDoc => {
      const mentor = mentors.find(m => m.MUJid === meetingDoc.mentorMUJid);
      return meetingDoc.meetings.map(meeting => ({
        meeting_id: meeting.meeting_id,
        mentorMUJid: meetingDoc.mentorMUJid,
        mentorDetails: mentor ? {
          name: mentor.name,
          email: mentor.email,
          phone_number: mentor.phone_number,
          gender: mentor.gender,
          profile_picture: mentor.profile_picture
        } : null,
        semester: meeting.semester,
        meeting_date: meeting.meeting_date,
        meeting_time: meeting.meeting_time,
        isReportFilled: meeting.isReportFilled,
        meeting_notes: meeting.meeting_notes,
        mentees: meeting.mentee_ids?.map(menteeId => {
          const mentee = mentees.find(m => m.MUJid === menteeId);
          return mentee ? {
            MUJid: mentee.MUJid,
            name: mentee.name,
            email: mentee.email,
            isPresent: meeting.present_mentees?.includes(menteeId),
            mentorRemarks: mentee.mentorRemarks
          } : null;
        }).filter(Boolean) || [],
        attendance: {
          total: meeting.mentee_ids?.length || 0,
          present: meeting.present_mentees?.length || 0,
          percentage: meeting.present_mentees?.length && meeting.mentee_ids?.length 
            ? (meeting.present_mentees.length / meeting.mentee_ids.length) * 100 
            : 0
        }
      }));
    });

    // Update semester data with meetings
    academicSession.sessions[0].semesters.forEach(semester => {
      const semesterMeetings = processedMeetings.filter(m => m.semester === semester.semester_number);
      
      // Store meetings in pages
      const MEETINGS_PER_PAGE = 25;
      semester.meetingPages = [];

      for (let i = 0; i < semesterMeetings.length; i += MEETINGS_PER_PAGE) {
        semester.meetingPages.push({
          pageNumber: Math.floor(i / MEETINGS_PER_PAGE) + 1,
          meetings: semesterMeetings.slice(i, i + MEETINGS_PER_PAGE)
        });
      }
    });

    // Set archive status
    academicSession.isArchived = true;
    academicSession.archivedAt = new Date();

    // Save all changes
    await academicSession.save({ session });
    await session.commitTransaction();

    return NextResponse.json({
      message: "Academic session archived successfully",
      stats: {
        archivedMeetings: processedMeetings.length,
        graduatedMentees: academicSession.sessions[0].graduatedMentees.length,
        archivedMentors: academicSession.sessions[0].mentors.length
      }
    });

  } catch (error) {
    console.error("Archive process error:", error);
    if (session) {
      await session.abortTransaction();
    }
    return NextResponse.json({
      error: "Failed to archive session",
      details: error.message
    }, { status: 500 });
  } finally {
    if (session) {
      await session.endSession();
    }
  }
}
