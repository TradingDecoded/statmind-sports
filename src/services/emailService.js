// ============================================
// StatMind Sports - Email Service
// Sends email notifications to users
// ============================================

import nodemailer from 'nodemailer';

class EmailService {
  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      secure: process.env.EMAIL_SECURE === 'true',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
      }
    });
  }

  // ==========================================
  // SEND PARLAY WIN EMAIL
  // ==========================================
  async sendParlayWinEmail(user, parlay) {
    try {
      const subject = `🎉 Your ${parlay.leg_count}-Leg Parlay Hit!`;
      
      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #10b981; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
            .stats { background: white; padding: 15px; margin: 20px 0; border-radius: 8px; }
            .button { display: inline-block; background: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎉 WINNER!</h1>
            </div>
            <div class="content">
              <p>Hey ${user.username},</p>
              <p><strong>Congratulations! Your parlay just hit!</strong></p>
              
              <div class="stats">
                <h3>${parlay.parlay_name || 'Your Parlay'}</h3>
                <p><strong>Legs:</strong> ${parlay.leg_count}</p>
                <p><strong>Legs Hit:</strong> ${parlay.legs_hit}/${parlay.leg_count}</p>
                <p><strong>AI Probability:</strong> ${(parlay.combined_ai_probability * 100).toFixed(1)}%</p>
                <p><strong>Risk Level:</strong> ${parlay.risk_level}</p>
              </div>
              
              <p>Your win has been added to your stats, and your ranking may have improved on the leaderboard!</p>
              
              <a href="${process.env.SITE_URL}/my-parlays" class="button">View Your Parlays</a>
              
              <p style="margin-top: 30px; font-size: 12px; color: #666;">
                Keep up the great work! 🏆<br>
                - StatMind Sports Team
              </p>
            </div>
          </div>
        </body>
        </html>
      `;

      await this.transporter.sendMail({
        from: process.env.EMAIL_FROM,
        to: user.email,
        subject,
        html
      });

      console.log(`✅ Win email sent to ${user.email}`);
      return true;
    } catch (error) {
      console.error('Error sending win email:', error);
      return false;
    }
  }

  // ==========================================
  // SEND PARLAY LOSS EMAIL
  // ==========================================
  async sendParlayLossEmail(user, parlay) {
    try {
      const subject = `Your ${parlay.leg_count}-Leg Parlay Result`;
      
      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #ef4444; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
            .stats { background: white; padding: 15px; margin: 20px 0; border-radius: 8px; }
            .button { display: inline-block; background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Parlay Result</h1>
            </div>
            <div class="content">
              <p>Hey ${user.username},</p>
              <p>Your parlay didn't quite hit this time, but every parlay is a learning experience!</p>
              
              <div class="stats">
                <h3>${parlay.parlay_name || 'Your Parlay'}</h3>
                <p><strong>Legs:</strong> ${parlay.leg_count}</p>
                <p><strong>Legs Hit:</strong> ${parlay.legs_hit}/${parlay.leg_count}</p>
                <p><strong>AI Probability:</strong> ${(parlay.combined_ai_probability * 100).toFixed(1)}%</p>
                <p><strong>Risk Level:</strong> ${parlay.risk_level}</p>
              </div>
              
              <p>Don't give up! Check out this week's predictions and build your next winning parlay.</p>
              
              <a href="${process.env.SITE_URL}/predictions" class="button">View This Week's Predictions</a>
              
              <p style="margin-top: 30px; font-size: 12px; color: #666;">
                You've got this! 💪<br>
                - StatMind Sports Team
              </p>
            </div>
          </div>
        </body>
        </html>
      `;

      await this.transporter.sendMail({
        from: process.env.EMAIL_FROM,
        to: user.email,
        subject,
        html
      });

      console.log(`✅ Loss email sent to ${user.email}`);
      return true;
    } catch (error) {
      console.error('Error sending loss email:', error);
      return false;
    }
  }
}

export default new EmailService();
