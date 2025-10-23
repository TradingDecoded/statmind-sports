// ============================================
// StatMind Sports - Feedback Route
// Handles user feedback submissions
// ============================================

import express from 'express';
import nodemailer from 'nodemailer';

const router = express.Router();

// ==========================================
// POST /api/feedback
// Submit feedback form
// ==========================================
router.post('/', async (req, res) => {
  try {
    const { name, email, message } = req.body;

    // Validate required field
    if (!message || message.trim() === '') {
      return res.status(400).json({
        success: false,
        error: 'Message is required'
      });
    }

    // Create email transporter (using same config as emailService)
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      secure: process.env.EMAIL_SECURE === 'true',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
      }
    });

    // Prepare email content
    const emailSubject = '💬 New Feedback from StatMind Sports';
    const emailHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #2563eb; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; border: 1px solid #e5e7eb; }
          .field { margin-bottom: 15px; }
          .label { font-weight: bold; color: #374151; }
          .value { margin-top: 5px; padding: 10px; background: white; border-radius: 4px; border: 1px solid #e5e7eb; }
          .message { white-space: pre-wrap; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>💬 New Feedback Received</h1>
          </div>
          <div class="content">
            <div class="field">
              <div class="label">From:</div>
              <div class="value">${name || 'Anonymous'} ${email ? `(${email})` : ''}</div>
            </div>
            
            <div class="field">
              <div class="label">Message:</div>
              <div class="value message">${message}</div>
            </div>
            
            <div class="field">
              <div class="label">Submitted:</div>
              <div class="value">${new Date().toLocaleString()}</div>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

    // Send email to you
    await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to: process.env.FEEDBACK_EMAIL || process.env.EMAIL_FROM, // Use FEEDBACK_EMAIL if set, otherwise EMAIL_FROM
      subject: emailSubject,
      html: emailHTML,
      replyTo: email || undefined // If user provided email, set as reply-to
    });

    console.log(`✅ Feedback email sent from ${name || 'Anonymous'}`);

    res.json({
      success: true,
      message: 'Feedback submitted successfully'
    });

  } catch (error) {
    console.error('❌ Error submitting feedback:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to submit feedback'
    });
  }
});

export default router;