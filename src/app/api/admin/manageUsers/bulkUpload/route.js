import { connect } from "../../../../../lib/dbConfig";
import { Mentee, Mentor } from "../../../../../lib/dbModels";
import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    await connect();
    const { data, type } = await req.json();

    if (!data || !Array.isArray(data)) {
      return NextResponse.json({ error: 'Invalid data format' }, { status: 400 });
    }

    console.log(`Processing bulk upload for type: ${type}`);
    console.log(`Number of records: ${data.length}`);

    const results = {
      success: [],
      errors: [],
      savedCount: 0,
      mentorsSaved: 0
    };

    // Create a Map to store unique mentor information keyed by email
    const uniqueMentors = new Map();

    // First pass: Collect unique mentor information by email
    if (type === 'mentee') {
      data.forEach(record => {
        if (record.mentorEmailid && !uniqueMentors.has(record.mentorEmailid)) {
          uniqueMentors.set(record.mentorEmailid, {
            email: record.mentorEmailid,
            MUJid: record.mentorMujid || null, // Optional MUJid
            role: ['mentor'],
            phone_number: record.mentorPhone || null,
            name: null,
            academicYear: record.academicYear,
            academicSession: record.academicSession
          });
        }
      });
    }

    // Create mentors first
    if (type === 'mentee' && uniqueMentors.size > 0) {
      for (const mentorData of uniqueMentors.values()) {
        try {
          // Check if mentor already exists by email
          const existingMentor = await Mentor.findOne({ email: mentorData.email });
          if (!existingMentor) {
            const newMentor = new Mentor(mentorData);
            await newMentor.save();
            results.mentorsSaved++;
            console.log(`Created new mentor with email: ${mentorData.email}`);
          }
        } catch (error) {
          console.log(`Error creating mentor with email ${mentorData.email}:`, error);
          // Continue with mentee creation even if mentor creation fails
        }
      }
    }

    // Then create mentees
    const Model = type === 'mentee' ? Mentee : Mentor;
    for (const record of data) {
      try {
        const newRecord = new Model(record);
        await newRecord.save();
        results.success.push(record.MUJid);
        results.savedCount++;
        console.log(`Successfully saved ${type}: ${record.MUJid}`);
      } catch (error) {
        let errorMessage = '';
        if (error.code === 11000) {
          const field = Object.keys(error.keyPattern)[0];
          const value = error.keyValue[field];
          errorMessage = `Duplicate ${field} found: ${value}`;
        } else {
          errorMessage = error.message || 'Unknown error occurred';
        }
        
        results.errors.push({
          mujid: record.MUJid,
          error: errorMessage
        });
      }
    }

    return NextResponse.json({
      message: `Successfully processed ${results.savedCount} out of ${data.length} records. Created ${results.mentorsSaved} new mentors.`,
      success: results.success,
      errors: results.errors,
      savedCount: results.savedCount,
      mentorsSaved: results.mentorsSaved
    }, { status: 207 });

  } catch (error) {
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error.message
    }, { status: 500 });
  }
}