// check and upload mentor mentee excel sheet data

import { NextResponse } from 'next/server';
import { read, utils } from 'xlsx';
import { connect } from "../../../../../lib/dbConfig";
import { AcademicSession, Mentor } from "../../../../../lib/dbModels";
import { determineAcademicPeriodServer } from "../../../../../components/AdminDash/mentee/utils/academicUtils";

export async function POST(req) {
  try {
    await connect();
    const formData = await req.formData();
    const file = formData.get('file');
    const type = formData.get('type');

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const buffer = await file.arrayBuffer();
    const workbook = read(buffer, { type: 'buffer' });
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    const jsonData = utils.sheet_to_json(worksheet, { header: 1, defval: '', raw: false });

    const filteredData = jsonData.filter(row => row.some(cell => cell));
    if (filteredData.length < 2) {
      throw new Error('File contains no data');
    }

    const headers = filteredData[0];
    const rows = filteredData.slice(1);

    // Update the column mapping for standardization
    const columnMap = {
      'mentee mujid': 'MUJid',
      'mentee name': 'name',
      'mentee email': 'email',
      'year of registration': 'yearOfRegistration',
      'semester': 'semester',
      'cgpa': 'cgpa',        // Add this line
      'backlogs': 'backlogs', // Add this line
      'mentee phone numer': 'phone_number',
      'mentee address': 'address',
      "mentee's father name": 'fatherName',
      "mentee's father phone": 'fatherPhone',
      "mentee's father email": 'fatherEmail',
      "mentee's mother name": 'motherName',
      "mentee's mother phone": 'motherPhone',
      "mentee's mother email": 'motherEmail',
      "mentee's guardian name": 'guardianName',
      "mentee's guardian phone": 'guardianPhone',
      "mentee's guardian email": 'guardianEmail',
      'assigned mentor email': 'mentorEmail'
    };

    // Get current academic period using server-safe function
    const { academicYear, academicSession } = determineAcademicPeriodServer();

    const transformedData = rows.map(row => {
      const entry = {
        role: type === 'mentee' ? ['mentee'] : ['mentor'],
        isActive: true,
        academicYear,
        academicSession
      };
      
      headers.forEach((header, index) => {
        const normalizedHeader = header.toLowerCase().trim();
        const mappedKey = columnMap[normalizedHeader];
        if (mappedKey) {
          let value = row[index]?.toString().trim() ?? '';
          
          // Special handling for numeric fields
          if (mappedKey === 'cgpa' && value) {
            value = parseFloat(value);
          } else if (mappedKey === 'backlogs' && value) {
            value = parseInt(value);
          }
          
          entry[mappedKey] = value;
        }
      });
      
      return entry;
    });

    // Create a map of unique mentors from the data
    const uniqueMentors = new Map();
    const mentorsToCreate = [];
    const mentorsToUpdate = [];

    // First pass: collect unique mentors
    transformedData.forEach(row => {
      if (row.mentorEmail && !uniqueMentors.has(row.mentorEmail)) {
        uniqueMentors.set(row.mentorEmail, {
          email: row.mentorEmail,
          academicYear, // Use automatically determined value
          academicSession, // Use automatically determined value
          role: ['mentor'],
          isFirstTimeLogin: true
        });
      }
    });

    // Check existing mentors
    const existingMentors = await Mentor.find({
      email: { $in: Array.from(uniqueMentors.keys()) }
    }).select('email academicYear academicSession _id');

    // Create mentor email to details map
    const mentorMap = new Map(existingMentors.map(m => [m.email, m]));

    // Categorize mentors for creation/update
    uniqueMentors.forEach((mentorData, email) => {
      const existingMentor = mentorMap.get(email);
      if (!existingMentor) {
        mentorsToCreate.push(mentorData);
      } else if (
        existingMentor.academicYear !== mentorData.academicYear ||
        existingMentor.academicSession !== mentorData.academicSession
      ) {
        mentorsToUpdate.push({
          ...mentorData,
          _id: existingMentor._id
        });
      }
    });

    const errors = [];
    const validData = [];

    // Get valid academic sessions with proper error handling
    const academicSessions = await AcademicSession.find({}, { 
      'sessions.name': 1, 
      'start_year': 1, 
      'end_year': 1 
    }).lean();

    if (!academicSessions || academicSessions.length === 0) {
      return NextResponse.json({ 
        error: 'No academic sessions found in the system' 
      }, { status: 400 });
    }
    
    // Create normalized session map for case-insensitive comparison
    const validSessions = new Map(
      academicSessions.flatMap(as => 
        as.sessions.map(s => ({
          key: `${as.start_year}-${as.end_year}:${s.name}`.toLowerCase(),
          value: {
            academicYear: `${as.start_year}-${as.end_year}`,
            session: s.name
          }
        }))
      ).map(s => [s.key, s.value])
    );

    // Validate each row
    for (const [index, row] of transformedData.entries()) {
      const rowErrors = [];
      const rowNumber = index + 2;

      // Basic validation
      // if (!row.MUJid || !/^MUJ\d{7}$/i.test(row.MUJid)) {
      //   rowErrors.push('Invalid MUJid format (should be MUJxxxxxxx)');
      // }

      if (!row.email) {
        rowErrors.push('Email is required');
      } else if (!row.email.toLowerCase().includes('@')) {
        rowErrors.push('Invalid email format');
      }

      if (!row.name || row.name.length < 2) {
        rowErrors.push('Name is required (minimum 2 characters)');
      }

      // Improved session validation
      const sessionKey = `${row.academicYear}:${row.academicSession}`.toLowerCase();
      const validSession = validSessions.get(sessionKey);
      
      if (!validSession) {
        // console.log('Invalid session:', {
        //   provided: sessionKey,
        //   available: Array.from(validSessions.keys())
        // });
        rowErrors.push(`Invalid academic session: ${row.academicYear} ${row.academicSession}`);
      } else {
        // Normalize the session data
        row.academicYear = validSession.academicYear;
        row.academicSession = validSession.session;
      }

      if (type === 'mentee') {
        if (!row.semester || isNaN(row.semester) || row.semester < 1 || row.semester > 8) {
          rowErrors.push('Invalid semester (must be between 1-8)');
        }

        if (!row.mentorEmail || !row.mentorEmail.includes('@')) {
          rowErrors.push('Invalid mentor email format');
        }

        // Add validation for yearOfRegistration
        const currentYear = new Date().getFullYear();
        const year = parseInt(row.yearOfRegistration);
        if (!year || year < 2020 || year > currentYear) {
          rowErrors.push(`Invalid year of registration (must be between 2020-${currentYear})`);
        }

        // Add mentor status to row data
        const mentor = mentorMap.get(row.mentorEmail);
        if (!mentor) {
          row.mentorStatus = 'new';
        } else if (
          mentor.academicYear !== row.academicYear ||
          mentor.academicSession !== row.academicSession
        ) {
          row.mentorStatus = 'update';
        } else {
          row.mentorStatus = 'existing';
        }
      }

      if (rowErrors.length > 0) {
        errors.push({ row: rowNumber, errors: rowErrors });
      } else {
        validData.push(row);
      }
    }

    // Debug logging
    // console.log('Validation summary:', {
    //   totalRows: transformedData.length,
    //   validRows: validData.length,
    //   errorRows: errors.length,
    //   sampleValidSession: Array.from(validSessions.keys())[0]
    // });

    return NextResponse.json({
      success: true,
      data: validData,
      errors: errors,
      totalRows: transformedData.length,
      academicSessionsAvailable: Array.from(validSessions.values()),
      mentorActions: {
        toCreate: mentorsToCreate,
        toUpdate: mentorsToUpdate,
        summary: {
          total: uniqueMentors.size,
          new: mentorsToCreate.length,               
          update: mentorsToUpdate.length
        }
      }
    });

  } catch (error) {
    console.error('Preview upload error:', error);
    return NextResponse.json(
      { 
        error: error.message || 'Error processing file',
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}