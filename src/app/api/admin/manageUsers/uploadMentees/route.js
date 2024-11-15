import { NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import * as XLSX from 'xlsx';
import { connect } from '../../../../../lib/dbConfig';
import { Mentee } from '../../../../../lib/dbModels';
import { existsSync } from 'fs';
import { unlink } from 'fs/promises';

export async function POST(req) {
  let tempFilePath = null;
  
  try {
    const data = await req.formData();
    const file = data.get('file');

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    // Create temp directory if it doesn't exist
    const tempDir = join(process.cwd(), 'tmp');
    if (!existsSync(tempDir)) {
      await mkdir(tempDir, { recursive: true });
    }

    // Write file to temp directory
    tempFilePath = join(tempDir, `upload_${Date.now()}_${file.name}`);
    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(tempFilePath, buffer);
    
    // Read Excel file
    const workbook = XLSX.readFile(tempFilePath);
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    const jsonData = XLSX.utils.sheet_to_json(worksheet);

    // Validate data structure
    if (!Array.isArray(jsonData) || jsonData.length === 0) {
      throw new Error('Invalid file format or empty file');
    }

    // Connect to database
    await connect();

    // Process and validate each row
    const results = await Promise.all(jsonData.map(async (row) => {
      try {
        // Validate required fields
        const requiredFields = [
          'mujid',
          'yearOfRegistration',
          'name',
          'email',
          'phone',
          'fatherName',
          'motherName',
          'dateOfBirth',
          'parentsPhone',
          'parentsEmail'
        ];

        for (const field of requiredFields) {
          if (!row[field]) {
            throw new Error(`Missing required field: ${field}`);
          }
        }

        // Add mentorMujid if not present
        if (!row.mentorMujid) {
          row.mentorMujid = data.get('mentorMujid') || '';
        }

        // Format date if present
        if (row.dateOfBirth) {
          // Excel date to YYYY-MM-DD
          if (typeof row.dateOfBirth === 'number') {
            const excelDate = new Date((row.dateOfBirth - 25569) * 86400 * 1000);
            row.dateOfBirth = excelDate.toISOString().split('T')[0];
          }
        }

        // Create or update mentee
        const mentee = await Mentee.findOneAndUpdate(
          { mujid: row.mujid },
          { 
            ...row,
            updatedAt: new Date(),
            createdAt: new Date()
          },
          { upsert: true, new: true }
        );

        return { 
          success: true, 
          mujid: row.mujid,
          name: row.name 
        };
      } catch (error) {
        return { 
          success: false, 
          mujid: row.mujid || 'Unknown',
          error: error.message 
        };
      }
    }));

    // Calculate statistics
    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;

    return NextResponse.json({
      message: 'File processed successfully',
      stats: {
        total: results.length,
        successful,
        failed
      },
      results
    });

  } catch (error) {
    return NextResponse.json(
      { error: error.message || 'Error processing file' },
      { status: 500 }
    );
  } finally {
    // Cleanup: Delete temp file
    if (tempFilePath && existsSync(tempFilePath)) {
      try {
        await unlink(tempFilePath);
      } catch (error) {
        console.error('Error deleting temp file:', error);
      }
    }
  }
}

export const config = {
  api: {
    bodyParser: false
  }
};