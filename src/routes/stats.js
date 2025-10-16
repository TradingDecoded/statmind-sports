// src/routes/stats.js
import express from "express";
import pool from "../config/database.js";

const router = express.Router();

// -----------------------------
// GET homepage statistics (dynamic, real-time)
// -----------------------------
router.get("/homepage", async (req, res) => {
  try {
    // Get current season (2025 based on your setup)
    const currentSeason = 2025;

    // Query 1: Current Season Accuracy
    const currentSeasonQuery = await pool.query(`
      SELECT 
        COUNT(*) as total_games,
        COUNT(CASE WHEN pr.is_correct = true THEN 1 END) as correct_predictions,
        ROUND(
          (COUNT(CASE WHEN pr.is_correct = true THEN 1 END)::numeric / 
          NULLIF(COUNT(*), 0)) * 100, 
          1
        ) as accuracy_percentage
      FROM prediction_results pr
      JOIN games g ON pr.game_id = g.game_id
      WHERE pr.is_correct IS NOT NULL 
        AND g.season = $1
    `, [currentSeason]);

    // Query 2: Total Games Predicted (All Time)
    const totalGamesQuery = await pool.query(`
      SELECT COUNT(*) as total_predictions
      FROM predictions
    `);

    // Query 3: First Season with Data
    const firstSeasonQuery = await pool.query(`
      SELECT MIN(season) as first_season
      FROM games
      WHERE season IS NOT NULL
    `);

    // Query 4: Total Seasons with Data
    const totalSeasonsQuery = await pool.query(`
      SELECT COUNT(DISTINCT season) as total_seasons
      FROM games
      WHERE season IS NOT NULL
    `);

    // Query 5: Overall All-Time Accuracy
    const overallAccuracyQuery = await pool.query(`
      SELECT 
        COUNT(*) as total_verified,
        COUNT(CASE WHEN pr.is_correct = true THEN 1 END) as correct_predictions,
        ROUND(
          (COUNT(CASE WHEN pr.is_correct = true THEN 1 END)::numeric / 
          NULLIF(COUNT(*), 0)) * 100, 
          1
        ) as accuracy_percentage
      FROM prediction_results pr
      WHERE pr.is_correct IS NOT NULL
    `);

    // Extract results
    const currentSeasonStats = currentSeasonQuery.rows[0];  // ← RENAMED (was currentSeason)
    const totalGames = parseInt(totalGamesQuery.rows[0].total_predictions) || 0;
    const firstSeason = firstSeasonQuery.rows[0].first_season || 2024;
    const totalSeasons = parseInt(totalSeasonsQuery.rows[0].total_seasons) || 1;
    const overallAccuracy = overallAccuracyQuery.rows[0];

    // Determine which accuracy to show on homepage
    // If current season has at least 10 games, use current season accuracy
    // Otherwise, use overall all-time accuracy
    let displayAccuracy = 0;
    let accuracyLabel = "";
    const CURRENT_SEASON = 2025;  // ← Use this constant

    if (parseInt(currentSeasonStats.total_games) >= 10) {
      displayAccuracy = parseFloat(currentSeasonStats.accuracy_percentage) || 0;
      accuracyLabel = `${CURRENT_SEASON} Season Accuracy`;
    } else if (parseInt(overallAccuracy.total_verified) > 0) {
      displayAccuracy = parseFloat(overallAccuracy.accuracy_percentage) || 0;
      accuracyLabel = "Overall Accuracy";
    } else {
      // No verified predictions yet, show placeholder
      displayAccuracy = 0;
      accuracyLabel = "Accuracy Coming Soon";
    }

    // Return response
    res.json({
      success: true,
      stats: {
        // Main hero accuracy
        mainAccuracy: displayAccuracy,
        accuracyLabel: accuracyLabel,

        // Proven since year
        firstSeason: firstSeason,
        provenSinceText: `Proven Accuracy Since ${firstSeason}`,

        // Games predicted count
        gamesPredicted: totalGames,
        gamesPredictedText: `${totalGames.toLocaleString()}+ Games Predicted`,

        // Seasons tracked
        seasonsTracked: totalSeasons,
        seasonsTrackedText: `${totalSeasons}+ Season${totalSeasons > 1 ? 's' : ''} Tracked`,

        // Additional context
        currentSeasonGames: parseInt(currentSeasonStats.total_games) || 0,
        overallVerifiedGames: parseInt(overallAccuracy.total_verified) || 0,
        overallAccuracy: parseFloat(overallAccuracy.accuracy_percentage) || 0,  // ← ADD THIS LINE if missing

        // Last updated
        lastUpdated: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error("Error fetching homepage stats:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch homepage statistics",
      error: error.message
    });
  }
});

export default router;
