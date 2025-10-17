// ============================================
// StatMind Sports - Leaderboard Routes
// API endpoints for leaderboard data
// ============================================

import express from 'express';
import leaderboardService from '../services/leaderboardService.js';
import { requireAuth, optionalAuth } from '../middleware/authMiddleware.js';

const router = express.Router();

// ==========================================
// GET /api/leaderboard/overall
// Get overall leaderboard (top 100)
// ==========================================
router.get('/overall', optionalAuth, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 100;
    const page = parseInt(req.query.page) || 1;
    
    const data = await leaderboardService.getOverallLeaderboard(limit, page);
    
    // If user is logged in, get their rank too
    let myRank = null;
    if (req.user) {
      const rankData = await leaderboardService.getUserRank(req.user.id);
      myRank = rankData.overall_rank;
    }
    
    res.json({
      success: true,
      ...data,
      my_rank: myRank
    });
    
  } catch (error) {
    console.error('Get overall leaderboard error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch leaderboard'
    });
  }
});

// ==========================================
// GET /api/leaderboard/weekly
// Get weekly leaderboard
// ==========================================
router.get('/weekly', optionalAuth, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 100;
    
    const data = await leaderboardService.getWeeklyLeaderboard(limit);
    
    // If user is logged in, get their rank too
    let myRank = null;
    if (req.user) {
      const rankData = await leaderboardService.getUserRank(req.user.id);
      myRank = rankData.weekly_rank;
    }
    
    res.json({
      success: true,
      ...data,
      my_rank: myRank
    });
    
  } catch (error) {
    console.error('Get weekly leaderboard error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch weekly leaderboard'
    });
  }
});

// ==========================================
// GET /api/leaderboard/my-rank
// Get current user's rank (requires login)
// ==========================================
router.get('/my-rank', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    
    const rankData = await leaderboardService.getUserRank(userId);
    
    res.json({
      success: true,
      ...rankData
    });
    
  } catch (error) {
    console.error('Get user rank error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch rank'
    });
  }
});

// ==========================================
// GET /api/leaderboard/stats
// Get overall platform statistics
// ==========================================
router.get('/stats', async (req, res) => {
  try {
    const stats = await leaderboardService.getLeaderboardStats();
    
    res.json({
      success: true,
      stats
    });
    
  } catch (error) {
    console.error('Get leaderboard stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch stats'
    });
  }
});

export default router;
