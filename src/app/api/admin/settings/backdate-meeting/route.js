import { NextResponse } from "next/server";
import { connect } from "@/lib/dbConfig";
import { Settings } from "@/lib/dbModels";

// GET endpoint to retrieve the current setting from database
export async function GET() {
  try {
    await connect();
    
    // Get the setting from the database
    const allowBackdateSetting = await Settings.getSettingByKey("allowBackdateMeetings");
    
    // Default to false if setting doesn't exist
    const allowBackdateMeetings = allowBackdateSetting !== null ? allowBackdateSetting : false;
    
    return NextResponse.json({ 
      success: true, 
      allowBackdateMeetings
    });
  } catch (error) {
    console.error("Error retrieving backdate meeting setting:", error);
    return NextResponse.json(
      { success: false, error: "Failed to retrieve setting" },
      { status: 500 }
    );
  }
}

// POST endpoint to update the setting in database
export async function POST(request) {
  try {
    await connect();
    
    const data = await request.json();
    const { allowBackdateMeetings } = data;
    
    if (typeof allowBackdateMeetings !== 'boolean') {
      return NextResponse.json(
        { success: false, error: "Invalid setting value" },
        { status: 400 }
      );
    }
    
    // Save to database
    await Settings.updateSetting(
      "allowBackdateMeetings", 
      allowBackdateMeetings,
      "Controls whether mentors can schedule meetings in the past",
      "meeting",
      "admin"
    );
    
    return NextResponse.json({ 
      success: true, 
      allowBackdateMeetings 
    });
  } catch (error) {
    console.error("Error updating backdate meeting setting:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update setting" },
      { status: 500 }
    );
  }
}
