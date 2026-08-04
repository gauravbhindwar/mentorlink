import { NextResponse } from 'next/server';
import { connect } from '../../../../lib/dbConfig';
import { Mentee } from '../../../../lib/db/menteeSchema';
import { Meeting } from '../../../../lib/db/meetingSchema';
import { Mentor } from '../../../../lib/db/mentorSchema';

const timeline = [
  { sem: 1, session: 'JULY-DECEMBER 2022', year: '2022-2023' },
  { sem: 2, session: 'JANUARY-JUNE 2023', year: '2022-2023' },
  { sem: 3, session: 'JULY-DECEMBER 2023', year: '2023-2024' },
  { sem: 4, session: 'JANUARY-JUNE 2024', year: '2023-2024' },
  { sem: 5, session: 'JULY-DECEMBER 2024', year: '2024-2025' },
  { sem: 6, session: 'JANUARY-JUNE 2025', year: '2024-2025' },
  { sem: 7, session: 'JULY-DECEMBER 2025', year: '2025-2026' },
  { sem: 8, session: 'JANUARY-JUNE 2026', year: '2025-2026' },
];

export async function GET(req) {
  try {
    await connect();

    const { searchParams } = new URL(req.url);
    const mentorId = searchParams.get('mentorId') || 'MUJ00079';

    // 1. Verify mentor exists
    const mentor = await Mentor.findOne({ MUJid: mentorId });
    if (!mentor) {
      return NextResponse.json({ success: false, message: `Mentor ${mentorId} not found.` }, { status: 404 });
    }

    // 2. Clean up previous preview mentees for this mentor
    await Mentee.deleteMany({ mentorMujid: mentorId, MUJid: { $regex: /^PREV/ } });
    
    // We also want to clear out any old generated meetings for this mentor if they only contain PREV mentees,
    // but to be safe we can just clear ALL meetings for this mentor that match our timeline years.
    // NOTE: This clears the mentor's meetings for these academic years.
    const timelineYears = [...new Set(timeline.map(t => t.year))];
    await Meeting.deleteMany({
      mentorMUJid: mentorId,
      'academicDetails.academicYear': { $in: timelineYears }
    });

    // 3. Generate Historical Meetings & Mentees
    let totalMeetingsCreated = 0;
    let totalMenteesCreated = 0;

    for (const term of timeline) {
      const menteeIds = [];
      const menteesData = [];
      
      // Generate 5 mentees for THIS semester
      for (let i = 1; i <= 5; i++) {
        const mujid = `PREV${term.sem}00${i}`;
        menteeIds.push(mujid);
        menteesData.push({
          name: `Preview Mentee ${term.sem}-${i}`,
          email: `preview.sem${term.sem}.${i}@jaipur.manipal.edu`,
          MUJid: mujid,
          phone: `987654321${i}`,
          yearOfRegistration: 2022,
          semester: term.sem,
          academicYear: term.year,
          academicSession: term.session,
          mentorMujid: mentorId,
          mentorEmailid: mentor.email,
          cgpa: parseFloat(`8.${10 + i}`),
          backlogs: i % 2 === 0 ? 1 : 0,
          mentorRemarks: `Progress remarks for semester ${term.sem}.`,
        });
      }
      
      await Mentee.insertMany(menteesData);
      totalMenteesCreated += menteesData.length;

      // Find or create the root Meeting doc for this academic year & session
      let meetingRoot = await Meeting.findOne({
        mentorMUJid: mentorId,
        'academicDetails.academicYear': term.year,
        'academicDetails.academicSession': term.session,
      });

      if (!meetingRoot) {
        meetingRoot = new Meeting({
          mentorMUJid: mentorId,
          academicDetails: {
            academicYear: term.year,
            academicSession: term.session,
          },
          meetings: []
        });
      }

      // Generate 2 meetings per semester
      for (let m = 1; m <= 2; m++) {
        const meetingDate = new Date();
        const baseYear = parseInt(term.year.split('-')[0]);
        if (term.session.startsWith('JULY')) {
          meetingDate.setFullYear(baseYear, 7 + m, 15);
        } else {
          meetingDate.setFullYear(baseYear + 1, 1 + m, 15);
        }

        const presentMentees = menteeIds.filter(() => Math.random() > 0.2);

        const meetingData = {
          meeting_id: `MTG-${term.sem}-${m}-${Date.now()}`,
          semester: term.sem,
          meeting_date: meetingDate,
          meeting_time: "02:30 PM",
          isReportFilled: true,
          meeting_notes: {
            TopicOfDiscussion: `Semester ${term.sem} Progress Review ${m}`,
            TypeOfInformation: "Academic & General",
            NotesToStudent: "Keep focusing on core subjects.",
            isMeetingOnline: false,
            venue: "Room 402, AB-1",
            feedbackFromMentee: "Everything is going well.",
            issuesRaisedByMentee: "None",
            outcome: "Satisfactory",
            closureRemarks: "Next meeting scheduled in a month."
          },
          mentee_ids: menteeIds,
          present_mentees: presentMentees,
          scheduledAT: {
            scheduleDate: meetingDate,
            scheduleTime: "02:30 PM"
          }
        };

        meetingRoot.meetings.push(meetingData);
        totalMeetingsCreated++;
      }

      await meetingRoot.save();
    }

    return NextResponse.json({
      success: true,
      message: `Preview data seeded successfully for mentor ${mentorId}!`,
      details: {
        menteesCreated: totalMenteesCreated,
        meetingsCreated: totalMeetingsCreated,
        semestersCovered: timeline.length
      }
    });

  } catch (error) {
    console.error('Seeding Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
