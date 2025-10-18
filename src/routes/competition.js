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

export default router;
