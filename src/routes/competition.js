// ============================================
// StatMind Sports - Competition Routes
// API endpoints for weekly competitions
// ============================================

import express from 'express';
import { requireAuth, optionalAuth } from '../middleware/authMiddleware.js';
import competitionService from '../services/competitionService.js';
import pool from '../config/database.js';

const router = express.Router();

// ==========================================
// GET /api/competition/current
// Get current active competition
// ==========================================
router.get('/current', async (req, res) => {
  try {
    const competition = await competitionService.getCurrentCompetition();

    if (!competition) {
      return res.status(404).json({
        success: false,
        message: 'No active competition found'
      });
    }

    res.json({
      success: true,
      competition
    });
  } catch (error) {
    console.error('Error getting current competition:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ==========================================
// GET /api/competition/:id/leaderboard
// Get competition leaderboard
// ==========================================
router.get('/:id/leaderboard', async (req, res) => {
  try {
    const competitionId = parseInt(req.params.id);
    const limit = parseInt(req.query.limit) || 100;

    const leaderboard = await competitionService.getCompetitionLeaderboard(competitionId, limit);

    res.json({
      success: true,
      leaderboard
    });
  } catch (error) {
    console.error('Error getting leaderboard:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ==========================================
// POST /api/competition/determine-winner
// Manually trigger winner determination (admin only)
// ==========================================
router.post('/determine-winner', requireAuth, async (req, res) => {
  try {
    // TODO: Add admin check here
    const result = await competitionService.determineWeeklyWinner();
    res.json(result);
  } catch (error) {
    console.error('Error determining winner:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ==========================================
// GET /api/competition/status
// Get user's competition status (used by parlay builder)
// ==========================================
router.get('/status', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;

    // 🚨 SECURITY: Check user's current tier FIRST
    const userResult = await pool.query(
      'SELECT membership_tier FROM users WHERE id = $1',
      [userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    const userTier = userResult.rows[0].membership_tier;

    // Free users NEVER get competition status, regardless of opt-in
    if (userTier === 'free') {
      const competition = await competitionService.getCurrentCompetition();

      // Get free user's PRACTICE parlays with leg counts for current week
      let parlayCount = 0;
      let hypotheticalPoints = 0;
      if (competition) {
        const parlayResult = await pool.query(
          `SELECT leg_count
     FROM user_parlays 
     WHERE user_id = $1 
     AND season = $2
     AND week = $3
     AND is_practice_parlay = TRUE`,
          [userId, competition.season, competition.nfl_week]
        );

        parlayCount = parlayResult.rows.length;

        // Calculate hypothetical points based on actual leg counts
        hypotheticalPoints = parlayResult.rows.reduce((total, parlay) => {
          const legCount = parlay.leg_count;
          let points = 0;
          if (legCount === 2) points = 2;
          else if (legCount === 3) points = 6;
          else if (legCount === 4) points = 12;
          else if (legCount === 5) points = 25;
          else if (legCount >= 6) points = 50;
          return total + points;
        }, 0);
      }

      // Get active players count for this week
      let activePlayersCount = 0;
      if (competition) {
        const playersResult = await pool.query(
          `SELECT COUNT(DISTINCT user_id) as count
       FROM weekly_competition_standings
       WHERE competition_id = $1`,
          [competition.id]
        );
        activePlayersCount = parseInt(playersResult.rows[0].count);
      }

      return res.json({
        success: true,
        status: {
          accountTier: 'free',
          isOptedIn: false,
          isCompetitionWindowOpen: false,
          shouldCreateFreeParlays: true,
          canOptIn: false,
          isEligible: false,
          parlayCount: parlayCount,  // ← NOW IT'S DYNAMIC!
          hypotheticalPoints: hypotheticalPoints,
          activePlayersCount: activePlayersCount,
          competitionId: competition ? competition.id : null,
          statusType: 'default',
          maxParlays: 20,
          minToQualify: 1,
          competition: competition ? {
            prizeAmount: parseFloat(competition.prize_amount),
            isRollover: competition.is_rollover
          } : null
        }
      });
    }

    // Get comprehensive status
    const status = await competitionService.getUserCompetitionStatus(userId);

    // Get user's COMPETITION parlay count for this week (exclude practice)
    const competition = await competitionService.getCurrentCompetition();
    let parlayCount = 0;

    if (competition) {
      const parlayResult = await pool.query(
        `SELECT COUNT(*) as count 
         FROM user_parlays 
         WHERE user_id = $1 
         AND competition_id = $2
         AND (is_practice_parlay = FALSE OR is_practice_parlay IS NULL)`,
        [userId, competition.id]
      );
      parlayCount = parseInt(parlayResult.rows[0].count);
    }

    // Determine status type for banner display
    let statusType = 'default'; // Build for Fun (free tier or not opted in)
    const maxParlays = 20; // Maximum parlays per week
    const minToQualify = 1; // Minimum to qualify (changed from 3 to 1)

    if (status.isOptedIn && status.isCompetitionWindowOpen) {
      // User is opted in and window is open
      if (parlayCount >= maxParlays) {
        statusType = 'max_reached';
      } else if (parlayCount >= minToQualify) {
        statusType = 'qualified';
      } else {
        statusType = 'not_qualified';
      }
    }

    res.json({
      success: true,
      status: {
        ...status,
        parlayCount,
        competitionId: competition ? competition.id : null,
        statusType,
        maxParlays,
        minToQualify,
        competition: competition ? {
          prizeAmount: parseFloat(competition.prize_amount),
          isRollover: competition.is_rollover,
          totalParticipants: parseInt(competition.total_participants) || 0
        } : null
      }
    });

  } catch (error) {
    console.error('Error fetching competition status:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// ==========================================
// POST /api/competition/opt-in
// User opts into weekly competition
// ==========================================
router.post('/opt-in', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const result = await competitionService.optInToCompetition(userId);

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.json(result);

  } catch (error) {
    console.error('Error opting in:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// ==========================================
// POST /api/competition/opt-out
// User opts out of weekly competition
// ==========================================
router.post('/opt-out', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const result = await competitionService.optOutOfCompetition(userId);

    res.json(result);

  } catch (error) {
    console.error('Error opting out:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

export default router;
