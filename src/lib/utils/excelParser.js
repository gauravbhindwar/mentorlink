import * as XLSX from 'xlsx';

const parseExcelFile = (buffer) => {
  return new Promise((resolve, reject) => {
    try {
      const workbook = XLSX.read(buffer, { type: 'buffer' });
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { 
        header: 1,
        defval: '',
        raw: false
      });

      // Remove empty rows and validate headers
      const filteredData = jsonData.filter(row => row.some(cell => cell));
      if (filteredData.length < 2) {
        throw new Error('File contains no data');
      }

      // Extract headers and data
      const headers = filteredData[0];
      const rows = filteredData.slice(1);

      // Validate required columns
      const requiredColumns = [
      'Mentee Name', 'Mentee Email', 'Mentee MUJid', 'Year Of Registration',
      'Section', 'Semester', 'Academic Year', 'Academic Session',
      'Assigned Mentor Email'
      ];

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

      resolve(transformedData);
    } catch (error) {
      console.error('Error parsing Excel file:', error);
      reject(error);
    }
  });
};

const validateMenteeData = (data) => {
  const errors = [];
  const validData = [];

  data.forEach((row, index) => {
    const rowErrors = [];

    // Basic validation rules
    if (!row.MUJid || !/^[A-Z0-9]+$/.test(row.MUJid)) {
      rowErrors.push('Invalid MUJid format');
    }

    if (!row.email || !row.email.includes('@')) {
      rowErrors.push('Invalid email format');
    }

    if (!row.section || !/^[A-Z]$/.test(row.section)) {
      rowErrors.push('Invalid section (must be A-Z)');
    }

    const semester = parseInt(row.semester);
    if (isNaN(semester) || semester < 1 || semester > 8) {
      rowErrors.push('Invalid semester (must be 1-8)');
    }

    if (rowErrors.length > 0) {
      errors.push({ row: index + 2, errors: rowErrors });
    } else {
      validData.push(row);
    }
  });

  return { validData, errors };
};

export { parseExcelFile, validateMenteeData };
