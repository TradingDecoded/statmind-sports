// ============================================
// StatMind Sports - Parlay Routes
// API endpoints for parlay functionality
// ============================================

import express from 'express';
import { body, validationResult } from 'express-validator';
import parlayService from '../services/parlayService.js';
import { requireAuth } from '../middleware/authMiddleware.js';

const router = express.Router();

// ==========================================
// GET /api/parlay/available-games
// Get games available for parlay creation
// ==========================================
router.get('/available-games', requireAuth, async (req, res) => {
  try {
    const { season, week } = req.query;

    // Use current season/week if not provided
    const currentSeason = season ? parseInt(season) : 2025;
    const currentWeek = week ? parseInt(week) : 7; // Default to week 7

    const games = await parlayService.getAvailableGames(
      currentSeason,
      currentWeek
    );

    res.json({
      success: true,
      games,
      count: games.length
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

    if (!games || games.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Games array is required'
      });
    }

    const calculation = parlayService.calculateParlayProbability(games);

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
// Delete a pending parlay
// ==========================================
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const parlayId = parseInt(req.params.id);
    const userId = req.user.id;

    const result = await parlayService.deleteParlay(parlayId, userId);

    res.json(result);

  } catch (error) {
    console.error('Delete parlay error:', error);
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

export default router;
