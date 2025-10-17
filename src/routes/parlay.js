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

    // Calculate current week dynamically
const now = new Date();
const currentYear = now.getFullYear();
const currentMonth = now.getMonth(); // 0-11

// NFL season logic: September (8) through February (1)
let calculatedSeason = currentMonth >= 8 ? currentYear : currentYear;
let calculatedWeek = 7; // Default fallback

// Simple week calculation (you can refine this)
if (currentMonth === 9) { // October
  const day = now.getDate();
  calculatedWeek = Math.ceil((day + 7) / 7); // Rough estimate
}

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
// Delete a parlay permanently
// ==========================================
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const parlayId = req.params.id;
    const userId = req.user.id;
    
    console.log(`🗑️  Delete request for parlay ${parlayId} by user ${userId}`);
    
    // Make sure parlay belongs to this user
    const checkResult = await pool.query(
      'SELECT user_id, is_hit FROM user_parlays WHERE id = $1',
      [parlayId]
    );
    
    if (checkResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Parlay not found'
      });
    }
    
    if (checkResult.rows[0].user_id !== userId) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to delete this parlay'
      });
    }
    
    const parlayStatus = checkResult.rows[0].is_hit;
    
    // Delete the parlay
    await pool.query('DELETE FROM user_parlays WHERE id = $1', [parlayId]);
    
    // Update user stats based on parlay status
    if (parlayStatus === null) {
      // Was pending
      await pool.query(
        `UPDATE user_stats 
         SET total_parlays = GREATEST(0, total_parlays - 1),
             pending_parlays = GREATEST(0, pending_parlays - 1)
         WHERE user_id = $1`,
        [userId]
      );
    } else if (parlayStatus === true) {
      // Was a win
      await pool.query(
        `UPDATE user_stats 
         SET total_parlays = GREATEST(0, total_parlays - 1),
             total_wins = GREATEST(0, total_wins - 1)
         WHERE user_id = $1`,
        [userId]
      );
    } else {
      // Was a loss
      await pool.query(
        `UPDATE user_stats 
         SET total_parlays = GREATEST(0, total_parlays - 1),
             total_losses = GREATEST(0, total_losses - 1)
         WHERE user_id = $1`,
        [userId]
      );
    }
    
    // Recalculate win rate
    await pool.query(
      `UPDATE user_stats 
       SET win_rate = CASE 
         WHEN (total_wins + total_losses) > 0 
         THEN ROUND((total_wins::DECIMAL / (total_wins + total_losses)) * 100, 2)
         ELSE 0 
       END
       WHERE user_id = $1`,
      [userId]
    );
    
    console.log(`✅ Deleted parlay ${parlayId} for user ${userId}`);
    
    res.json({
      success: true,
      message: 'Parlay deleted successfully'
    });
    
  } catch (error) {
    console.error('❌ Delete parlay error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete parlay'
    });
  }
});

export default router;
