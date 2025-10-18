// ============================================
// StatMind Sports - Membership Service
// Handles Premium/VIP tier management
// ============================================

import pool from '../config/database.js';
import smsBucksService from './smsBucksService.js';

class MembershipService {
  
  // ==========================================
  // GET USER MEMBERSHIP INFO
  // ==========================================
  async getMembershipInfo(userId) {
    try {
      const result = await pool.query(
        `SELECT 
          membership_tier,
          sms_bucks,
          subscription_start_date,
          subscription_end_date
         FROM users
         WHERE id = $1`,
        [userId]
      );
      
      if (result.rows.length === 0) {
        throw new Error('User not found');
      }
      
      const user = result.rows[0];
      
      return {
        tier: user.membership_tier,
        smsBucks: user.sms_bucks,
        subscriptionStart: user.subscription_start_date,
        subscriptionEnd: user.subscription_end_date,
        isActive: this.isSubscriptionActive(user.subscription_end_date)
      };
      
    } catch (error) {
      console.error('Error getting membership info:', error);
      throw error;
    }
  }
  
  // ==========================================
  // CHECK IF SUBSCRIPTION IS ACTIVE
  // ==========================================
  isSubscriptionActive(subscriptionEndDate) {
    if (!subscriptionEndDate) return false;
    return new Date(subscriptionEndDate) > new Date();
  }
  
  // ==========================================
  // UPGRADE TO PREMIUM ($10/month)
  // ==========================================
  async upgradeToPremium(userId) {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      const now = new Date();
      const endDate = new Date(now);
      endDate.setMonth(endDate.getMonth() + 1); // 1 month from now
      
      // 1. Update user tier
      await client.query(
        `UPDATE users 
         SET membership_tier = 'premium',
             subscription_start_date = $1,
             subscription_end_date = $2
         WHERE id = $3`,
        [now, endDate, userId]
      );
      
      // 2. Give 300 SMS Bucks monthly allowance
      await client.query(
        `INSERT INTO sms_bucks_transactions 
         (user_id, amount, transaction_type, balance_after, description)
         VALUES ($1, 300, 'monthly_allowance', 
                 (SELECT sms_bucks + 300 FROM users WHERE id = $1),
                 'Premium tier monthly allowance')`,
        [userId]
      );
      
      await client.query(
        'UPDATE users SET sms_bucks = sms_bucks + 300 WHERE id = $1',
        [userId]
      );
      
      await client.query('COMMIT');
      
      console.log(`✅ User ${userId} upgraded to Premium`);
      
      return {
        success: true,
        tier: 'premium',
        smsBucksAdded: 300,
        subscriptionEnd: endDate
      };
      
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Error upgrading to Premium:', error);
      throw error;
    } finally {
      client.release();
    }
  }
  
  // ==========================================
  // UPGRADE TO VIP ($20/month)
  // ==========================================
  async upgradeToVIP(userId) {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      const now = new Date();
      const endDate = new Date(now);
      endDate.setMonth(endDate.getMonth() + 1); // 1 month from now
      
      // 1. Update user tier
      await client.query(
        `UPDATE users 
         SET membership_tier = 'vip',
             subscription_start_date = $1,
             subscription_end_date = $2
         WHERE id = $3`,
        [now, endDate, userId]
      );
      
      // 2. Give 750 SMS Bucks monthly allowance
      await client.query(
        `INSERT INTO sms_bucks_transactions 
         (user_id, amount, transaction_type, balance_after, description)
         VALUES ($1, 750, 'monthly_allowance', 
                 (SELECT sms_bucks + 750 FROM users WHERE id = $1),
                 'VIP tier monthly allowance')`,
        [userId]
      );
      
      await client.query(
        'UPDATE users SET sms_bucks = sms_bucks + 750 WHERE id = $1',
        [userId]
      );
      
      await client.query('COMMIT');
      
      console.log(`✅ User ${userId} upgraded to VIP`);
      
      return {
        success: true,
        tier: 'vip',
        smsBucksAdded: 750,
        subscriptionEnd: endDate
      };
      
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Error upgrading to VIP:', error);
      throw error;
    } finally {
      client.release();
    }
  }
  
  // ==========================================
  // ALLOCATE MONTHLY SMS BUCKS
  // Called by cron job on 1st of month
  // ==========================================
  async allocateMonthlyBucks() {
    try {
      // Get all Premium users
      const premiumResult = await pool.query(
        `SELECT id FROM users 
         WHERE membership_tier = 'premium' 
         AND subscription_end_date > NOW()`
      );
      
      for (const user of premiumResult.rows) {
        await smsBucksService.addBucks(
          user.id,
          300,
          'monthly_allowance',
          'Premium monthly SMS Bucks'
        );
      }
      
      // Get all VIP users
      const vipResult = await pool.query(
        `SELECT id FROM users 
         WHERE membership_tier = 'vip' 
         AND subscription_end_date > NOW()`
      );
      
      for (const user of vipResult.rows) {
        await smsBucksService.addBucks(
          user.id,
          750,
          'monthly_allowance',
          'VIP monthly SMS Bucks'
        );
      }
      
      console.log(`✅ Monthly SMS Bucks allocated: ${premiumResult.rows.length} Premium, ${vipResult.rows.length} VIP`);
      
      return {
        success: true,
        premiumUsers: premiumResult.rows.length,
        vipUsers: vipResult.rows.length
      };
      
    } catch (error) {
      console.error('Error allocating monthly SMS Bucks:', error);
      throw error;
    }
  }
}

export default new MembershipService();
