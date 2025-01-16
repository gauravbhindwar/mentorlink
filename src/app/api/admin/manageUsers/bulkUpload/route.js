import { connect } from "../../../../../lib/dbConfig";
import { Mentee, Mentor } from "../../../../../lib/dbModels";
import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    await connect();
    const { data, type } = await req.json();

    if (!data || !Array.isArray(data)) {
      return NextResponse.json({ error: 'Invalid data format' }, { status: 400 });
    }

    console.log(`Processing bulk upload for type: ${type}`);
    console.log(`Number of records: ${data.length}`);

    const Model = type === 'mentee' ? Mentee : Mentor;
    const results = {
      success: [],
      errors: [],
      savedCount: 0
    };

    for (const record of data) {
      try {
        const newRecord = new Model(record);
        await newRecord.save();
        results.success.push(record.MUJid);
        results.savedCount++;
        console.log(`Successfully saved ${type}: ${record.MUJid}`);
      } catch (error) {
        let errorMessage = '';
        if (error.code === 11000) {
          // Handle duplicate key errors
          const field = Object.keys(error.keyPattern)[0];
          const value = error.keyValue[field];
          errorMessage = `Duplicate ${field} found: ${value}`;
        } else {
          errorMessage = error.message || 'Unknown error occurred';
        }
        
        results.errors.push({
          mujid: record.MUJid,
          error: errorMessage
        });
      }
    }

    return NextResponse.json({
      message: `Successfully processed ${results.savedCount} out of ${data.length} records`,
      success: results.success,
      errors: results.errors,
      savedCount: results.savedCount
    }, { status: 207 }); // Using 207 Multi-Status

  } catch (error) {
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error.message
    }, { status: 500 });
  }
}