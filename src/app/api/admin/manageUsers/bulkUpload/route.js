import { connect } from "../../../../../lib/dbConfig";
import { Mentee } from "../../../../../lib/db/menteeSchema";
import { Mentor } from "../../../../../lib/db/mentorSchema";
import { NextResponse } from "next/server";
import multer from 'multer';
import xlsx from 'xlsx';

// Configure multer
const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only Excel files are allowed.'));
    }
  },
  limits: { fileSize: 5 * 1024 * 1024 }
});

const runMiddleware = (req, middleware) => {
  return new Promise((resolve, reject) => {
    middleware(req, {}, (result) => {
      if (result instanceof Error) return reject(result);
      return resolve(result);
    });
  });
};

export async function POST(req) {
    try {
        await connect();
        
        // Check if request has a file upload
        if (req.headers.get('content-type')?.includes('multipart/form-data')) {
            await runMiddleware(req, upload.single('file'));
            if (!req.file) {
                return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
            }

            // Process Excel file
            const workbook = xlsx.read(req.file.buffer);
            const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
            const uploadData = xlsx.utils.sheet_to_json(firstSheet);
            const type = req.body?.type || 'mentor';

            // Continue with existing bulk upload logic
            if (!type || !['mentor', 'mentee'].includes(type)) {
                console.error('Invalid or missing type parameter:', type);
                return NextResponse.json({ 
                    error: "Invalid user type specified" 
                }, { status: 400 });
            }

            console.log('Processing bulk upload for type:', type);
            console.log('Number of records:', uploadData?.length || 0);

            if (!Array.isArray(uploadData) || uploadData.length === 0) {
                return NextResponse.json({ 
                    error: "No valid data provided" 
                }, { status: 400 });
            }

            const Model = type === 'mentee' ? Mentee : Mentor;
            const savedItems = [];
            const errors = [];

            for (const itemData of uploadData) {
                try {
                    const newItem = new Model({
                        ...itemData,
                        created_at: new Date(),
                        updated_at: new Date()
                    });

                    const savedItem = await newItem.save();
                    savedItems.push(savedItem);
                    console.log(`Successfully saved ${type}:`, itemData.MUJid);
                } catch (error) {
                    console.error(`Error saving ${type} ${itemData.MUJid}:`, error);
                    errors.push({
                        MUJid: itemData.MUJid,
                        error: error.message || 'Unknown error occurred'
                    });
                }
            }

            return NextResponse.json({
                message: "Bulk upload completed",
                type: type,
                savedCount: savedItems.length,
                errorCount: errors.length,
                errors: errors.length > 0 ? errors : undefined
            }, { 
                status: errors.length > 0 ? 207 : 201 
            });

        } else {
            // Handle JSON payload (existing functionality)
            const body = await req.json();
            const { data: uploadData, type } = body;

            // Validate type parameter
            if (!type || !['mentor', 'mentee'].includes(type)) {
                console.error('Invalid or missing type parameter:', type);
                return NextResponse.json({ 
                    error: "Invalid user type specified" 
                }, { status: 400 });
            }

            console.log('Processing bulk upload for type:', type);
            console.log('Number of records:', uploadData?.length || 0);

            if (!Array.isArray(uploadData) || uploadData.length === 0) {
                return NextResponse.json({ 
                    error: "No valid data provided" 
                }, { status: 400 });
            }

            const Model = type === 'mentee' ? Mentee : Mentor;
            const savedItems = [];
            const errors = [];

            for (const itemData of uploadData) {
                try {
                    const newItem = new Model({
                        ...itemData,
                        created_at: new Date(),
                        updated_at: new Date()
                    });

                    const savedItem = await newItem.save();
                    savedItems.push(savedItem);
                    console.log(`Successfully saved ${type}:`, itemData.MUJid);
                } catch (error) {
                    console.error(`Error saving ${type} ${itemData.MUJid}:`, error);
                    errors.push({
                        MUJid: itemData.MUJid,
                        error: error.message || 'Unknown error occurred'
                    });
                }
            }

            return NextResponse.json({
                message: "Bulk upload completed",
                type: type,
                savedCount: savedItems.length,
                errorCount: errors.length,
                errors: errors.length > 0 ? errors : undefined
            }, { 
                status: errors.length > 0 ? 207 : 201 
            });
        }

    } catch (error) {
        console.error("Error in bulk upload:", error);
        return NextResponse.json({ 
            error: error.message || "Error processing bulk upload" 
        }, { status: 500 });
    }
}

export const config = {
  api: {
    bodyParser: false // Disable the default body parser
  }
};