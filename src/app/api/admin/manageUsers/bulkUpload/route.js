import { connect } from "../../../../../lib/dbConfig";
import { Mentee } from "../../../../../lib/db/menteeSchema";
import { Mentor } from "../../../../../lib/db/mentorSchema";
import { NextResponse } from "next/server";

export async function POST(req) {
    try {
        await connect();
        
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

    } catch (error) {
        console.error("Error in bulk upload:", error);
        return NextResponse.json({ 
            error: "Error processing bulk upload" 
        }, { status: 500 });
    }
}