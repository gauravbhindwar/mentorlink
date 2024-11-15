import { connect } from "../../../../../lib/dbConfig";
import { MentorMenteeRelationship } from "../../../../../lib/dbModels";
import { NextResponse } from "next/server";
import xlsx from "xlsx";

// POST request to handle bulk assignment of mentees to mentors
export async function POST(req) {
    try {
        await connect();
        const formData = await req.formData();
        const file = formData.get('file');
        const buffer = await file.arrayBuffer();
        const workbook = xlsx.read(buffer, { type: 'array' });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const data = xlsx.utils.sheet_to_json(sheet);

        const assignments = data.map(row => ({
            mentor_MUJid: row.mentor_MUJid,
            mentee_MUJid: row.mentee_MUJid,
            session: row.session,
            current_semester: row.current_semester,
            section: row.section
        }));

        const errors = await MentorMenteeRelationship.bulkAssign(assignments);

        if (errors.length > 0) {
            return NextResponse.json({ message: "Bulk assignment completed with errors", errors }, { status: 207 });
        }

        return NextResponse.json({ message: "Bulk assignment completed successfully" }, { status: 201 });
    } catch (error) {
        console.error("Error in bulk assignment:", error);
        return NextResponse.json({ error: "Error processing bulk assignment" }, { status: 500 });
    }
}