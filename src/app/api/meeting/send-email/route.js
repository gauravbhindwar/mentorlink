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
    const { email, subject, body } = await req.json();

    if (!email || !subject || !body) {
      return NextResponse.json(
        { success: false, message: "Email, subject, and body are required" },
        { status: 400 }
      );
    }

    await transporter.sendMail({
      from: `"MentorLink" <${process.env.EMAIL_USER}>`,
      to: email,
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
      message: "Email sent successfully",
    });
  } catch (error) {
    console.error("Error sending email:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Error sending email" },
      { status: 500 }
    );
  }
}
