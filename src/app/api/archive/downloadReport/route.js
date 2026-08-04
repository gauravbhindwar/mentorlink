import * as XLSX from 'xlsx';
import { connect } from "@/lib/dbConfig";
import { AcademicSession } from "@/lib/db/academicSessionSchema";

export async function GET(request) {
  try {
    await connect();
    
    const { searchParams } = new URL(request.url);
    const academicYear = searchParams.get('academicYear');
    const academicSession = searchParams.get('academicSession');
    const downloadType = searchParams.get('downloadType');

    if (!academicYear || !academicSession) {
      return new Response('Missing required parameters', { status: 400 });
    }

    // Parse academic year
    const [startYear, endYear] = academicYear.split('-').map(Number);

    // Find the academic session
    const session = await AcademicSession.findOne({
      start_year: startYear,
      end_year: endYear,
      'sessions.name': academicSession
    });

    if (!session) {
      return new Response('No data found for the specified period', { status: 404 });
    }

    // Get the specific session data
    const currentSession = session.sessions.find(s => s.name === academicSession);
    
    if (!currentSession) {
      return new Response('Session not found', { status: 404 });
    }

    // Prepare data based on download type
    let workbook = XLSX.utils.book_new();

    switch (downloadType) {
      case 'mentor':
        // Group by mentors
        currentSession.mentors.forEach(mentor => {
          const mentorData = [
            // Mentor info
            ['Mentor Information'],
            ['MUJ ID', 'Name', 'Email', 'Phone'],
            [mentor.MUJid, mentor.name, mentor.email, mentor.phone_number],
            [],
            // Mentees list
            ['Mentees Information'],
            ['S.No', 'MUJ ID', 'Name', 'Email', 'Semester'],
            ...(mentor.mentees || []).map((mentee, idx) => [
              idx + 1,
              mentee.MUJid,
              mentee.name,
              mentee.email,
              mentee.semester
            ])
          ];

          const ws = XLSX.utils.aoa_to_sheet(mentorData);
          XLSX.utils.book_append_sheet(workbook, ws, `Mentor_${mentor.MUJid}`);
        });
        break;

      case 'semester':
        // Group by semesters
        currentSession.semesters.forEach(semester => {
          const semesterData = semester.meetingPages.flatMap(page => 
            page.meetings.map((meeting, idx) => ({
              'S.No': idx + 1,
              'Meeting ID': meeting.meeting_id,
              'Mentor': meeting.mentorDetails?.name || 'N/A',
              'Date': meeting.meeting_date,
              'Time': meeting.meeting_time,
              'Venue': meeting.meeting_notes?.venue || 'N/A',
              'Attendees': meeting.mentees?.length || 0,
              'Present': meeting.mentees?.filter(m => m.isPresent).length || 0,
              'Report Status': meeting.isReportFilled ? 'Filled' : 'Pending'
            }))
          );

          const ws = XLSX.utils.json_to_sheet(semesterData);
          XLSX.utils.book_append_sheet(workbook, ws, `Semester_${semester.semester_number}`);
        });
        break;

      default:
        // All data in separate sheets
        // Mentors Sheet - Added email field
        const mentorsData = currentSession.mentors.map((mentor, idx) => ({
          'S.No': idx + 1,
          'MUJ ID': mentor.MUJid,
          'Name': mentor.name,
          'Email': mentor.email,
          'Phone': mentor.phone_number,
          'Mentees Count': mentor.mentees?.length || 0
        }));
        XLSX.utils.book_append_sheet(
          workbook,
          XLSX.utils.json_to_sheet(mentorsData),
          'Mentors'
        );

        // Mentees Sheet - Added mentor email
        const menteesData = currentSession.mentors.flatMap(mentor =>
          mentor.mentees.map(mentee => ({
            'MUJ ID': mentee.MUJid,
            'Name': mentee.name,
            'Email': mentee.email,
            'Semester': mentee.semester,
            'Mentor Name': mentor.name,
            'Mentor ID': mentor.MUJid,
            'Mentor Email': mentor.email  // Added mentor email
          }))
        );
        XLSX.utils.book_append_sheet(
          workbook,
          XLSX.utils.json_to_sheet(menteesData),
          'Mentees'
        );

        // Meetings Sheet - Added mentor email
        const meetingsData = currentSession.semesters.flatMap(semester =>
          semester.meetingPages.flatMap(page =>
            page.meetings.map(meeting => ({
              'Meeting ID': meeting.meeting_id,
              'Mentor Name': meeting.mentorDetails?.name || 'N/A',
              'Mentor Email': meeting.mentorDetails?.email || 'N/A', // Added mentor email
              'Date': meeting.meeting_date,
              'Time': meeting.meeting_time,
              'Venue': meeting.meeting_notes?.venue || 'N/A',
              'Total Attendees': meeting.mentees?.length || 0,
              'Present': meeting.mentees?.filter(m => m.isPresent).length || 0,
              'Report Status': meeting.isReportFilled ? 'Filled' : 'Pending'
            }))
          )
        );
        XLSX.utils.book_append_sheet(
          workbook,
          XLSX.utils.json_to_sheet(meetingsData),
          'Meetings'
        );
    }

    // Generate buffer
    const buf = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    // Send response
    return new Response(buf, {
      headers: {
        'Content-Disposition': `attachment; filename="archive-report-${academicYear}-${academicSession}-${downloadType}.xlsx"`,
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      },
    });

  } catch (error) {
    console.error('Download report error:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}
