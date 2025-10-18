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

export default router;
