import nodemailer from "nodemailer";
import smtpTransport from "nodemailer-smtp-transport";
import { NextResponse } from "next/server";

// Create a singleton transporter
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
    pool: true, // Use pooled connections
    maxConnections: 5, // Maximum pool size
    maxMessages: Infinity,
    rateDelta: 1000, // How many milliseconds between messages
    rateLimit: 5, // Max number of messages per rateDelta
  })
);

// Initialize the connection pool
transporter.verify((error) => {
  if (error) {
    console.error('Error initializing email transport:', error);
  } else {
    console.log('Email server ready');
  }
});

// Queue for managing email sending
const emailQueue = [];
let isProcessingQueue = false;

// Process queue function
async function processEmailQueue() {
  if (isProcessingQueue || emailQueue.length === 0) return;
  
  isProcessingQueue = true;
  
  while (emailQueue.length > 0) {
    const { mailOptions, resolve, reject } = emailQueue.shift();
    
    try {
      const result = await transporter.sendMail(mailOptions);
      resolve(result);
    } catch (error) {
      reject(error);
    }
  }
  
  isProcessingQueue = false;
}

// Function to add email to queue
function queueEmail(mailOptions) {
  return new Promise((resolve, reject) => {
    emailQueue.push({ mailOptions, resolve, reject });
    processEmailQueue();
  });
}

export async function POST(req) {
  try {
    const { mentorEmail, subject, body, mentorData } = await req.json();

    // Validation
    if (!mentorEmail || typeof mentorEmail !== 'string' || !mentorEmail.includes('@')) {
      return NextResponse.json({ success: false, message: "Invalid email" }, { status: 400 });
    }

    if (!subject || !body || !mentorData) {
      return NextResponse.json({ success: false, message: "Missing data" }, { status: 400 });
    }

    // Prepare email content
    const mailOptions = {
      from: `"MentorLink Admin" <${process.env.EMAIL_USER}>`,
      to: mentorEmail,
      subject,
      text: body,
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
              <h1 style="margin: 0;">Mentor Meeting Follow-up</h1>
            </div>
            <div class="content">
              ${body.split('\n').map(line => `<p>${line}</p>`).join('')}
            </div>
            <div class="footer">
              <p>This is an automated message from MentorLink System.</p>
              <p>Department of Computer Science and Engineering<br>Manipal University Jaipur</p>
            </div>
          </div>
        </body>
        </html>
      `,
      priority: "high",
    };

    // Add to queue and send response immediately
    queueEmail(mailOptions)
      .catch(error => console.error('Background email error:', error));

    // Return success immediately
    return NextResponse.json({
      success: true,
      message: "Email queued for delivery",
      queued: true
    });

  } catch (error) {
    console.error("Error in email API:", error);
    return NextResponse.json(
      { success: false, message: "Server error", error: error.toString() },
      { status: 500 }
    );
  }
}
