// ============================================
// StatMind Sports - Admin Management Routes
// SMS Bucks management and user administration
// ============================================

import express from 'express';
import pool from '../config/database.js';
import { requireAuth } from '../middleware/authMiddleware.js';
import { requireAdmin } from '../middleware/adminMiddleware.js';

const router = express.Router();

// All routes require authentication + admin
router.use(requireAuth);
router.use(requireAdmin);

// ==========================================
// GET /api/admin/users/search
// Search for users by email or username
// ==========================================
router.get('/users/search', async (req, res) => {
  try {
    const { query } = req.query;

    if (!query || query.length < 2) {
      return res.json({
        success: true,
        users: []
      });
    }

    const result = await pool.query(
      `SELECT id, username, email, display_name, membership_tier, sms_bucks, is_admin, created_at
       FROM users
       WHERE (email ILIKE $1 OR username ILIKE $1)
       AND is_active = true
       ORDER BY username
       LIMIT 20`,
      [`%${query}%`]
    );

    res.json({
      success: true,
      users: result.rows
    });

  } catch (error) {
    console.error('User search error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to search users'
    });
  }
});

// ==========================================
// GET /api/admin/users/:userId
// Get detailed user info
// ==========================================
router.get('/users/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    const result = await pool.query(
      `SELECT id, username, email, display_name, membership_tier, sms_bucks, 
              is_admin, created_at, last_active
       FROM users
       WHERE id = $1 AND is_active = true`,
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Get recent transactions
    const transactions = await pool.query(
      `SELECT id, amount, type, description, created_at
       FROM sms_bucks_transactions
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT 10`,
      [userId]
    );

    res.json({
      success: true,
      user: result.rows[0],
      recentTransactions: transactions.rows
    });

  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get user details'
    });
  }
});

// ==========================================
// POST /api/admin/users/:userId/adjust-bucks
// Add or remove SMS Bucks from a user
// ==========================================
router.post('/users/:userId/adjust-bucks', async (req, res) => {
  try {
    const { userId } = req.params;
    const { amount, type, description } = req.body;

    // Validation
    if (!amount || amount === 0) {
      return res.status(400).json({
        success: false,
        error: 'Amount must be non-zero'
      });
    }

    if (!type) {
      return res.status(400).json({
        success: false,
        error: 'Transaction type is required'
      });
    }

    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // Get current balance
      const userResult = await client.query(
        'SELECT sms_bucks, username FROM users WHERE id = $1',
        [userId]
      );

      if (userResult.rows.length === 0) {
        throw new Error('User not found');
      }

      const currentBalance = userResult.rows[0].sms_bucks;
      const newBalance = currentBalance + amount;

      // Prevent negative balance
      if (newBalance < 0) {
        throw new Error('Cannot reduce balance below zero');
      }

      // Update user balance
      await client.query(
        'UPDATE users SET sms_bucks = $1 WHERE id = $2',
        [newBalance, userId]
      );

      // Create transaction record
      await client.query(
        `INSERT INTO sms_bucks_transactions 
         (user_id, amount, type, description, balance_after)
         VALUES ($1, $2, $3, $4, $5)`,
        [userId, amount, type, description || 'Admin adjustment', newBalance]
      );

      await client.query('COMMIT');

      console.log(`✅ Admin adjusted SMS Bucks for user ${userResult.rows[0].username}: ${amount > 0 ? '+' : ''}${amount}`);

      res.json({
        success: true,
        message: 'SMS Bucks adjusted successfully',
        newBalance: newBalance
      });

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }

  } catch (error) {
    console.error('Adjust bucks error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to adjust SMS Bucks'
    });
  }
});

// ==========================================
// GET /api/admin/stats
// Get overall system stats
// ==========================================
router.get('/stats', async (req, res) => {
  try {
    // Total users
    const usersResult = await pool.query(
      'SELECT COUNT(*) as total FROM users WHERE is_active = true'
    );

    // Total SMS Bucks in circulation
    const bucksResult = await pool.query(
      'SELECT SUM(sms_bucks) as total FROM users WHERE is_active = true'
    );

    // Users by tier
    const tiersResult = await pool.query(
      `SELECT membership_tier, COUNT(*) as count
       FROM users
       WHERE is_active = true
       GROUP BY membership_tier`
    );

    res.json({
      success: true,
      stats: {
        totalUsers: parseInt(usersResult.rows[0].total),
        totalSmsBucks: parseInt(bucksResult.rows[0].total) || 0,
        usersByTier: tiersResult.rows
      }
    });

  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get system stats'
    });
  }
});

