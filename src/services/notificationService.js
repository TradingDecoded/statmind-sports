// ============================================
// StatMind Sports - Notification Service
// Creates in-app notifications for users
// ============================================

import pool from '../config/database.js';
import emailService from './emailService.js';

class NotificationService {
  
  // ==========================================
  // CREATE PARLAY WIN NOTIFICATION
  // ==========================================
  async createParlayWinNotification(userId, parlay) {
    try {
      const result = await pool.query(
        `INSERT INTO notifications (user_id, type, title, message, parlay_id)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING *`,
        [
          userId,
          'parlay_win',
          `🎉 Your ${parlay.leg_count}-Leg Parlay Hit!`,
          `Congratulations! Your parlay "${parlay.parlay_name || 'Parlay'}" won with ${parlay.legs_hit}/${parlay.leg_count} correct picks!`,
          parlay.id
        ]
      );
      
      console.log(`✅ Win notification created for user ${userId}`);
      return result.rows[0];
    } catch (error) {
      console.error('Error creating win notification:', error);
      throw error;
    }
  }
  
  // ==========================================
  // CREATE PARLAY LOSS NOTIFICATION
  // ==========================================
  async createParlayLossNotification(userId, parlay) {
    try {
      const result = await pool.query(
        `INSERT INTO notifications (user_id, type, title, message, parlay_id)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING *`,
        [
          userId,
          'parlay_loss',
          `Parlay Result: ${parlay.legs_hit}/${parlay.leg_count} Correct`,
          `Your parlay "${parlay.parlay_name || 'Parlay'}" had ${parlay.legs_hit} out of ${parlay.leg_count} correct picks. Keep trying!`,
          parlay.id
        ]
      );
      
      console.log(`✅ Loss notification created for user ${userId}`);
      return result.rows[0];
    } catch (error) {
      console.error('Error creating loss notification:', error);
      throw error;
    }
  }
  
  // ==========================================
  // SEND PARLAY RESULT NOTIFICATIONS
  // Called when a parlay resolves
  // ==========================================
  async sendParlayResultNotifications(userId, parlay) {
    try {
      // Get user info
      const userResult = await pool.query(
        'SELECT * FROM users WHERE id = $1',
        [userId]
      );
      
      if (userResult.rows.length === 0) {
        console.warn(`⚠️  User ${userId} not found`);
        return;
      }
      
      const user = userResult.rows[0];
      
      // Create in-app notification
      if (parlay.is_hit) {
        await this.createParlayWinNotification(userId, parlay);
      } else {
        await this.createParlayLossNotification(userId, parlay);
      }
      
      // Send email notification
      if (parlay.is_hit) {
        await emailService.sendParlayWinEmail(user, parlay);
      } else {
        await emailService.sendParlayLossEmail(user, parlay);
      }
      
      console.log(`✅ All notifications sent for parlay ${parlay.id}`);
    } catch (error) {
      console.error('Error sending parlay result notifications:', error);
    }
  }
  
  // ==========================================
  // GET USER NOTIFICATIONS
  // ==========================================
  async getUserNotifications(userId, limit = 20) {
    try {
      const result = await pool.query(
        `SELECT * FROM notifications
         WHERE user_id = $1
         ORDER BY created_at DESC
         LIMIT $2`,
        [userId, limit]
      );
      
      return result.rows;
    } catch (error) {
      console.error('Error getting notifications:', error);
      throw error;
    }
  }
  
  // ==========================================
  // GET UNREAD NOTIFICATION COUNT
  // ==========================================
  async getUnreadCount(userId) {
    try {
      const result = await pool.query(
        `SELECT COUNT(*) as count
         FROM notifications
         WHERE user_id = $1 AND is_read = FALSE`,
        [userId]
      );
      
      return parseInt(result.rows[0].count);
    } catch (error) {
      console.error('Error getting unread count:', error);
      throw error;
    }
  }
  
  // ==========================================
  // MARK NOTIFICATION AS READ
  // ==========================================
  async markAsRead(notificationId, userId) {
    try {
      await pool.query(
        `UPDATE notifications
         SET is_read = TRUE
         WHERE id = $1 AND user_id = $2`,
        [notificationId, userId]
      );
      
      console.log(`✅ Notification ${notificationId} marked as read`);
      return true;
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  }
  
  // ==========================================
  // MARK ALL NOTIFICATIONS AS READ
  // ==========================================
  async markAllAsRead(userId) {
    try {
      await pool.query(
        `UPDATE notifications
         SET is_read = TRUE
         WHERE user_id = $1 AND is_read = FALSE`,
        [userId]
      );
      
      console.log(`✅ All notifications marked as read for user ${userId}`);
      return true;
    } catch (error) {
      console.error('Error marking all as read:', error);
      throw error;
    }
  }
}

export default new NotificationService();
