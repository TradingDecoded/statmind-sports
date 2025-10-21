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

    // Get comprehensive status
    const status = await competitionService.getUserCompetitionStatus(userId);

    // Get user's parlay count for this week
    const competition = await competitionService.getCurrentCompetition();
    let parlayCount = 0;

    if (competition) {
      const parlayResult = await pool.query(
        `SELECT COUNT(*) as count 
         FROM user_parlays 
         WHERE user_id = $1 
         AND competition_id = $2
         AND is_practice_parlay = FALSE`,
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
        statusType, // NEW: Add statusType for banner
        maxParlays,
        minToQualify,
        competition: competition ? {
          prizeAmount: parseFloat(competition.prize_amount),
          isRollover: competition.is_rollover
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