// ==========================================
// GET /api/admin/members
// Get all users with optional tier filtering
// ==========================================
router.get('/members', async (req, res) => {
  try {
    const { tier, search, page = 1, limit = 25 } = req.query;
    const offset = (page - 1) * limit;

    // Build the query
    let query = `
      SELECT 
        u.id,
        u.username,
        u.email,
        u.display_name,
        u.membership_tier,
        u.sms_bucks,
        u.created_at,
        u.is_active,
        u.subscription_start_date,
        u.subscription_end_date,
        COUNT(DISTINCT up.id) as total_parlays,
        COUNT(DISTINCT CASE WHEN up.is_hit = true THEN up.id END) as total_wins
      FROM users u
      LEFT JOIN user_parlays up ON u.id = up.user_id
      WHERE u.is_active = true
    `;

    const queryParams = [];
    let paramCount = 1;

    // Add tier filter if provided
    if (tier && tier !== 'all') {
      query += ` AND u.membership_tier = $${paramCount}`;
      queryParams.push(tier);
      paramCount++;
    }

    // Add search filter if provided
    if (search) {
      query += ` AND (u.username ILIKE $${paramCount} OR u.email ILIKE $${paramCount})`;
      queryParams.push(`%${search}%`);
      paramCount++;
    }

    query += `
      GROUP BY u.id
      ORDER BY u.created_at DESC
      LIMIT $${paramCount} OFFSET $${paramCount + 1}
    `;
    queryParams.push(limit, offset);

    // Get total count for pagination
    let countQuery = `
      SELECT COUNT(*) as total
      FROM users u
      WHERE u.is_active = true
    `;
    const countParams = [];
    let countParamCount = 1;

    if (tier && tier !== 'all') {
      countQuery += ` AND u.membership_tier = $${countParamCount}`;
      countParams.push(tier);
      countParamCount++;
    }

    if (search) {
      countQuery += ` AND (u.username ILIKE $${countParamCount} OR u.email ILIKE $${countParamCount})`;
      countParams.push(`%${search}%`);
    }

    const [usersResult, countResult] = await Promise.all([
      pool.query(query, queryParams),
      pool.query(countQuery, countParams)
    ]);

    const totalUsers = parseInt(countResult.rows[0].total);
    const totalPages = Math.ceil(totalUsers / limit);

    res.json({
      success: true,
      users: usersResult.rows,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalUsers,
        perPage: parseInt(limit)
      }
    });

  } catch (error) {
    console.error('Get members error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch members'
    });
  }
});

// ==========================================
// GET /api/admin/management/members/:userId
// Get detailed user information
// ==========================================
router.get('/members/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    // Get user basic info
    const userResult = await pool.query(
      `SELECT 
        u.id,
        u.username,
        u.email,
        u.display_name,
        u.membership_tier,
        u.sms_bucks,
        u.created_at,
        u.is_active,
        u.subscription_start_date,
        u.subscription_end_date,
        u.last_login_bonus_date,
        u.avatar_url,
        u.bio
      FROM users u
      WHERE u.id = $1`,
      [userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Get user stats
    const statsResult = await pool.query(
      `SELECT 
        COUNT(DISTINCT up.id) as total_parlays,
        COUNT(DISTINCT CASE WHEN up.is_hit = true THEN up.id END) as total_wins,
        COUNT(DISTINCT CASE WHEN up.is_hit = false THEN up.id END) as total_losses,
        COUNT(DISTINCT CASE WHEN up.is_hit IS NULL THEN up.id END) as pending_parlays,
        COALESCE(
          ROUND(
            (COUNT(CASE WHEN up.is_hit = true THEN 1 END)::DECIMAL / 
            NULLIF(COUNT(CASE WHEN up.is_hit IS NOT NULL THEN 1 END), 0)) * 100, 
            2
          ), 
          0
        ) as win_rate
      FROM user_parlays up
      WHERE up.user_id = $1`,
      [userId]
    );

    // Get SMS Bucks transactions (last 50)
    const transactionsResult = await pool.query(
      `SELECT 
        id,
        amount,
        transaction_type,
        balance_after,
        description,
        created_at
      FROM sms_bucks_transactions
      WHERE user_id = $1
      ORDER BY created_at DESC
      LIMIT 50`,
      [userId]
    );

    // Get recent parlays (last 20)
    const parlaysResult = await pool.query(
      `SELECT 
        id,
        parlay_name,
        season,
        week,
        leg_count,
        games,
        combined_ai_probability,
        risk_level,
        sms_bucks_cost,
        is_hit,
        legs_hit,
        created_at,
        resolved_at
      FROM user_parlays
      WHERE user_id = $1
      ORDER BY created_at DESC
      LIMIT 20`,
      [userId]
    );

    res.json({
      success: true,
      user: userResult.rows[0],
      stats: statsResult.rows[0],
      transactions: transactionsResult.rows,
      recentParlays: parlaysResult.rows
    });

  } catch (error) {
    console.error('Get user details error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get user details'
    });
  }
});

