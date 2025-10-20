// ============================================
// StatMind Sports - Parlay Routes
// API endpoints for parlay functionality
// ============================================

import express from 'express';
import { body, validationResult } from 'express-validator';
import parlayService from '../services/parlayService.js';
import { requireAuth } from '../middleware/authMiddleware.js';
import pool from '../config/database.js';

const router = express.Router();

// ==========================================
// GET /api/parlay/available-games
// Get games available for parlay creation
// ==========================================
router.get('/available-games', requireAuth, async (req, res) => {
  try {
    const { season, week } = req.query;

    // Calculate current week dynamically based on actual 2025 NFL schedule
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth(); // 0-11

    // Determine season
    let calculatedSeason = currentMonth >= 8 ? currentYear : currentYear;

    // NFL 2025 Season Start: September 4, 2025
    // Calculate week based on days since season start
    const seasonStartDate = new Date(2025, 8, 4); // Sept 4, 2025 (month is 0-indexed)
    const daysSinceStart = Math.floor((now - seasonStartDate) / (1000 * 60 * 60 * 24));
    const weeksSinceStart = Math.floor(daysSinceStart / 7);
    let calculatedWeek = weeksSinceStart + 1; // Week 1 starts on day 0

    // Ensure week is in valid range (1-18 for regular season)
    if (calculatedWeek < 1) calculatedWeek = 1;
    if (calculatedWeek > 18) calculatedWeek = 18;

    console.log(`📅 Current date: ${now.toISOString()}`);
    console.log(`📅 Season start: ${seasonStartDate.toISOString()}`);
    console.log(`📅 Days since start: ${daysSinceStart}`);
    console.log(`📅 Calculated week: ${calculatedWeek}`);

    const currentSeason = season ? parseInt(season) : calculatedSeason;
    const currentWeek = week ? parseInt(week) : calculatedWeek;

    // Get all games for the week
    const allGames = await parlayService.getAvailableGames(currentSeason, currentWeek);

    // Filter out completed games - only show upcoming
    const upcomingGames = allGames.filter(game => !game.is_final);

    res.json({
      success: true,
      games: upcomingGames,
      count: upcomingGames.length,
      week: currentWeek,
      season: currentSeason
    });

  } catch (error) {
    console.error('Get available games error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch available games'
    });
  }
});

// ==========================================
// POST /api/parlay/calculate
// Calculate probability for selected games
// (doesn't save, just calculates)
// ==========================================
router.post('/calculate', requireAuth, async (req, res) => {
  try {
    const { games } = req.body;

    console.log('📊 Calculating parlay for games:', JSON.stringify(games, null, 2));

    if (!games || games.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Games array is required'
      });
    }

    const calculation = parlayService.calculateParlayProbability(games);

    console.log('✅ Calculation result:', calculation);

    res.json({
      success: true,
      ...calculation
    });

  } catch (error) {
    console.error('Calculate probability error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to calculate probability'
    });
  }
});

// ==========================================
// POST /api/parlay/create
// Create and save a new parlay
// ==========================================
router.post('/create',
  requireAuth,
  [
    body('parlayName')
      .trim()
      .isLength({ min: 1, max: 100 })
      .withMessage('Parlay name must be 1-100 characters'),
    body('season')
      .isInt()
      .withMessage('Season must be a valid year'),
    body('week')
      .isInt({ min: 1, max: 18 })
      .withMessage('Week must be between 1-18'),
    body('games')
      .isArray({ min: 1 })
      .withMessage('Must include at least 1 game')
  ],
  async (req, res) => {
    try {
      // Validate input
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array()
        });
      }

      const userId = req.user.id;
      const parlayData = req.body;

      const result = await parlayService.createParlay(userId, parlayData);

      res.status(201).json(result);

    } catch (error) {
      console.error('Create parlay route error:', error);
      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  }
);

