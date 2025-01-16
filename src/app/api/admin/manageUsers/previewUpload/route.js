import { NextResponse } from 'next/server';
import { read, utils } from 'xlsx';

export async function POST(req) {
  try {
    const formData = await req.formData();
    const file = formData.get('file');
    const type = formData.get('type'); // Get the type (mentor or mentee)

    // console.log('Received type:', type); // Debugging statement

    if (!file) {
      // console.error('No file provided');
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Convert file to buffer
    const buffer = await file.arrayBuffer();

    // Parse Excel file
    const workbook = read(buffer, { type: 'buffer' });
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    const jsonData = utils.sheet_to_json(worksheet, { header: 1, defval: '', raw: false });

    // Remove empty rows and validate headers
    const filteredData = jsonData.filter(row => row.some(cell => cell));
    if (filteredData.length < 2) {
      throw new Error('File contains no data');
    }

    // Extract headers and data
    const headers = filteredData[0];
    const rows = filteredData.slice(1);

    // console.log('Headers:', headers); // Debugging statement

    // Define required columns based on type
    const requiredColumns = type === 'mentee' ? [
      'name', 'email', 'MUJid', 'yearOfRegistration',
      'section', 'semester', 'academicYear', 'academicSession',
      'mentorMujid'
    ] : [
      'name', 'email', 'MUJid', 'phone_number',
      'gender', 'role', 'academicYear', 'academicSession'
    ];

    // console.log('Required columns:', requiredColumns); // Debugging statement

    const missingColumns = requiredColumns.filter(col => 
      !headers.map(h => h.toLowerCase()).includes(col.toLowerCase())
    );

    if (missingColumns.length > 0) {
      throw new Error(`Missing required columns: ${missingColumns.join(', ')}`);
    }

    // Transform data to match schema
    const transformedData = rows.map(row => {
      const entry = {};
      headers.forEach((header, index) => {
        entry[header] = row[index] || '';
      });
      return entry;
    });

    // Basic validation
    const errors = [];
    const validData = [];

    transformedData.forEach((row, index) => {
      const rowErrors = [];

      if (!row.MUJid || !/^[A-Z0-9]+$/.test(row.MUJid)) {
        rowErrors.push('Invalid MUJid format');
      }

      if (!row.email || !row.email.includes('@')) {
        rowErrors.push('Invalid email format');
      }

      if (type === 'mentee') {
        if (!row.section || !/^[A-Z]$/.test(row.section)) {
          rowErrors.push('Invalid section (must be A-Z)');
        }

        const semester = parseInt(row.semester);
        if (isNaN(semester) || semester < 1 || semester > 8) {
          rowErrors.push('Invalid semester (must be 1-8)');
        }
      }

      if (rowErrors.length > 0) {
        errors.push({ row: index + 2, errors: rowErrors });
      } else {
        validData.push(row);
      }
    });

    // console.log('Sending preview response:', { data: validData, errors, totalRows: transformedData.length });

    return NextResponse.json({
      data: validData,
      errors: errors,
      totalRows: transformedData.length
    });

  } catch (error) {
    // console.error('Preview upload error:', error);
    return NextResponse.json(
      { error: error.message || 'Error processing file' },
      { status: 500 }
    );
  }
}