import nodemailer from "nodemailer";
import smtpTransport from "nodemailer-smtp-transport";
import { NextResponse } from "next/server";

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
    const { parentEmails, subject, body, menteeId, mentorData } = await req.json();

    // Enhanced validation for parent emails
    if (!parentEmails || !Array.isArray(parentEmails) || parentEmails.length === 0) {
      return NextResponse.json(
        { 
          success: false, 
          message: "No valid parent email addresses provided" 
        },
        { status: 400 }
      );
    }

    // Validate email format
    const validEmails = parentEmails.filter(email => 
      typeof email === 'string' && 
      email.includes('@') && 
      email.includes('.')
    );

    if (validEmails.length === 0) {
      return NextResponse.json(
        { 
          success: false, 
          message: "No valid parent email addresses found" 
        },
        { status: 400 }
      );
    }

    // Basic validation for required fields
    if (!subject || !body || !menteeId || !mentorData) {
      return NextResponse.json(
        { 
          success: false, 
          message: "Missing required information" 
        },
        { status: 400 }
      );
    }

    // Send email with professional HTML template
    const emailResult = await transporter.sendMail({
      from: `"MentorLink - ${mentorData.name}" <${process.env.EMAIL_USER}>`,
      bcc: validEmails, // Send to all parent emails as BCC
      subject: subject,
      text: body, // Plain text version
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #f97316; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
            .content { background: #fff; padding: 20px; border-radius: 0 0 8px 8px; }
            .footer { margin-top: 20px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #666; }
          </style>
        </head>
        <body style="background-color: #f5f5f5; margin: 0; padding: 20px;">
          <div class="container">
            <div class="header">
              <h1 style="margin: 0;">Academic Update</h1>
            </div>
            <div class="content">
              ${body.split('\n').map(line => `<p>${line}</p>`).join('')}
            </div>
            <div class="footer">
              <p>This is an automated message from MentorLink System.</p>
              <p>
                <strong>${mentorData.name}</strong><br>
                ${mentorData.designation || 'Faculty Mentor'}<br>
                Department of Computer Science and Engineering<br>
                Manipal University Jaipur
              </p>
            </div>
          </div>
        </body>
        </html>
      `,
      priority: "high",
    });

    return NextResponse.json({
      success: true,
      message: "Email sent to parents successfully",
      messageId: emailResult.messageId
    });

  } catch (error) {
    console.error("Error sending email to parents:", error);
    return NextResponse.json(
      { 
        success: false, 
        message: `Failed to send email: ${error.message}`,
        error: error.toString()
      },
      { status: 500 }
    );
  }
}