// ==========================================
// POST /api/admin/management/members/:userId/adjust-bucks
// Adjust user's SMS Bucks balance
// ==========================================
router.post('/members/:userId/adjust-bucks', async (req, res) => {
  const client = await pool.connect();

  try {
    const { userId } = req.params;
    const { amount, reason } = req.body;

    // Validate input
    if (!amount || amount === 0) {
      return res.status(400).json({
        success: false,
        error: 'Amount must be non-zero'
      });
    }

    if (!reason || reason.trim() === '') {
      return res.status(400).json({
        success: false,
        error: 'Reason is required'
      });
    }

    await client.query('BEGIN');

    // Get current balance
    const userResult = await client.query(
      'SELECT sms_bucks FROM users WHERE id = $1',
      [userId]
    );

    if (userResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    const currentBalance = userResult.rows[0].sms_bucks;
    const newBalance = currentBalance + amount;

    // Don't allow negative balance
    if (newBalance < 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        success: false,
        error: 'Cannot set negative SMS Bucks balance'
      });
    }

    // Update balance
    await client.query(
      'UPDATE users SET sms_bucks = $1 WHERE id = $2',
      [newBalance, userId]
    );

    // Record transaction
    await client.query(
      `INSERT INTO sms_bucks_transactions 
       (user_id, amount, transaction_type, balance_after, description)
       VALUES ($1, $2, $3, $4, $5)`,
      [userId, amount, 'admin_adjustment', newBalance, `Admin: ${reason}`]
    );

    await client.query('COMMIT');

    res.json({
      success: true,
      message: `SMS Bucks adjusted successfully. New balance: ${newBalance}`,
      newBalance,
      previousBalance: currentBalance,
      adjustment: amount
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Adjust SMS Bucks error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to adjust SMS Bucks'
    });
  } finally {
    client.release();
  }
});

// ==========================================
// POST /api/admin/management/members/:userId/change-tier
// Change user's membership tier
// ==========================================
router.post('/members/:userId/change-tier', async (req, res) => {
  const client = await pool.connect();

  try {
    const { userId } = req.params;
    const { tier } = req.body;

    // Validate tier
    const validTiers = ['free', 'premium', 'vip'];
    if (!validTiers.includes(tier)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid tier. Must be free, premium, or vip'
      });
    }

    await client.query('BEGIN');

    // Get current tier
    const userResult = await client.query(
      'SELECT membership_tier FROM users WHERE id = $1',
      [userId]
    );

    if (userResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    const oldTier = userResult.rows[0].membership_tier;

    // Update tier
    await client.query(
      'UPDATE users SET membership_tier = $1 WHERE id = $2',
      [tier, userId]
    );

    // If upgrading to premium or vip, set subscription dates
    if (tier === 'premium' || tier === 'vip') {
      const now = new Date();
      const endDate = new Date(now);
      endDate.setMonth(endDate.getMonth() + 1);

      await client.query(
        `UPDATE users 
         SET subscription_start_date = $1, subscription_end_date = $2 
         WHERE id = $3`,
        [now, endDate, userId]
      );
    }

    // If downgrading to free, clear subscription dates
    if (tier === 'free') {
      await client.query(
        `UPDATE users 
         SET subscription_start_date = NULL, subscription_end_date = NULL 
         WHERE id = $1`,
        [userId]
      );
    }

    await client.query('COMMIT');

    res.json({
      success: true,
      oldTier,
      newTier: tier,
      message: `Tier changed from ${oldTier} to ${tier}`
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Change tier error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to change tier'
    });
  } finally {
    client.release();
  }
});

