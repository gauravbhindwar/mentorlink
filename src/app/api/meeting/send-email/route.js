import nodemailer from "nodemailer";
import smtpTransport from "nodemailer-smtp-transport";
import { NextResponse } from "next/server";
import { connect } from "../../../../lib/dbConfig";
import { Meeting } from "../../../../lib/db/meetingSchema";

const transporter = nodemailer.createTransport(
  smtpTransport({
    service: "Gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
    tls: {
      rejectUnauthorized: false,
    },
  })
);

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

    // Send a single email with all recipients in BCC
    const emailResult = await transporter.sendMail({
      from: `"MentorLink" <${process.env.EMAIL_USER}>`,
      bcc: emails, // All recipients in BCC
      subject: subject,
      text: body,
      html: `
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
            `,
      priority: "high",
    });

    return NextResponse.json({
      success: true,
      message: "Emails sent successfully",
      sentCount: emails.length,
      totalEmailsSent: currentCount,
      messageId: emailResult.messageId
    });

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
