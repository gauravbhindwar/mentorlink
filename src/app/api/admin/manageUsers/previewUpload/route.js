import { NextResponse } from 'next/server';
import { read, utils } from 'xlsx';
import { connect } from "../../../../../lib/dbConfig";
import { AcademicSession } from "../../../../../lib/dbModels";

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

    const requiredColumns = type === 'mentee' ? [
      'name', 'email', 'MUJid', 'yearOfRegistration',
      'section', 'semester', 'academicYear', 'academicSession',
      'mentorMujid'
    ] : [
      'name', 'email', 'MUJid', 'phone_number',
      'gender', 'role', 'academicYear', 'academicSession'
    ];

    const missingColumns = requiredColumns.filter(col => 
      !headers.map(h => h.toLowerCase()).includes(col.toLowerCase())
    );

    if (missingColumns.length > 0) {
      throw new Error(`Missing required columns: ${missingColumns.join(', ')}`);
    }

    const transformedData = rows.map(row => {
      const entry = {};
      headers.forEach((header, index) => {
        entry[header] = row[index]?.toString().trim() || '';
      });
      return entry;
    });

    const errors = [];
    const validData = [];
    const seenEmails = new Set();

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

    for (const [index, row] of transformedData.entries()) {
      const rowErrors = [];
      const rowNumber = index + 2;

      if (!row.MUJid || !/^[A-Z0-9]+$/.test(row.MUJid)) {
        rowErrors.push('Invalid MUJid format');
      }

      if (!row.email) {
        rowErrors.push('Email is required');
      } else if (!row.email.includes('@')) {
        rowErrors.push('Invalid email format');
      } else if (seenEmails.has(row.email.toLowerCase())) {
        rowErrors.push('Duplicate email found in upload');
      } else {
        seenEmails.add(row.email.toLowerCase());
      }

      const sessionKey = `${row.academicYear}:${row.academicSession}`;
      if (!validSessions.has(sessionKey)) {
        rowErrors.push('Academic session not found - Please create it first');
      }

      if (type === 'mentee') {
        if (!row.section || !/^[A-Z]$/.test(row.section)) {
          rowErrors.push('Invalid section (must be A-Z)');
        }

        const semester = parseInt(row.semester);
        if (isNaN(semester) || semester < 1 || semester > 8) {
          rowErrors.push('Invalid semester (must be 1-8)');
        }

        if (!row.mentorMujid || !/^[A-Z0-9]+$/.test(row.mentorMujid)) {
          rowErrors.push('Invalid mentor MUJid format');
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
      academicSessionsAvailable: Array.from(validSessions)
    });

  } catch (error) {
    return NextResponse.json(
      { error: error.message || 'Error processing file' },
      { status: 500 }
    );
  }
}