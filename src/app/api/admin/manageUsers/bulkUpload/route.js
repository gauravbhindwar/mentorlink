import { connect } from "../../../../../lib/dbConfig";
import { Mentee, Mentor } from "../../../../../lib/dbModels";
import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    await connect();
    const { data, mentorActions, type } = await req.json();
    console.log('Received type:', type);

    if (type === 'assignMentee') {
      // Get unique mentor emails from the data
      const uniqueMentorEmails = [...new Set(data.map(m => m.mentorEmail))];
      console.log('Unique mentor emails:', uniqueMentorEmails);

      // First, get existing mentors
      const existingMentors = await Mentor.find({
        email: { $in: uniqueMentorEmails }
      }).select('email MUJid academicYear academicSession');

      const existingMentorMap = new Map(existingMentors.map(m => [m.email, m]));
      
      // Get latest mentor MUJid for new mentors
      const latestMentor = await Mentor.findOne({})
        .sort({ MUJid: -1 })
        .select('MUJid');

      let nextMentorId = 1;
      if (latestMentor?.MUJid) {
        const match = latestMentor.MUJid.match(/\d+/);
        if (match) {
          nextMentorId = parseInt(match[0]) + 1;
        }
      }

      // Separate mentors into new and updates
      const mentorOps = uniqueMentorEmails.map(email => {
        const menteeData = data.find(m => m.mentorEmail === email);
        const existingMentor = existingMentorMap.get(email);

        if (!existingMentor) {
          // Create new mentor
          return {
            updateOne: {
              filter: { email },
              update: {
                $setOnInsert: {
                  email,
                  MUJid: `MUJ${String(nextMentorId++).padStart(5, '0')}`,
                  role: ['mentor'],
                  isFirstTimeLogin: true,
                  isActive: true,
                  created_at: new Date()
                },
                $set: {
                  academicYear: menteeData.academicYear,
                  academicSession: menteeData.academicSession,
                  updated_at: new Date()
                }
              },
              upsert: true
            }
          };
        } else {
          // Only update academic details if they're different
          if (existingMentor.academicYear !== menteeData.academicYear || 
              existingMentor.academicSession !== menteeData.academicSession) {
            return {
              updateOne: {
                filter: { email },
                update: {
                  $set: {
                    academicYear: menteeData.academicYear,
                    academicSession: menteeData.academicSession,
                    updated_at: new Date()
                  }
                }
              }
            };
          }
        }
      }).filter(Boolean); // Remove any undefined operations

      // Process mentor operations
      console.log('Processing mentor operations...');
      const mentorResult = await Mentor.bulkWrite(mentorOps);
      console.log('Mentor operation results:', mentorResult);

      // Get updated mentor details
      const updatedMentors = await Mentor.find({
        email: { $in: uniqueMentorEmails }
      });

      const mentorEmailMap = new Map(
        updatedMentors.map(m => [m.email, { MUJid: m.MUJid, email: m.email }])
      );

      // Process mentee records
      const menteeRecords = data.map(mentee => {
        const mentorInfo = mentorEmailMap.get(mentee.mentorEmail);
        return {
          name: mentee.name,
          email: mentee.email,
          MUJid: mentee.MUJid,
          phone: mentee.phone_number,
          address: mentee.address,
          yearOfRegistration: parseInt(mentee.yearOfRegistration),
          section: mentee.section.toUpperCase(),
          semester: parseInt(mentee.semester),
          academicYear: mentee.academicYear,
          academicSession: mentee.academicSession,
          parents: {
            father: {
              name: mentee.fatherName || null,
              phone: mentee.fatherPhone || null
            },
            mother: {
              name: mentee.motherName || null,
              phone: mentee.motherPhone || null
            },
            guardian: {
              name: mentee.guardianName || null,
              phone: mentee.guardianPhone || null
            }
          },
          mentorMujid: mentorInfo?.MUJid,
          mentorEmailid: mentorInfo?.email,
          updated_at: new Date(),
          role: ['mentee'],
          isActive: true
        };
      });

      // Update mentees
      const menteeResult = await Mentee.bulkWrite(
        menteeRecords.map(record => ({
          updateOne: {
            filter: { MUJid: record.MUJid },
            update: {
              $set: record,
              $setOnInsert: { created_at: new Date() }
            },
            upsert: true
          }
        }))
      );

      return NextResponse.json({
        success: true,
        message: 'Processing completed successfully',
        summary: {
          mentors: {
            created: mentorResult.upsertedCount,
            updated: mentorResult.modifiedCount
          },
          mentees: {
            processed: menteeResult.modifiedCount + menteeResult.upsertedCount
          }
        }
      });
    }

    if (type === 'mentor') {
      // Get latest mentor MUJid for new mentors
      const latestMentor = await Mentor.findOne({
        MUJid: { $regex: /^MUJ\d{3}$/ }
      }).sort({ MUJid: -1 });

      let nextMentorId = 1;
      if (latestMentor?.MUJid) {
        const match = latestMentor.MUJid.match(/\d+/);
        if (match) {
          nextMentorId = parseInt(match[0]) + 1;
        }
      }

      const mentorRecords = data.map(mentor => ({
        name: mentor.name || null,
        email: mentor.email,
        MUJid: mentor.MUJid || `MUJ${String(nextMentorId++).padStart(3, '0')}`,
        phone_number: mentor.phone_number || null,
        gender: mentor.gender || null,
        role: ['mentor'],
        academicYear: mentor.academicYear,
        academicSession: mentor.academicSession,
        isFirstTimeLogin: true,
        isActive: true
      }));

      console.log('Creating/Updating mentors:', mentorRecords);

      const bulkOps = mentorRecords.map(record => ({
        updateOne: {
          filter: { email: record.email },
          update: { 
            $set: record,
            $setOnInsert: {
              created_at: new Date(),
            },
            $currentDate: {
              updated_at: true
            }
          },
          upsert: true
        }
      }));

      const result = await Mentor.bulkWrite(bulkOps);
      console.log('Mentor upload result:', result);

      return NextResponse.json({
        success: true,
        message: `Successfully processed ${result.upsertedCount + result.modifiedCount} mentors`,
        details: result
      });
    }

    // Handle mentee upload case
    if (type === 'mentee') {
      // Get latest mentor MUJid
      const latestMentor = await Mentor.findOne({})
        .sort({ MUJid: -1 })
        .select('MUJid');

      let nextMentorId = 1;
      if (latestMentor?.MUJid) {
        const match = latestMentor.MUJid.match(/\d+/);
        if (match) {
          nextMentorId = parseInt(match[0]) + 1;
        }
      }

      console.log('Next mentor ID:', nextMentorId);

      // Handle mentor creation with auto-incrementing MUJids
      if (mentorActions?.toCreate?.length > 0) {
        const mentorsWithIds = mentorActions.toCreate.map(mentor => ({
          ...mentor,
          MUJid: `MUJ${String(nextMentorId++).padStart(3, '0')}`,
          isFirstTimeLogin: true,
          role: ['mentor'],
          created_at: new Date(),
          updated_at: new Date()
        }));

        console.log('Creating mentors:', mentorsWithIds);
        await Mentor.insertMany(mentorsWithIds);
      }

      // Update existing mentors
      if (mentorActions?.toUpdate?.length > 0) {
        await Promise.all(mentorActions.toUpdate.map(mentor =>
          Mentor.findOneAndUpdate(
            { email: mentor.email },
            {
              $set: {
                academicYear: mentor.academicYear,
                academicSession: mentor.academicSession,
                updated_at: new Date()
              }
            }
          )
        ));
      }

      // Get all mentor details after updates
      const updatedMentors = await Mentor.find({
        email: { $in: [...new Set(data.map(m => m.mentorEmail))] }
      });

      console.log('Found mentors:', updatedMentors.length);

      const mentorEmailMap = new Map(
        updatedMentors.map(m => [m.email, { MUJid: m.MUJid, email: m.email }])
      );

      // Prepare mentee records
      const menteeRecords = data.map(mentee => {
        const mentorInfo = mentorEmailMap.get(mentee.mentorEmail);
        console.log(`Mentor info for ${mentee.mentorEmail}:`, mentorInfo);

        return {
          name: mentee.name,
          email: mentee.email,
          MUJid: mentee.MUJid,
          phone: mentee.phone_number,
          address: mentee.address,
          yearOfRegistration: parseInt(mentee.yearOfRegistration),
          section: mentee.section.toUpperCase(),
          semester: parseInt(mentee.semester),
          academicYear: mentee.academicYear,
          academicSession: mentee.academicSession,
          parents: {
            father: {
              name: mentee.fatherName || null,
              phone: mentee.fatherPhone || null
            },
            mother: {
              name: mentee.motherName || null,
              phone: mentee.motherPhone || null
            },
            guardian: {
              name: mentee.guardianName || null,
              phone: mentee.guardianPhone || null
            }
          },
          mentorMujid: mentorInfo?.MUJid || null,
          mentorEmailid: mentorInfo?.email || null,
          updated_at: new Date()
        };
      });

      // Verify mentor associations
      menteeRecords.forEach(record => {
        if (!record.mentorMujid || !record.mentorEmailid) {
          console.warn(`Missing mentor info for mentee ${record.MUJid}`);
        }
      });

      // Use bulkWrite for mentees
      const bulkOps = menteeRecords.map(record => ({
        updateOne: {
          filter: { MUJid: record.MUJid },
          update: { 
            $set: record,
            $setOnInsert: { created_at: new Date() }
          },
          upsert: true
        }
      }));

      console.log('Uploading mentees:', menteeRecords.length);
      const result = await Mentee.bulkWrite(bulkOps);
      console.log('Upload result:', result);

      return NextResponse.json({
        success: true,
        message: `Successfully processed ${result.upsertedCount + result.modifiedCount} records`,
        mentorsSummary: {
          created: mentorActions?.toCreate?.length || 0,
          updated: mentorActions?.toUpdate?.length || 0,
          mentorAssociations: menteeRecords.map(r => ({
            menteeMUJid: r.MUJid,
            mentorMUJid: r.mentorMujid,
            mentorEmail: r.mentorEmailid
          }))
        }
      });
    }

    return NextResponse.json({
      error: 'Invalid upload type'
    }, { status: 400 });

  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: error.message || 'Error uploading data' },
      { status: 500 }
    );
  }
}