// ==========================================
// POST /api/admin/management/members/:userId/add-free-month
// Add one free month to subscription
// ==========================================
router.post('/members/:userId/add-free-month', async (req, res) => {
  try {
    const { userId } = req.params;

    // Get current subscription
    const userResult = await pool.query(
      `SELECT membership_tier, subscription_end_date 
       FROM users WHERE id = $1`,
      [userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    const { membership_tier, subscription_end_date } = userResult.rows[0];

    // Only works for premium/vip
    if (membership_tier === 'free') {
      return res.status(400).json({
        success: false,
        error: 'Cannot add free month to free tier users'
      });
    }

    // Calculate new end date (add 30 days)
    let newEndDate;
    if (subscription_end_date) {
      newEndDate = new Date(subscription_end_date);
    } else {
      newEndDate = new Date();
    }
    newEndDate.setDate(newEndDate.getDate() + 30);

    // Update subscription
    await pool.query(
      'UPDATE users SET subscription_end_date = $1 WHERE id = $2',
      [newEndDate, userId]
    );

    res.json({
      success: true,
      newEndDate,
      message: 'Added 30 days to subscription'
    });

  } catch (error) {
    console.error('Add free month error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to add free month'
    });
  }
});

// ==========================================
// POST /api/admin/management/members/:userId/cancel-membership
// Cancel user's membership
// ==========================================
router.post('/members/:userId/cancel-membership', async (req, res) => {
  const client = await pool.connect();

  try {
    const { userId } = req.params;

    await client.query('BEGIN');

    // Downgrade to free tier
    await client.query(
      `UPDATE users 
       SET membership_tier = 'free',
           subscription_start_date = NULL,
           subscription_end_date = NULL
       WHERE id = $1`,
      [userId]
    );

    await client.query('COMMIT');

    res.json({
      success: true,
      message: 'Membership cancelled, user downgraded to free tier'
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Cancel membership error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to cancel membership'
    });
  } finally {
    client.release();
  }
});

// ==========================================
// POST /api/admin/management/reset/parlays
// DANGER: Reset all user parlays
// ==========================================
router.post('/reset/parlays', async (req, res) => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Delete all user parlays (games are stored in jsonb column, no separate legs table)
    const parlayResult = await client.query('DELETE FROM user_parlays');

    // Reset weekly parlay counts
    await client.query('DELETE FROM weekly_parlay_counts');

    await client.query('COMMIT');

    res.json({
      success: true,
      message: `Successfully deleted ${parlayResult.rowCount} parlays`,
      parlaysDeleted: parlayResult.rowCount
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Reset parlays error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to reset parlays'
    });
  } finally {
    client.release();
  }
});

// ==========================================
// POST /api/admin/management/reset/transactions
// DANGER: Reset all SMS Bucks transactions
// ==========================================
router.post('/reset/transactions', async (req, res) => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Get count before deleting
    const countResult = await client.query('SELECT COUNT(*) FROM sms_bucks_transactions');
    const count = parseInt(countResult.rows[0].count);

    // Delete all SMS Bucks transactions
    await client.query('DELETE FROM sms_bucks_transactions');

    // Optional: Reset all user SMS Bucks to their tier default
    await client.query(`
      UPDATE users 
      SET sms_bucks = CASE 
        WHEN membership_tier = 'vip' THEN 1000
        WHEN membership_tier = 'premium' THEN 500
        ELSE 0
      END
    `);

    await client.query('COMMIT');

    res.json({
      success: true,
      message: `Successfully deleted ${count} transactions and reset balances`,
      transactionsDeleted: count
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Reset transactions error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to reset transactions'
    });
  } finally {
    client.release();
  }
});

// ==========================================
// POST /api/admin/management/reset/competition-stats
// DANGER: Reset all competition-related stats
// ==========================================
router.post('/reset/competition-stats', async (req, res) => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Reset weekly competition data
    await client.query('DELETE FROM weekly_competitions');

    // Reset competition standings (not leaderboard)
    await client.query('DELETE FROM weekly_competition_standings');

    await client.query('COMMIT');

    res.json({
      success: true,
      message: 'Successfully reset all competition stats'
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Reset competition stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to reset competition stats'
    });
  } finally {
    client.release();
  }
});

// ==========================================
// POST /api/admin/management/reset/all
// DANGER: FULL SYSTEM RESET - Use before going live
// ==========================================
router.post('/reset/all', async (req, res) => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    console.log('🚨 FULL SYSTEM RESET INITIATED...');

    // 1. Delete user parlays (no separate legs table - games in jsonb)
    const parlayResult = await client.query('DELETE FROM user_parlays');
    console.log('✅ User parlays deleted:', parlayResult.rowCount);

    // 2. Delete weekly parlay counts
    await client.query('DELETE FROM weekly_parlay_counts');
    console.log('✅ Weekly parlay counts deleted');

    // 3. Delete SMS Bucks transactions
    const txResult = await client.query('DELETE FROM sms_bucks_transactions');
    console.log('✅ SMS Bucks transactions deleted:', txResult.rowCount);

    // 4. Reset user SMS Bucks to tier defaults
    await client.query(`
      UPDATE users 
      SET sms_bucks = CASE 
        WHEN membership_tier = 'vip' THEN 1000
        WHEN membership_tier = 'premium' THEN 500
        ELSE 0
      END
    `);
    console.log('✅ User SMS Bucks reset to defaults');

    // 5. Delete competition data
    await client.query('DELETE FROM weekly_competitions');
    await client.query('DELETE FROM weekly_competition_standings');
    console.log('✅ Competition data deleted');

    await client.query('COMMIT');

    console.log('🎉 FULL SYSTEM RESET COMPLETE');

    res.json({
      success: true,
      message: 'Full system reset completed successfully',
      details: {
        parlaysDeleted: parlayResult.rowCount,
        transactionsDeleted: txResult.rowCount
      }
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Full system reset error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to complete system reset'
    });
  } finally {
    client.release();
  }
});

export default router;
