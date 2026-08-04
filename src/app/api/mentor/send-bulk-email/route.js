import { NextResponse } from 'next/server';
import { sendBulkEmail } from '../../../../lib/mailService';

export async function POST(request) {
  try {
    const { emails, subject, body } = await request.json();

    if (!emails || !Array.isArray(emails) || emails.length === 0) {
      return NextResponse.json({ 
        success: false, 
        message: 'No valid email recipients' 
      }, { status: 400 });
    }

    const html = body.replace(/\n/g, '<br>');
    
    const result = await sendBulkEmail({
      recipients: emails,
      subject,
      html,
      batchSize: 50,
      delayBetweenBatches: 1000
    });

    return NextResponse.json({
      success: true,
      message: `Successfully sent ${result.successful} out of ${result.total} emails`,
      details: result
    });
  } catch (error) {
    console.error('Error sending bulk emails:', error);
    return NextResponse.json({ 
      success: false, 
      message: error.message || 'Failed to send emails' 
    }, { status: 500 });
  }
}
