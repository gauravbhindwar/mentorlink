import { connect } from "@/lib/dbConfig";
import { AcademicSession } from "@/lib/db/academicSessionSchema";

export async function GET(request) {
  try {
    await connect();
    
    const { searchParams } = new URL(request.url);
    const academicYear = searchParams.get('academicYear');
    const academicSession = searchParams.get('academicSession');

    // Parse academic year
    const [startYear, endYear] = academicYear.split('-').map(Number);

    const session = await AcademicSession.findOne({
      start_year: startYear,
      end_year: endYear,
      'sessions.name': academicSession
    }).lean();

    // Consolidated debug logs instead of printing repeatedly
    // console.log('Raw session data:', {
    //   totalMentors: session?.sessions[0]?.mentors?.length,
    //   totalSemesters: session?.sessions[0]?.semesters?.length,
    // });

    if (!session) {
      return new Response('No data found for the specified period', { status: 404 });
    }

    // Get the specific session
    const currentSession = session.sessions.find(s => s.name === academicSession);
    
    if (!currentSession) {
      return new Response('Session not found', { status: 404 });
    }

    // Enhanced data processing with validation
    const processedSession = {
      ...currentSession,
      mentors: currentSession.mentors
        .filter(mentor => mentor && mentor.email) // Change from MUJid to email validation
        .map(mentor => ({
          email: mentor.email, // Primary identifier changed from MUJid to email
          name: mentor.name || 'Unknown',
          phone_number: mentor.phone_number || '',
          totalMeetings: 0, // Will be updated below
          mentees: (mentor.mentees || [])
            .filter(mentee => mentee) // Keep all mentees, just filter null/undefined
            .map(mentee => ({
              MUJid: mentee.MUJid || '',
              name: mentee.name || 'Unknown',
              email: mentee.email || '',
              section: mentee.section || '',
              semester: mentee.semester,
              meetings_attended: 0, // Will be updated below
              total_meetings: 0,
              mentorRemarks: mentee.mentorRemarks || ''
            }))
        })),
      semesters: currentSession.semesters.map(semester => ({
        semester_number: semester.semester_number,
        meetingPages: semester.meetingPages.map(page => ({
          pageNumber: page.pageNumber,
          meetings: page.meetings.map(meeting => {
            // Find mentor by email instead of MUJid
            const mentor = currentSession.mentors.find(m => m.email === meeting.mentorDetails?.email);
            
            return {
              meeting_id: meeting.meeting_id,
              mentorDetails: {
                email: meeting.mentorDetails?.email, // Primary identifier
                name: mentor?.name || 'Unknown',
                phone_number: mentor?.phone_number || ''
              },
              meeting_date: meeting.meeting_date,
              meeting_time: meeting.meeting_time,
              section: meeting.section,
              semester: semester.semester_number,
              isReportFilled: meeting.isReportFilled,
              meeting_notes: meeting.meeting_notes || {},
              mentees: (meeting.mentees || []).map(mentee => ({
                MUJid: mentee.MUJid,
                name: mentee.name,
                email: mentee.email,
                isPresent: mentee.isPresent || false,
                mentorRemarks: mentee.mentorRemarks || ''
              }))
            };
          })
        }))
      }))
    };

    // Debug mentors count after processing
    // console.log('Processed mentors count:', processedSession.mentors.length);
    // console.log('Sample processed data:', {
    //   totalMentors: processedSession.mentors.length,
    //   firstMentor: processedSession.mentors[0]
    //     ? {
    //         name: processedSession.mentors[0].name,
    //         totalMentees: processedSession.mentors[0].mentees.length,
    //         sampleMentee: processedSession.mentors[0].mentees[0],
    //       }
    //     : null,
    // });

    // Validation check before sending response
    if (!processedSession.mentors || processedSession.mentors.length === 0) {
      return new Response('No valid mentor data found', { status: 404 });
    }

    return new Response(JSON.stringify({ 
      currentSession: processedSession,
      totalMeetings: processedSession.semesters.reduce((acc, sem) => 
        acc + sem.meetingPages.reduce((acc2, page) => 
          acc2 + page.meetings.length, 0), 0)
    }), {
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    // console.error('Get session data error:', error);
    return new Response(JSON.stringify({ error: error.message }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
