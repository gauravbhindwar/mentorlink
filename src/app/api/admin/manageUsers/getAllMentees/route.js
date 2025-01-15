import { NextResponse } from 'next/server';
import {connect} from '../../../../../lib/dbConfig';
import {Mentee} from '../../../../../lib/dbModels';
// import { verifyAdmin } from '@/libs/auth';

export async function GET(request) {
    try {
        // Verify admin authentication
        // const isAdmin = await verifyAdmin(request);
        // if (!isAdmin) {
        //     return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
        // }

        // Get query parameters
        const url = new URL(request.url);
        const academicYear = url.searchParams.get('academicYear');
        const academicSession = url.searchParams.get('academicSession');
        const semester = url.searchParams.get('semester');

        // Connect to MongoDB
        await connect();

        // Build query filters
        let query = {};
        
        if (academicYear) {
            query.academicYear = academicYear;
        }
        if (academicSession) {
            query.academicSession = academicSession;
        }
        if (semester) {
            query.semester = parseInt(semester);
        }

        // Execute query with filters
        const mentees = await Mentee.find(query)
            .select('-__v')
            .sort({ MUJid: 1 });

        if (!mentees || mentees.length === 0) {
            return NextResponse.json({ message: "No mentees found" }, { status: 404 });
        }

        // Format and return response
        const formattedMentees = mentees.map(mentee => ({
            ...mentee.toObject(),
            _id: mentee._id.toString()
        }));

        return NextResponse.json(formattedMentees, { status: 200 });

    } catch (error) {
        console.error('Error in getAllMentees:', error);
        return NextResponse.json(
            { error: "Internal server error while fetching mentees" },
            { status: 500 }
        );
    }
}
