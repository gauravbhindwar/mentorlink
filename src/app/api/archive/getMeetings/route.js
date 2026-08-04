import { NextResponse } from "next/server";
import { connect } from "@/lib/dbConfig";
import { AcademicSession } from "@/lib/db/academicSessionSchema";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const academicYear = searchParams.get('academicYear');
    const academicSession = searchParams.get('academicSession');

    if (!academicYear || !academicSession) {
      return NextResponse.json(
        { message: "Academic year and session are required" },
        { status: 400 }
      );
    }

    await connect();
    const [startYear, endYear] = academicYear.split('-').map(Number);

    const meetings = await AcademicSession.aggregate([
      {
        $match: {
          start_year: startYear,
          end_year: endYear,
          'sessions.name': academicSession
        }
      },
      { $unwind: '$sessions' },
      { $match: { 'sessions.name': academicSession } },
      { $unwind: '$sessions.semesters' },
      { $unwind: '$sessions.semesters.meetingPages' },
      { $unwind: '$sessions.semesters.meetingPages.meetings' },
      {
        $project: {
          _id: 0,
          meeting_id: '$sessions.semesters.meetingPages.meetings.meeting_id',
          mentorName: '$sessions.semesters.meetingPages.meetings.mentorDetails.name',
          mentorMUJid: '$sessions.semesters.meetingPages.meetings.mentorMUJid',
          date: '$sessions.semesters.meetingPages.meetings.meeting_date',
          time: '$sessions.semesters.meetingPages.meetings.meeting_time',
          venue: '$sessions.semesters.meetingPages.meetings.meeting_notes.venue',
          attendees: { $size: '$sessions.semesters.meetingPages.meetings.mentees' },
          present: {
            $size: {
              $filter: {
                input: '$sessions.semesters.meetingPages.meetings.mentees',
                as: 'mentee',
                cond: '$$mentee.isPresent'
              }
            }
          },
          isReportFilled: '$sessions.semesters.meetingPages.meetings.isReportFilled',
          semester: '$sessions.semesters.semester_number'
        }
      },
      { $sort: { date: -1 } }
    ]);

    const items = meetings.map((meeting, index) => ({
      id: `meeting-${index + 1}`,
      serialNumber: index + 1,
      ...meeting,
      date: meeting.date ? new Date(meeting.date).toLocaleDateString() : 'N/A'
    }));

    return NextResponse.json({
      items,
      total: items.length,
      page: 0,
      pageSize: 'all'
    });

  } catch (error) {
    console.error('Meetings fetch error:', error);
    return NextResponse.json(
      { message: "Error fetching meetings data" },
      { status: 500 }
    );
  }
}
