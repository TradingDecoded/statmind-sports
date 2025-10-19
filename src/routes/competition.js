// ============================================
// StatMind Sports - Competition Routes
// API endpoints for weekly competitions
// ============================================

import express from 'express';
import { requireAuth } from '../middleware/authMiddleware.js';
import competitionService from '../services/competitionService.js';

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

// Get user's current week competition status
router.get('/status', optionalAuth, async (req, res) => {
  try {
    const userId = req.user.id;

    // Get current year and week
    const now = new Date();
    const currentYear = now.getFullYear();
    const startOfYear = new Date(currentYear, 0, 1);
    const days = Math.floor((now - startOfYear) / (24 * 60 * 60 * 1000));
    const currentWeek = Math.ceil((days + startOfYear.getDay() + 1) / 7);

    // Get user membership info
    // If no user logged in, return free user status
    if (!userId) {
      return res.json({
        success: true,
        status: {
          parlayCount: 0,
          maxParlays: 10,
          parlaysRemaining: 10,
          minToQualify: 3,
          isQualified: false,
          canCreateMore: true,
          isPremiumOrVIP: false,
          membershipTier: 'free',
          smsBucks: 0,
          statusType: 'free_user',
          message: 'Free tier - build parlays for fun!',
          competition: null
        }
      });
    }
    const userQuery = await pool.query(
      'SELECT membership_tier, sms_bucks FROM users WHERE id = $1',
      [userId]
    );

    if (userQuery.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    const user = userQuery.rows[0];
    const isPremiumOrVIP = user.membership_tier === 'premium' || user.membership_tier === 'vip';

    // Get weekly parlay count
    const countQuery = await pool.query(
      `SELECT parlay_count 
       FROM weekly_parlay_counts 
       WHERE user_id = $1 AND year = $2 AND week_number = $3`,
      [userId, currentYear, currentWeek]
    );

    const parlayCount = countQuery.rows.length > 0 ? countQuery.rows[0].parlay_count : 0;

    // Get current competition info
    const competitionQuery = await pool.query(
      `SELECT id, prize_amount, start_date, end_date 
       FROM weekly_competitions 
       WHERE year = $1 AND week_number = $2 AND status = 'active'`,
      [currentYear, currentWeek]
    );

    const competition = competitionQuery.rows.length > 0 ? competitionQuery.rows[0] : null;

    // Calculate status
    let status = 'not_qualified';
    let message = '';
    let canCreateMore = true;
    let parlaysRemaining = 10 - parlayCount;

    if (!isPremiumOrVIP) {
      status = 'free_user';
      message = 'Free tier - build parlays for fun!';
    } else if (parlayCount >= 10) {
      status = 'max_reached';
      message = 'Weekly maximum reached!';
      canCreateMore = false;
      parlaysRemaining = 0;
    } else if (parlayCount >= 3) {
      status = 'qualified';
      message = `You're entered in the competition!`;
    } else {
      status = 'not_qualified';
      message = `Create ${3 - parlayCount} more to qualify`;
    }

    res.json({
      success: true,
      status: {
        parlayCount,
        maxParlays: 10,
        parlaysRemaining,
        minToQualify: 3,
        isQualified: parlayCount >= 3 && isPremiumOrVIP,
        canCreateMore,
        isPremiumOrVIP,
        membershipTier: user.membership_tier,
        smsBucks: user.sms_bucks,
        statusType: status,
        message,
        competition: competition ? {
          id: competition.id,
          prizeAmount: competition.prize_amount,
          startDate: competition.start_date,
          endDate: competition.end_date
        } : null
      }
    });

  } catch (error) {
    console.error('Error fetching competition status:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

export default router;
