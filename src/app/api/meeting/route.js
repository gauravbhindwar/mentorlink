import { NextResponse } from 'next/server';
import { sendBulkEmail } from '../../../lib/nodemailer';
import { AcademicSession } from '../../../lib/dbModels';
import { connect } from '../../../lib/dbConfig';
import { getCurrentAcademicYear } from '../../../utils/academicYear';
import mongoose from 'mongoose';

export async function POST(request) {
  try {
    // Connect to database first
    await connect();

    const data = await request.json();
    const {
      mentorId,
      branch,
      semester,
      section,
      meetingTitle,
      dateTime,
      mentees,
      hasAttachment,
      attachment,
      attachmentName,
    } = data;

    // Get current academic year
    const { startYear, endYear } = getCurrentAcademicYear();

    // Convert dateTime to Date object
    const meetingDate = new Date(dateTime);
    
    // Format time in 12-hour format with AM/PM
    const meetingTime = meetingDate.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: false
    });

    // Find or create academic session
    let academicSession = await AcademicSession.findOne({
      session_id: startYear
    });

    if (!academicSession) {
      academicSession = new AcademicSession({
        session_id: startYear,
        start_year: startYear,
        end_year: endYear,
        semesters: []
      });
    }

    // Find or create semester
    let semesterDoc = academicSession.semesters.find(s => s.semester_number === parseInt(semester));
    if (!semesterDoc) {
      semesterDoc = {
        semester_number: parseInt(semester),
        start_date: new Date(startYear, semester % 2 ? 6 : 0, 1),
        end_date: new Date(startYear, semester % 2 ? 11 : 5, 30),
        meetings: []
      };
      academicSession.semesters.push(semesterDoc);
    }

    // Create meetings for each mentee
    for (const mentee of mentees) {
      const meeting = {
        meeting_id: new mongoose.Types.ObjectId(),
        mentor_id: new mongoose.Types.ObjectId(mentorId),
        mentee_id: new mongoose.Types.ObjectId(mentee._id),
        meeting_date: meetingDate,
        meeting_time: meetingTime,
        meeting_notes: {
          TopicOfDiscussion: meetingTitle,
          NotesToStudent: '',
          feedbackFromMentee: '',
          feedbackFromMentor: '',
          outcome: '',
          closureRemarks: ''
        }
      };
      semesterDoc.meetings.push(meeting);
    }

    // Update timestamps
    academicSession.updated_at = new Date();
    
    // Save the updated academic session
    await academicSession.save();

    // Updated email HTML content with modern UI
    const emailContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Mentor Meeting Scheduled</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.5;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
          <!-- Header -->
          <div style="background: linear-gradient(135deg, #FF4B2B, #FF416C); padding: 20px; border-radius: 10px 10px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 24px;">Mentor Meeting Scheduled</h1>
          </div>
          
          <!-- Main Content -->
          <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <p style="color: #333; font-size: 16px; margin-top: 0;">Dear Student,</p>
            
            <!-- Meeting Details Card -->
            <div style="background: white; border-radius: 8px; padding: 20px; margin: 20px 0; border-left: 4px solid #FF416C;">
              <h2 style="color: #FF416C; margin: 0 0 15px 0; font-size: 20px;">${meetingTitle}</h2>
              
              <!-- Details Grid -->
              <div style="display: grid; grid-gap: 10px;">
                <div style="display: flex; align-items: center; border-bottom: 1px solid #eee; padding-bottom: 8px;">
                  <span style="color: #666; width: 120px;">Date & Time:</span>
                  <strong style="color: #333;">${formatDateTime(dateTime)}</strong>
                </div>
                <div style="display: flex; align-items: center; border-bottom: 1px solid #eee; padding-bottom: 8px;">
                  <span style="color: #666; width: 120px;">Branch:</span>
                  <strong style="color: #333;">${branch}</strong>
                </div>
                <div style="display: flex; align-items: center; border-bottom: 1px solid #eee; padding-bottom: 8px;">
                  <span style="color: #666; width: 120px;">Semester:</span>
                  <strong style="color: #333;">${semester}</strong>
                </div>
                <div style="display: flex; align-items: center; border-bottom: 1px solid #eee; padding-bottom: 8px;">
                  <span style="color: #666; width: 120px;">Section:</span>
                  <strong style="color: #333;">${section}</strong>
                </div>
                <div style="display: flex; align-items: center; border-bottom: 1px solid #eee; padding-bottom: 8px;">
                  <span style="color: #666; width: 120px;">Academic Year:</span>
                  <strong style="color: #333;">${startYear}-${endYear}</strong>
                </div>
                <div style="display: flex; align-items: center;">
                  <span style="color: #666; width: 120px;">Meeting ID:</span>
                  <code style="background: #f3f4f6; padding: 2px 6px; border-radius: 4px; color: #FF416C;">${meeting.meeting_id}</code>
                </div>
              </div>
            </div>

            <!-- Important Notice -->
            <div style="background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; border-radius: 4px;">
              <p style="margin: 0; color: #856404;"><strong>Please ensure your attendance.</strong></p>
            </div>

            ${hasAttachment ? `
              <!-- Attachment Notice -->
              <div style="background: #e8f4ff; border-left: 4px solid #007bff; padding: 15px; margin: 20px 0; border-radius: 4px;">
                <p style="margin: 0; color: #004085;">
                  <strong>📎 Attachment included:</strong> ${attachmentName}
                </p>
              </div>
            ` : ''}

            <!-- Footer -->
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
              <p style="color: #666; margin: 0;">Best regards,<br/>
              <strong style="color: #333;">Your Mentor (${mentorId})</strong></p>
            </div>
          </div>
          
          <!-- Footnote -->
          <div style="text-align: center; margin-top: 20px; color: #666; font-size: 12px;">
            <p>This is an automated email from MentorLink. Please do not reply.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    // Process email batches with attachment from browser storage
    const results = await sendBulkEmail({
      recipients: mentees.map(mentee => mentee.email),
      subject: meetingTitle,
      html: emailContent,
      attachments: hasAttachment ? [{
        filename: attachmentName,
        content: attachment.split('base64,')[1], // Extract base64 data
        encoding: 'base64'
      }] : [],
      batchSize: 50,
      delayBetweenBatches: 1000
    });

    return NextResponse.json({ 
      message: 'Meeting scheduled and emails sent successfully',
      meetingId: meeting.meeting_id,
      emailStatus: results,
      academicSession: {
        id: academicSession._id,
        semester: semesterDoc.semester_number,
        meeting: meeting
      }
    });

  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { message: 'Failed to schedule meeting' },
      { status: 500 }
    );
  }
}