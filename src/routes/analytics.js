// src/routes/analytics.js
import express from 'express';
import analyticsService from '../services/analyticsService.js';

const router = express.Router();

// Get all analytics data in one endpoint
router.get('/dashboard', async (req, res) => {
  try {
    const [
      overallStats,
      confidenceStats,
      weeklyAccuracy,
      mostPredictable,
      leastPredictable,
      biggestUpsets,
      eloLeaderboard
    ] = await Promise.all([
      analyticsService.getOverallStats(),
      analyticsService.getAccuracyByConfidence(),
      analyticsService.getWeeklyAccuracy(),
      analyticsService.getMostPredictableTeams(5),
      analyticsService.getLeastPredictableTeams(5),
      analyticsService.getBiggestUpsets(10),
      analyticsService.getEloLeaderboard()
    ]);

    res.json({
      overall: overallStats,
      byConfidence: confidenceStats,
      weeklyTrend: weeklyAccuracy,
      mostPredictable,
      leastPredictable,
      upsets: biggestUpsets,
      eloRatings: eloLeaderboard
    });
  } catch (error) {
    console.error('Analytics dashboard error:', error);
    res.status(500).json({ error: 'Failed to fetch analytics data' });
  }
});

// Individual endpoints
router.get('/overall', async (req, res) => {
  try {
    const stats = await analyticsService.getOverallStats();
    res.json(stats);
  } catch (error) {
    console.error('Overall stats error:', error);
    res.status(500).json({ error: 'Failed to fetch overall stats' });
  }
});

router.get('/confidence', async (req, res) => {
  try {
    const stats = await analyticsService.getAccuracyByConfidence();
    res.json(stats);
  } catch (error) {
    console.error('Confidence stats error:', error);
    res.status(500).json({ error: 'Failed to fetch confidence stats' });
  }
});

router.get('/weekly', async (req, res) => {
  try {
    const stats = await analyticsService.getWeeklyAccuracy();
    res.json(stats);
  } catch (error) {
    console.error('Weekly stats error:', error);
    res.status(500).json({ error: 'Failed to fetch weekly stats' });
  }
});

router.get('/upsets', async (req, res) => {
  try {
    const upsets = await analyticsService.getBiggestUpsets(10);
    res.json(upsets);
  } catch (error) {
    console.error('Upsets error:', error);
    res.status(500).json({ error: 'Failed to fetch upsets' });
  }
});

router.get('/elo', async (req, res) => {
  try {
    const ratings = await analyticsService.getEloLeaderboard();
    res.json(ratings);
  } catch (error) {
    console.error('Elo ratings error:', error);
    res.status(500).json({ error: 'Failed to fetch Elo ratings' });
  }
});

export default router;