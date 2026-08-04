import { NextResponse } from "next/server";
import { connect } from "@/lib/dbConfig";
import { AcademicSession } from "@/lib/db/academicSessionSchema";

export async function GET(request) {
  try {
    await connect();
    
    const { searchParams } = new URL(request.url);
    const academicYear = searchParams.get('academicYear');
    const academicSession = searchParams.get('academicSession');
    const page = parseInt(searchParams.get('page')) || 0;
    const pageSize = parseInt(searchParams.get('pageSize')) || 10;

    if (!academicYear || !academicSession) {
      return NextResponse.json({ message: "Missing parameters" }, { status: 400 });
    }

    const [startYear, endYear] = academicYear.split('-').map(Number);

    // Split into two simpler queries for better performance
    const totalCount = await AcademicSession.aggregate([
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
      { $count: 'total' }
    ]).exec();

    const mentors = await AcademicSession.aggregate([
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
      {
        $project: {
          _id: 0,
          MUJid: '$sessions.mentors.MUJid',
          name: '$sessions.mentors.name',
          email: '$sessions.mentors.email',
          phone_number: '$sessions.mentors.phone_number',
          mentees: '$sessions.mentors.mentees'
        }
      },
      { $sort: { name: 1 } }
    ]).exec();

    const items = mentors.map((mentor, index) => ({
      id: `mentor-${index + 1}`,
      serialNumber: index + 1,
      ...mentor,
      mentee_count: mentor.mentees?.length || 0
    }));

    return NextResponse.json({ 
      items, 
      total: totalCount[0]?.total || 0,
      page,
      pageSize 
    });

  } catch (error) {
    console.error('Archive fetch error:', error);
    return NextResponse.json(
      { message: "Failed to fetch archive data" },
      { status: 500 }
    );
  }
}
