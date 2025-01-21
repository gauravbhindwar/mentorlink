import { NextResponse } from "next/server";
import {connect }from "@/lib/dbConfig";
import { AcademicSession } from "@/lib/db/academicSessionSchema";
import { Mentor } from "@/lib/db/mentorSchema";

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

    // Split academic year into start and end years
    const [startYear, endYear] = academicYear.split('-').map(Number);

    // Find the academic session record
    const sessionRecord = await AcademicSession.findOne({
      start_year: startYear,
      end_year: endYear,
      'sessions.name': academicSession
    });

    if (!sessionRecord) {
      return NextResponse.json(
        { message: "No records found for the specified academic period" },
        { status: 404 }
      );
    }

    // Get unique mentor MUJIDs from the meetings in this session
    const mentorMUJids = new Set();
    sessionRecord.sessions.forEach(session => {
      if (session.name === academicSession) {
        session.semesters.forEach(semester => {
          semester.sections.forEach(section => {
            section.meetings.forEach(meeting => {
              if (meeting.mentorMUJid) {
                mentorMUJids.add(meeting.mentorMUJid);
              }
            });
          });
        });
      }
    });

    // Fetch mentor details with aggregate to get mentee count
    const mentors = await Mentor.aggregate([
      {
        $match: {
          MUJid: { $in: Array.from(mentorMUJids) }
        }
      },
      {
        $lookup: {
          from: "academicsessions",
          let: { mentorMUJid: "$MUJid" },
          pipeline: [
            {
              $match: {
                start_year: startYear,
                end_year: endYear,
                "sessions.name": academicSession
              }
            },
            { $unwind: "$sessions" },
            { $unwind: "$sessions.semesters" },
            { $unwind: "$sessions.semesters.sections" },
            { $unwind: "$sessions.semesters.sections.meetings" },
            {
              $match: {
                $expr: {
                  $eq: ["$sessions.semesters.sections.meetings.mentorMUJid", "$$mentorMUJid"]
                }
              }
            },
            {
              $group: {
                _id: null,
                mentees: { $addToSet: "$sessions.semesters.sections.meetings.mentee_ids" }
              }
            }
          ],
          as: "menteeData"
        }
      },
      {
        $addFields: {
          mentees: {
            $reduce: {
              input: { $arrayElemAt: ["$menteeData.mentees", 0] },
              initialValue: [],
              in: { $setUnion: ["$$value", "$$this"] }
            }
          }
        }
      },
      {
        $project: {
          _id: 1,
          MUJid: 1,
          name: 1,
          email: 1,
          department: 1,
          phone_number: 1,
          mentees: 1
        }
      }
    ]);

    return NextResponse.json(mentors);

  } catch (error) {
    console.error('Archive fetch error:', error);
    return NextResponse.json(
      { message: "Error fetching archive data" },
      { status: 500 }
    );
  }
}
