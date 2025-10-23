import express from 'express';
import pool from '../config/database.js';
import { requireAuth } from '../middleware/authMiddleware.js';

const router = express.Router();

// GET /api/users/:username - Get public user profile
router.get('/:username', async (req, res) => {
  try {
    const { username } = req.params;

    // Get user basic info
    const userResult = await pool.query(
      'SELECT id, username, email, display_name, created_at FROM users WHERE username = $1 AND is_test_account = FALSE',
      [username]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = userResult.rows[0];

    // Get user stats
    const statsResult = await pool.query(
      'SELECT * FROM user_stats WHERE user_id = $1',
      [user.id]
    );

    const stats = statsResult.rows[0] || {
      total_parlays: 0,
      total_wins: 0,
      total_losses: 0,
      win_rate: 0,
      current_streak: 0,
      best_streak: 0
    };

    // Get recent parlays (last 10)
    const parlaysResult = await pool.query(
      `SELECT id, parlay_name, leg_count, combined_ai_probability, 
              is_hit, created_at, season, week
       FROM user_parlays 
       WHERE user_id = $1 AND is_public = true
       ORDER BY created_at DESC 
       LIMIT 10`,
      [user.id]
    );

    res.json({
      user: {
        username: user.username,
        displayName: user.display_name,
        joinedDate: user.created_at
      },
      stats,
      recentParlays: parlaysResult.rows
    });

  } catch (err) {
    console.error('Error fetching user profile:', err);
    res.status(500).json({ error: 'Failed to load user profile' });
  }
});

export default router;