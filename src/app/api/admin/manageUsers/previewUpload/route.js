// check and upload mentor mentee excel sheet data

import { NextResponse } from 'next/server';
import { read, utils } from 'xlsx';
import { connect } from "../../../../../lib/dbConfig";
import { AcademicSession, Mentor } from "../../../../../lib/dbModels";
import { determineAcademicPeriod } from "../../../../../components/AdminDash/mentee/utils/academicUtils";

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

    // Column mapping for standardization
    const columnMap = {
      'mentee mujid': 'MUJid',
      'mentee name': 'name',
      'mentee email': 'email',
      'year of registration': 'yearOfRegistration',
      'section': 'section',
      'semester': 'semester',
      'mentee phone numer': 'phone_number',
      'mentee address': 'address',
      "mentee's father name": 'fatherName',
      "mentee's father phone": 'fatherPhone',
      "mentee's mother name": 'motherName',
      "mentee's mother phone": 'motherPhone',
      "mentee's guardian name": 'guardianName',
      "mentee's guardian phone": 'guardianPhone',
      'assigned mentor email': 'mentorEmail'
    };

    // Get current academic period
    const { academicYear, academicSession } = determineAcademicPeriod();

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
          entry[mappedKey] = row[index]?.toString().trim() ?? '';
        }
      });

      // Debug log
      console.log('Processing row:', {
        MUJid: entry.MUJid,
        mentorEmail: entry.mentorEmail,
        motherName: entry.motherName // Added to verify mother's name is captured
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

    // Get valid academic sessions
    const academicSessions = await AcademicSession.find({}, { 
      'sessions.name': 1, 
      'start_year': 1, 
      'end_year': 1 
    });
    
    const validSessions = new Set(
      academicSessions.flatMap(as => 
        as.sessions.map(s => ({
          session: s.name,
          academicYear: `${as.start_year}-${as.end_year}`
        }))
      ).map(s => `${s.academicYear}:${s.session}`)
    );

    // Validate each row
    for (const [index, row] of transformedData.entries()) {
      const rowErrors = [];
      const rowNumber = index + 2;

      // Basic validation
      if (!row.MUJid || !/^MUJ\d{7}$/i.test(row.MUJid)) {
        rowErrors.push('Invalid MUJid format (should be MUJxxxxxxx)');
      }

      if (!row.email) {
        rowErrors.push('Email is required');
      } else if (!row.email.toLowerCase().includes('@')) {
        rowErrors.push('Invalid email format');
      }

      if (!row.name || row.name.length < 2) {
        rowErrors.push('Name is required (minimum 2 characters)');
      }

      const sessionKey = `${row.academicYear}:${row.academicSession}`;
      if (!Array.from(validSessions).some(s => s.toLowerCase() === sessionKey.toLowerCase())) {
        rowErrors.push('Academic session not found - Please create it first');
      }

      if (type === 'mentee') {
        if (!row.section || !/^[A-Z]$/i.test(row.section)) {
          rowErrors.push('Invalid section (must be a single letter A-Z)');
        }

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

    return NextResponse.json({
      data: validData,
      errors: errors,
      totalRows: transformedData.length,
      academicSessionsAvailable: Array.from(validSessions),
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
    return NextResponse.json(
      { error: error.message || 'Error processing file' },
      { status: 500 }
    );
  }
}