const logger = require('../platform/observability/logger');

/**
 * Notification Service
 * Handles SMS, email, and push notifications via Twilio and SendGrid
 */
class NotificationService {
  constructor() {
    this.twilioConfigured = false;
    this.sendgridConfigured = false;

    // Initialize Twilio if credentials exist
    if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
      try {
        const twilio = require('twilio');
        this.twilioClient = twilio(
          process.env.TWILIO_ACCOUNT_SID,
          process.env.TWILIO_AUTH_TOKEN
        );
        this.twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;
        this.twilioConfigured = true;
        logger.info('Twilio SMS service initialized');
      } catch (error) {
        logger.warn('Twilio not configured', { error: error.message });
      }
    }

    // Initialize SendGrid if API key exists
    if (process.env.SENDGRID_API_KEY) {
      try {
        const sgMail = require('@sendgrid/mail');
        sgMail.setApiKey(process.env.SENDGRID_API_KEY);
        this.sendgridClient = sgMail;
        this.sendgridConfigured = true;
        logger.info('SendGrid email service initialized');
      } catch (error) {
        logger.warn('SendGrid not configured', { error: error.message });
      }
    }
  }

  /**
   * Send high priority alert via SMS and Email
   * @param {Object} lead - Lead object
   * @returns {Promise<void>}
   */
  async sendHighPriorityAlert(lead) {
    try {
      logger.info('High priority alert triggered', {
        lead_id: lead.id,
        city: lead.city,
        job_type: lead.jobType,
        ai_score: lead.aiScore
      });

      const promises = [];

      // Send SMS if configured
      if (this.twilioConfigured && process.env.ALERT_PHONE_NUMBER) {
        promises.push(this.sendSMS({
          to: process.env.ALERT_PHONE_NUMBER,
          message: this._formatSMSMessage(lead)
        }));
      }

      // Send Email if configured
      if (this.sendgridConfigured && process.env.ALERT_EMAIL) {
        promises.push(this.sendEmail({
          to: process.env.ALERT_EMAIL,
          subject: `🚨 High Priority Lead: ${lead.city}`,
          html: this._formatEmailHTML(lead),
          text: this._formatEmailText(lead)
        }));
      }

      if (promises.length === 0) {
        logger.warn('No notification services configured - alert logged only', {
          lead_id: lead.id
        });
        return;
      }

      await Promise.allSettled(promises);

    } catch (error) {
      logger.error('Failed to send high priority alert', {
        error: error.message,
        lead_id: lead.id
      });
      // Don't throw - notifications should not break lead processing
    }
  }

  /**
   * Send SMS via Twilio
   * @param {Object} options - SMS options {to, message}
   * @returns {Promise<Object>} SMS result
   */
  async sendSMS({ to, message }) {
    if (!this.twilioConfigured) {
      logger.warn('SMS requested but Twilio not configured');
      return { success: false, reason: 'not_configured' };
    }

    try {
      const result = await this.twilioClient.messages.create({
        body: message,
        from: this.twilioPhoneNumber,
        to: to
      });

      logger.info('SMS sent successfully', {
        sid: result.sid,
        to: to,
        status: result.status
      });

      return { success: true, sid: result.sid };
    } catch (error) {
      logger.error('Failed to send SMS', {
        error: error.message,
        code: error.code,
        to: to
      });

      return { success: false, error: error.message };
    }
  }

  /**
   * Send Email via SendGrid
   * @param {Object} options - Email options {to, subject, html, text}
   * @returns {Promise<Object>} Email result
   */
  async sendEmail({ to, subject, html, text }) {
    if (!this.sendgridConfigured) {
      logger.warn('Email requested but SendGrid not configured');
      return { success: false, reason: 'not_configured' };
    }

    try {
      const msg = {
        to: to,
        from: process.env.SENDGRID_FROM_EMAIL || process.env.ALERT_EMAIL,
        subject: subject,
        text: text,
        html: html
      };

      const result = await this.sendgridClient.send(msg);

      logger.info('Email sent successfully', {
        to: to,
        subject: subject,
        statusCode: result[0].statusCode
      });

      return { success: true, statusCode: result[0].statusCode };
    } catch (error) {
      logger.error('Failed to send email', {
        error: error.message,
        code: error.code,
        to: to
      });

      return { success: false, error: error.message };
    }
  }

  /**
   * Format SMS message for lead alert
   * @private
   */
  _formatSMSMessage(lead) {
    return `🚨 HIGH PRIORITY LEAD (Score: ${lead.aiScore})

${lead.jobType?.replace(/_/g, ' ').toUpperCase()}
📍 ${lead.city}, ${lead.county}

${lead.postText.substring(0, 150)}${lead.postText.length > 150 ? '...' : ''}

View: https://app.ctlplumbing.com/leads/${lead.id}`;
  }

  /**
   * Format email text for lead alert
   * @private
   */
  _formatEmailText(lead) {
    return `
HIGH PRIORITY LEAD ALERT

AI Score: ${lead.aiScore}/100
Job Type: ${lead.jobType?.replace(/_/g, ' ')}
Location: ${lead.city}, ${lead.county}
Urgency: ${lead.urgency}
Status: ${lead.status}

${lead.contactInfo ? `Contact Information:
${lead.contactInfo.phone ? `Phone: ${lead.contactInfo.phone}` : ''}
${lead.contactInfo.email ? `Email: ${lead.contactInfo.email}` : ''}
` : ''}

Post Content:
${lead.postText}

Post URL: ${lead.postUrl}

---
CTL Plumbing Lead Management System
View Lead: https://app.ctlplumbing.com/leads/${lead.id}
    `.trim();
  }

  /**
   * Format HTML email for lead alert
   * @private
   */
  _formatEmailHTML(lead) {
    const contactInfo = lead.contactInfo || {};

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 8px 8px 0 0; }
    .header h1 { margin: 0; font-size: 24px; }
    .score { background: #fff; color: #667eea; padding: 10px 20px; border-radius: 20px; display: inline-block; font-weight: bold; font-size: 20px; margin-top: 10px; }
    .content { background: #f9fafb; padding: 30px; }
    .info-box { background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid #667eea; }
    .info-row { margin: 10px 0; }
    .label { font-weight: bold; color: #667eea; }
    .urgent { color: #ef4444; font-weight: bold; }
    .btn { display: inline-block; background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 20px; }
    .footer { background: #1f2937; color: #9ca3af; padding: 20px; text-align: center; border-radius: 0 0 8px 8px; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🚨 High Priority Lead Alert</h1>
      <div class="score">AI Score: ${lead.aiScore}/100</div>
    </div>

    <div class="content">
      <div class="info-box">
        <div class="info-row">
          <span class="label">Job Type:</span> ${lead.jobType?.replace(/_/g, ' ').toUpperCase() || 'Unknown'}
        </div>
        <div class="info-row">
          <span class="label">Location:</span> ${lead.city}, ${lead.county}
        </div>
        <div class="info-row">
          <span class="label">Urgency:</span> <span class="${lead.urgency === 'emergency' ? 'urgent' : ''}">${lead.urgency?.toUpperCase()}</span>
        </div>
        <div class="info-row">
          <span class="label">Status:</span> ${lead.status?.toUpperCase()}
        </div>
      </div>

      ${contactInfo.phone || contactInfo.email ? `
      <div class="info-box">
        <div class="label">Contact Information:</div>
        ${contactInfo.phone ? `<div class="info-row">📞 ${contactInfo.phone}</div>` : ''}
        ${contactInfo.email ? `<div class="info-row">📧 ${contactInfo.email}</div>` : ''}
      </div>
      ` : ''}

      <div class="info-box">
        <div class="label">Post Content:</div>
        <p style="margin-top: 10px; white-space: pre-wrap;">${lead.postText}</p>
        ${lead.postUrl ? `<p style="margin-top: 10px;"><a href="${lead.postUrl}" style="color: #667eea;">View Original Post →</a></p>` : ''}
      </div>

      <a href="https://app.ctlplumbing.com/leads/${lead.id}" class="btn">View Lead in Dashboard →</a>
    </div>

    <div class="footer">
      <p>CTL Plumbing Lead Management System</p>
      <p>This is an automated notification. Do not reply to this email.</p>
    </div>
  </div>
</body>
</html>
    `.trim();
  }

  /**
   * Get notification service status
   * @returns {Object} Service status
   */
  getStatus() {
    return {
      twilio: {
        configured: this.twilioConfigured,
        phoneNumber: this.twilioPhoneNumber
      },
      sendgrid: {
        configured: this.sendgridConfigured
      }
    };
  }
}

module.exports = new NotificationService();
