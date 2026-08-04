import fetch from 'node-fetch';

// Helper function to delay execution
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

// Function to send single email via custom mail service
const sendSingleEmail = async (recipient, subject, html) => {
  try {
    const response = await fetch('https://mail-service.sdcmuj.com/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.GITHUB_PAT_TOKEN}`,
      },
      body: JSON.stringify({
        application: process.env.APPLICATION_NAME,
        to: Array.isArray(recipient) ? recipient : [recipient],
        subject,
        content: html, // Using html content as the email body
        priority: "NOTIFICATION",
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP error! status: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const result = await response.json();
    return {
      email: recipient,
      status: 'fulfilled',
      messageId: result.messageId || null,
      error: null
    };
  } catch (error) {
    return {
      email: recipient,
      status: 'rejected',
      messageId: null,
      error: error.message
    };
  }
};

// Function to process a batch of emails
const processBatch = async (recipients, subject, html) => {
  const results = await Promise.allSettled(
    recipients.map(recipient =>
      sendSingleEmail(recipient, subject, html)
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
  batchSize = 50,
  delayBetweenBatches = 1000,
  onProgress = () => {} // Add progress callback
}) => {
  const results = [];
  const batches = [];
  let totalSent = 0;

  // Create batches
  for (let i = 0; i < recipients.length; i += batchSize) {
    batches.push(recipients.slice(i, i + batchSize));
  }

  // Process each batch with delay
  for (const batch of batches) {
    const batchResults = await processBatch(batch, subject, html);
    results.push(...batchResults);
    
    // Update progress after each batch
    totalSent += batchResults.filter(r => r.status === 'fulfilled').length;
    onProgress({
      total: recipients.length,
      sent: totalSent,
      progress: (totalSent / recipients.length) * 100
    });
    
    if (batches.indexOf(batch) < batches.length - 1) {
      await delay(delayBetweenBatches);
    }
  }

  const successful = results.filter(r => r.status === 'fulfilled').length;

  return {
    total: recipients.length,
    successful,
    failed: recipients.length - successful,
    details: results
  };
};