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

    const sessionRecord = await AcademicSession.aggregate([
      {
        $match: {
          start_year: startYear,
          end_year: endYear,
          'sessions.name': academicSession
        }
      },
      { $unwind: '$sessions' },
      { $match: { 'sessions.name': academicSession } },
      { $unwind: '$sessions.mentors' },
      { $unwind: '$sessions.mentors.mentees' },
      {
        $project: {
          _id: 0,
          MUJid: '$sessions.mentors.mentees.MUJid',
          name: '$sessions.mentors.mentees.name',
          email: '$sessions.mentors.mentees.email',
          semester: '$sessions.mentors.mentees.semester',
          mentorName: '$sessions.mentors.name',
          mentorMUJid: '$sessions.mentors.MUJid'
        }
      },
      { $sort: { name: 1 } }
    ]);

    const items = sessionRecord.map((mentee, index) => ({
      id: `mentee-${index + 1}`,
      serialNumber: index + 1,
      ...mentee
    }));

    return NextResponse.json({
      items,
      total: items.length,
      page: 0,
      pageSize: 'all'
    });

  } catch (error) {
    console.error('Mentees fetch error:', error);
    return NextResponse.json(
      { message: "Error fetching mentees data" },
      { status: 500 }
    );
  }
}
