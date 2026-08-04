import { NextResponse } from "next/server";
import { sendEmail } from "../../../../lib/mailService";

export async function POST(req) {
  try {
    const { parentEmails, subject, body, mentorData } = await req.json();

    // Validation
    if (!parentEmails || !Array.isArray(parentEmails) || parentEmails.length === 0) {
      return NextResponse.json({ success: false, message: "Invalid email addresses" }, { status: 400 });
    }

    // Validate each email
    for (const email of parentEmails) {
      if (!email || typeof email !== 'string' || !email.includes('@')) {
        return NextResponse.json({ success: false, message: "Invalid email address in array" }, { status: 400 });
      }
    }

    if (!subject || !body || !mentorData) {
      return NextResponse.json({ success: false, message: "Missing data" }, { status: 400 });
    }

    // Prepare email content
    const htmlContent = `
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
              <h1 style="margin: 0; font-size: 24px;">MentorLink - ${mentorData.name || 'Mentor'}</h1>
            </div>
            <div class="content">
              <p>Dear Parent/Guardian,</p>
              <div style="margin: 20px 0; white-space: pre-wrap;">${body}</div>
            </div>
            <div class="footer">
              <p>This is an automated message from MentorLink System.</p>
              <p>Department of Computer Science and Engineering<br>Manipal University Jaipur</p>
            </div>
          </div>
        </body>
        </html>
      `;

    // Send email via custom mail service
    await sendEmail({
      to: parentEmails,
      subject,
      content: htmlContent,
      priority: "NOTIFICATION"
    });

    // Return success
    return NextResponse.json({
      success: true,
      message: "Email sent successfully"
    });

  } catch (error) {
    console.error("Error in email API:", error);
    return NextResponse.json(
      { success: false, message: "Server error", error: error.toString() },
      { status: 500 }
    );
  }
}
