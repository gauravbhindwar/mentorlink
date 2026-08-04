import fetch from 'node-fetch';
import { NextResponse } from "next/server";
import { connect } from "../../../../lib/dbConfig";
import { Meeting } from "../../../../lib/db/meetingSchema";

// Function to send email via custom mail service (bulk)
async function sendEmailViaService(emails, subject, html) {
  try {
    const response = await fetch('https://mail-service.sdcmuj.com/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.GITHUB_PAT_TOKEN}`,
      },
      body: JSON.stringify({
        application: process.env.APPLICATION_NAME || "travel-buddy",
        to: emails, // Send array of emails for bulk sending
        subject,
        content: html,
        priority: "AUTH",
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Mail service error: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
}

export async function POST(req) {
  try {
    const { emails, subject, body, meetingId } = await req.json();

    // Enhanced validation
    if (!emails || !Array.isArray(emails)) {
      return NextResponse.json(
        { 
          success: false, 
          message: "Invalid input: emails must be an array" 
        },
        { status: 400 }
      );
    }

    // Validate email format
    const validEmails = emails.filter(email => 
      typeof email === 'string' && 
      email.includes('@') && 
      email.includes('.')
    );

    if (validEmails.length === 0) {
      return NextResponse.json(
        { 
          success: false, 
          message: "No valid email addresses provided" 
        },
        { status: 400 }
      );
    }

    if (!subject || typeof subject !== 'string') {
      return NextResponse.json(
        { 
          success: false, 
          message: "Subject is required and must be a string" 
        },
        { status: 400 }
      );
    }

    if (!body || typeof body !== 'string') {
      return NextResponse.json(
        { 
          success: false, 
          message: "Body is required and must be a string" 
        },
        { status: 400 }
      );
    }

    if (!meetingId) {
      return NextResponse.json(
        { 
          success: false, 
          message: "Meeting ID is required" 
        },
        { status: 400 }
      );
    }

    // Connect to database
    await connect();

    // Find and update the meeting using updateOne
    const result = await Meeting.updateOne(
      { "meetings.meeting_id": meetingId },
      { 
        $inc: { "meetings.$.emailsSentCount": 1 }
      }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { success: false, message: "Meeting not found" },
        { status: 404 }
      );
    }

    // Get the updated meeting to return the count
    const updatedMeeting = await Meeting.findOne(
      { "meetings.meeting_id": meetingId },
      { "meetings.$": 1 }
    );
    
    const currentCount = updatedMeeting.meetings[0].emailsSentCount || 0;

    // Prepare HTML content
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <!--[if mso]>
          <xml>
              <o:OfficeDocumentSettings>
                  <o:AllowPNG/>
                  <o:PixelsPerInch>96</o:PixelsPerInch>
              </o:OfficeDocumentSettings>
          </xml>
          <![endif]-->
      </head>
      <body style="margin: 0; padding: 0;">
          <div style="
              font-family: Arial, sans-serif;
              max-width: 600px;
              width: 100%;
              margin: 0 auto;
              padding: 15px;
              background: #fff5eb;
              box-sizing: border-box;
              -webkit-text-size-adjust: 100%;
              -ms-text-size-adjust: 100%;
          ">
              <div style="
                  background: #ffffff;
                  border-radius: 16px;
                  box-shadow: 0 4px 20px rgba(234, 88, 12, 0.1);
                  padding: 20px;
                  word-wrap: break-word;
              ">
                  <h1 style="
                      color: #ea580c;
                      font-size: 28px;
                      margin: 0 0 24px;
                      text-align: center;
                      word-wrap: break-word;
                  ">MentorLink</h1>

                  <div style="
                      color: #431407;
                      white-space: pre-wrap;
                      word-wrap: break-word;
                      line-height: 1.5;
                  ">${body.split("\n").join("<br>")}</div>
              </div>
          </div>
      </body>
      </html>
    `;

    // Send emails to all recipients in one bulk request
    try {
      const result = await sendEmailViaService(validEmails, subject, html);
      
      return NextResponse.json({
        success: true,
        message: `Emails sent successfully to ${validEmails.length} recipients`,
        sentCount: validEmails.length,
        totalEmailsSent: currentCount + validEmails.length,
        result: result
      });

    } catch (emailError) {
      console.error("Error sending bulk email:", emailError);
      
      return NextResponse.json({
        success: false,
        message: `Failed to send emails: ${emailError.message}`,
        sentCount: 0,
        totalEmailsSent: currentCount,
        error: emailError.message
      });
    }

  } catch (error) {
    console.error("Error sending email:", error);
    return NextResponse.json(
      { 
        success: false, 
        message: `Email sending failed: ${error.message}`,
        error: error.toString()
      },
      { status: 500 }
    );
  }
}