// ==========================================
// GET /api/parlay/mine
// Get current user's parlays
// ==========================================
router.get('/mine', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { season, status } = req.query;

    const parlays = await parlayService.getUserParlays(userId, {
      season: season ? parseInt(season) : null,
      status
    });

    res.json({
      success: true,
      parlays,
      count: parlays.length
    });

  } catch (error) {
    console.error('Get user parlays error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch parlays'
    });
  }
});

// ==========================================
// GET /api/parlay/:id
// Get single parlay details
// ==========================================
router.get('/:id', requireAuth, async (req, res) => {
  try {
    const parlayId = parseInt(req.params.id);
    const userId = req.user.id;

    const parlay = await parlayService.getParlayById(parlayId, userId);

    res.json({
      success: true,
      parlay
    });

  } catch (error) {
    console.error('Get parlay error:', error);
    res.status(404).json({
      success: false,
      error: error.message
    });
  }
});

// ==========================================
// DELETE /api/parlay/:id
// Delete a parlay with SMS Bucks refund if eligible
// ==========================================
router.delete('/:id', requireAuth, async (req, res) => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const parlayId = req.params.id;
    const userId = req.user.id;

    console.log(`🗑️  Delete request for parlay ${parlayId} by user ${userId}`);

    // ==========================================
    // Get parlay details including SMS Bucks cost and membership
    // ==========================================
    const checkResult = await client.query(
      `SELECT up.user_id, up.is_hit, up.games, up.sms_bucks_cost, 
          u.membership_tier, u.sms_bucks
          FROM user_parlays up
          JOIN users u ON up.user_id = u.id
          WHERE up.id = $1`,
      [parlayId]
    );

    if (checkResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({
        success: false,
        error: 'Parlay not found'
      });
    }

    if (checkResult.rows[0].user_id !== userId) {
      await client.query('ROLLBACK');
      return res.status(403).json({
        success: false,
        error: 'Not authorized to delete this parlay'
      });
    }

    const parlayStatus = checkResult.rows[0].is_hit;
    const games = checkResult.rows[0].games;
    const smsBucksCost = checkResult.rows[0].sms_bucks_cost || 0;
    const membershipTier = checkResult.rows[0].membership_tier;
    const currentBalance = checkResult.rows[0].sms_bucks;

    // ==========================================
    // PARLAY LOCKING: Check if any game has started
    // ==========================================
    let isLocked = false;

    if (games && games.length > 0) {
      const gameIds = games.map(game => game.game_id);

      const gameStatusCheck = await client.query(
        `SELECT id, game_date, status,
                CASE 
                  WHEN status IN ('in_progress', 'final') THEN true
                  WHEN status = 'scheduled' AND game_date <= NOW() THEN true
                  ELSE false 
                END as has_started
         FROM games 
         WHERE id = ANY($1::int[])
         ORDER BY game_date ASC`,
        [gameIds]
      );

      const anyGameStarted = gameStatusCheck.rows.some(game => game.has_started);

      if (anyGameStarted) {
        const firstGameStarted = gameStatusCheck.rows.find(game => game.has_started);
        await client.query('ROLLBACK');

        console.log(`🔒 Cannot delete parlay ${parlayId} - games have started`);

        return res.status(403).json({
          success: false,
          error: 'Cannot delete parlay after games have started',
          locked: true,
          first_game_started: firstGameStarted.game_date,
          first_game_status: firstGameStarted.status,
          message: 'This parlay is locked because at least one game has already started. Parlays cannot be deleted after the first game begins.'
        });
      }
    }

    // ==========================================
    // REFUND SMS BUCKS (if Premium/VIP and cost > 0)
    // ==========================================
    let refundAmount = 0;
    const isEligibleForRefund =
      ['premium', 'vip'].includes(membershipTier) &&
      smsBucksCost > 0 &&
      !isLocked;

    if (isEligibleForRefund) {
      refundAmount = smsBucksCost;
      const newBalance = currentBalance + refundAmount;

      // Update user balance
      await client.query(
        'UPDATE users SET sms_bucks = $1 WHERE id = $2',
        [newBalance, userId]
      );

      // Create refund transaction record
      await client.query(
        `INSERT INTO sms_bucks_transactions 
         (user_id, amount, transaction_type, balance_after, description, related_parlay_id)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          userId,
          refundAmount,
          'parlay_refund',
          newBalance,
          `Parlay deleted before games started - ${smsBucksCost} SMS Bucks refunded`,
          parlayId
        ]
      );

      console.log(`💰 Refunded ${refundAmount} SMS Bucks to user ${userId}`);
    }

    // ==========================================
    // Decrement weekly parlay count (if Premium/VIP)
    // ==========================================
    if (['premium', 'vip'].includes(membershipTier)) {
      const now = new Date();
      const year = now.getFullYear();
      const week = getWeekNumber(now);

      await client.query(
        `UPDATE weekly_parlay_counts
         SET parlay_count = GREATEST(0, parlay_count - 1)
         WHERE user_id = $1 AND year = $2 AND week_number = $3`,
        [userId, year, week]
      );

      console.log(`📊 Decremented weekly parlay count for user ${userId}`);
    }

    // ==========================================
    // Update competition standings (if Premium/VIP)
    // ==========================================
    if (['premium', 'vip'].includes(membershipTier)) {
      // Get current competition ID
      const competitionResult = await client.query(
        `SELECT id FROM weekly_competitions 
         WHERE status = 'active' 
         AND start_date <= CURRENT_DATE 
         AND end_date >= CURRENT_DATE
         LIMIT 1`
      );

      if (competitionResult.rows.length > 0) {
        const competitionId = competitionResult.rows[0].id;

        await client.query(
          `UPDATE weekly_competition_standings
           SET parlays_entered = GREATEST(0, parlays_entered - 1)
           WHERE user_id = $1 AND competition_id = $2`,
          [userId, competitionId]
        );

        console.log(`🏆 Updated competition standings for user ${userId}`);
      }
    }

    // ==========================================
    // Delete the parlay
    // ==========================================
    await client.query('DELETE FROM user_parlays WHERE id = $1', [parlayId]);

    // ==========================================
    // Update user stats based on parlay status
    // ==========================================
    if (parlayStatus === null) {
      await client.query(
        `UPDATE user_stats 
         SET total_parlays = GREATEST(0, total_parlays - 1),
             pending_parlays = GREATEST(0, pending_parlays - 1)
         WHERE user_id = $1`,
        [userId]
      );
    } else if (parlayStatus === true) {
      await client.query(
        `UPDATE user_stats 
         SET total_parlays = GREATEST(0, total_parlays - 1),
             total_wins = GREATEST(0, total_wins - 1)
         WHERE user_id = $1`,
        [userId]
      );
    } else {
      await client.query(
        `UPDATE user_stats 
         SET total_parlays = GREATEST(0, total_parlays - 1),
             total_losses = GREATEST(0, total_losses - 1)
         WHERE user_id = $1`,
        [userId]
      );
    }

    // Recalculate win rate
    await client.query(
      `UPDATE user_stats 
       SET win_rate = CASE 
         WHEN (total_wins + total_losses) > 0 
         THEN ROUND((total_wins::DECIMAL / (total_wins + total_losses)) * 100, 2)
         ELSE 0 
       END
       WHERE user_id = $1`,
      [userId]
    );

    await client.query('COMMIT');

    console.log(`✅ Deleted parlay ${parlayId} for user ${userId}`);

    res.json({
      success: true,
      message: 'Parlay deleted successfully',
      refunded: isEligibleForRefund,
      refundAmount: refundAmount
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Delete parlay error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete parlay'
    });
  } finally {
    client.release();
  }
});

// ==========================================
// HELPER FUNCTIONS
// ==========================================
function getWeekNumber(date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
}

export default router;
