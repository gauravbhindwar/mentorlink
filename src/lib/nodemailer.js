
import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  tls: {
    rejectUnauthorized: false
  },
  pool: true,
  maxConnections: 5,
  maxMessages: Infinity,
  rateDelta: 1000,
  rateLimit: 50
});

// Helper function to delay execution
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

// Function to process a batch of emails
const processBatch = async (recipients, subject, html, attachments) => {
  const results = await Promise.allSettled(
    recipients.map(recipient => 
      transporter.sendMail({
        from: `"MentorLink" <${process.env.GMAIL_USER}>`,
        to: recipient,
        subject,
        html,
        attachments
      })
    )
  );

  return results.map((result, index) => ({
    email: recipients[index],
    status: result.status,
    messageId: result.status === 'fulfilled' ? result.value.messageId : null,
    error: result.status === 'rejected' ? result.reason.message : null
  }));
};

export const sendBulkEmail = async ({ 
  recipients, 
  subject, 
  html, 
  attachments = [], 
  batchSize = 50,
  delayBetweenBatches = 1000 
}) => {
  const results = [];
  const batches = [];

  // Create batches
  for (let i = 0; i < recipients.length; i += batchSize) {
    batches.push(recipients.slice(i, i + batchSize));
  }

  // Process each batch with delay
  for (const batch of batches) {
    const batchResults = await processBatch(batch, subject, html, attachments);
    results.push(...batchResults);
    
    if (batches.indexOf(batch) < batches.length - 1) {
      await delay(delayBetweenBatches);
    }
  }

  // Log results
  const successful = results.filter(r => r.status === 'fulfilled').length;
  // console.log(`Email sending completed: ${successful}/${recipients.length} successful`);

  return {
    total: recipients.length,
    successful,
    failed: recipients.length - successful,
    details: results
  };
};