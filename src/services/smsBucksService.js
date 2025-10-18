// ============================================
// StatMind Sports - SMS Bucks Service
// Handles virtual currency transactions
// ============================================

import pool from '../config/database.js';

class SMSBucksService {
  
  // ==========================================
  // GET USER SMS BUCKS BALANCE
  // ==========================================
  async getBalance(userId) {
    try {
      const result = await pool.query(
        'SELECT sms_bucks, membership_tier FROM users WHERE id = $1',
        [userId]
      );
      
      if (result.rows.length === 0) {
        throw new Error('User not found');
      }
      
      return {
        balance: result.rows[0].sms_bucks,
        tier: result.rows[0].membership_tier
      };
    } catch (error) {
      console.error('Error getting SMS Bucks balance:', error);
      throw error;
    }
  }
  
  // ==========================================
  // ADD SMS BUCKS (with transaction record)
  // ==========================================
  async addBucks(userId, amount, transactionType, description, relatedParlayId = null) {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // 1. Get current balance
      const userResult = await client.query(
        'SELECT sms_bucks FROM users WHERE id = $1',
        [userId]
      );
      
      if (userResult.rows.length === 0) {
        throw new Error('User not found');
      }
      
      const currentBalance = userResult.rows[0].sms_bucks;
      const newBalance = currentBalance + amount;
      
      // 2. Update user balance
      await client.query(
        'UPDATE users SET sms_bucks = $1 WHERE id = $2',
        [newBalance, userId]
      );
      
      // 3. Create transaction record
      await client.query(
        `INSERT INTO sms_bucks_transactions 
         (user_id, amount, transaction_type, balance_after, description, related_parlay_id)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [userId, amount, transactionType, newBalance, description, relatedParlayId]
      );
      
      await client.query('COMMIT');
      
      console.log(`✅ Added ${amount} SMS Bucks to user ${userId}. New balance: ${newBalance}`);
      
      return {
        success: true,
        newBalance,
        amountAdded: amount
      };
      
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Error adding SMS Bucks:', error);
      throw error;
    } finally {
      client.release();
    }
  }
  
  // ==========================================
  // DEDUCT SMS BUCKS (with transaction record)
  // ==========================================
  async deductBucks(userId, amount, transactionType, description, relatedParlayId = null) {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // 1. Get current balance
      const userResult = await client.query(
        'SELECT sms_bucks FROM users WHERE id = $1',
        [userId]
      );
      
      if (userResult.rows.length === 0) {
        throw new Error('User not found');
      }
      
      const currentBalance = userResult.rows[0].sms_bucks;
      
      // 2. Check if user has enough SMS Bucks
      if (currentBalance < amount) {
        throw new Error(`Insufficient SMS Bucks. Need ${amount}, have ${currentBalance}`);
      }
      
      const newBalance = currentBalance - amount;
      
      // 3. Update user balance
      await client.query(
        'UPDATE users SET sms_bucks = $1 WHERE id = $2',
        [newBalance, userId]
      );
      
      // 4. Create transaction record (negative amount)
      await client.query(
        `INSERT INTO sms_bucks_transactions 
         (user_id, amount, transaction_type, balance_after, description, related_parlay_id)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [userId, -amount, transactionType, newBalance, description, relatedParlayId]
      );
      
      await client.query('COMMIT');
      
      console.log(`✅ Deducted ${amount} SMS Bucks from user ${userId}. New balance: ${newBalance}`);
      
      return {
        success: true,
        newBalance,
        amountDeducted: amount
      };
      
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Error deducting SMS Bucks:', error);
      throw error;
    } finally {
      client.release();
    }
  }
  
  // ==========================================
  // DAILY LOGIN BONUS (+5 SMS Bucks)
  // Only once per day
  // ==========================================
  async processDailyLoginBonus(userId) {
    try {
      const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
      
      // Check if user already got bonus today
      const result = await pool.query(
        'SELECT last_login_bonus_date FROM users WHERE id = $1',
        [userId]
      );
      
      if (result.rows.length === 0) {
        throw new Error('User not found');
      }
      
      const lastBonusDate = result.rows[0].last_login_bonus_date;
      
      // If already claimed today, skip
      if (lastBonusDate === today) {
        return {
          success: false,
          message: 'Daily login bonus already claimed today'
        };
      }
      
      // Award bonus
      const bonusResult = await this.addBucks(
        userId,
        5,
        'daily_login',
        'Daily login bonus'
      );
      
      // Update last bonus date
      await pool.query(
        'UPDATE users SET last_login_bonus_date = $1 WHERE id = $2',
        [today, userId]
      );
      
      return {
        success: true,
        message: '+5 SMS Bucks for logging in today!',
        newBalance: bonusResult.newBalance
      };
      
    } catch (error) {
      console.error('Error processing daily login bonus:', error);
      throw error;
    }
  }
  
  // ==========================================
  // GET TRANSACTION HISTORY
  // ==========================================
  async getTransactionHistory(userId, limit = 50) {
    try {
      const result = await pool.query(
        `SELECT 
          id,
          amount,
          transaction_type,
          balance_after,
          description,
          related_parlay_id,
          created_at
         FROM sms_bucks_transactions
         WHERE user_id = $1
         ORDER BY created_at DESC
         LIMIT $2`,
        [userId, limit]
      );
      
      return result.rows;
      
    } catch (error) {
      console.error('Error getting transaction history:', error);
      throw error;
    }
  }
  
  // ==========================================
  // CALCULATE PARLAY COST
  // Based on number of legs
  // ==========================================
  calculateParlayCost(legCount) {
    if (legCount === 2) return 50;
    if (legCount === 3) return 75;
    if (legCount === 4) return 100;
    if (legCount === 5) return 125;
    if (legCount >= 6) return 150;
    return 0;
  }
  
  // ==========================================
  // CALCULATE WIN REWARD
  // Based on membership tier
  // ==========================================
  calculateWinReward(membershipTier) {
    if (membershipTier === 'vip') return 50;
    if (membershipTier === 'premium') return 25;
    return 0; // Free users don't get rewards
  }
}

export default new SMSBucksService();