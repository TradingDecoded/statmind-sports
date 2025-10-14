import express from "express";
import pool from "../config/database.js";
const router = express.Router();

// -----------------------------
// Health check route
// -----------------------------
router.get("/", (req, res) => {
  res.json({
    success: true,
    message: "StatMind Sports API is live",
    available_routes: [
      "/api/predictions/week/:season/:week",
      "/api/predictions/upcoming",
      "/api/predictions/accuracy/historical"
    ],
  });
});

// -----------------------------
// GET predictions for a specific week/season
// -----------------------------
router.get("/week/:season/:week", async (req, res) => {
  const { season, week } = req.params;

  try {
    const result = await pool.query(
      `
      SELECT 
        g.game_id AS "gameId",
        g.week,
        g.season,
        g.game_date AS "date",
        g.home_team AS "homeTeamKey",
        g.away_team AS "awayTeamKey",
        p.predicted_winner AS "predictedWinner",
        p.confidence,
        p.home_win_probability AS "homeWinProbability",
        p.away_win_probability AS "awayWinProbability",
        p.reasoning
      FROM predictions p
      JOIN games g ON p.game_id = g.game_id
      WHERE g.season = $1 AND g.week = $2
      ORDER BY g.game_date ASC
      `,
      [season, week]
    );

    res.json({ success: true, predictions: result.rows });
  } catch (error) {
    console.error("Error fetching predictions:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// -----------------------------
// GET upcoming predictions
// -----------------------------
router.get("/upcoming", async (req, res) => {
  try {
    const result = await pool.query(
      `
      SELECT 
        g.game_id AS "gameId",
        g.week,
        g.season,
        g.game_date AS "date",
        g.home_team AS "homeTeamKey",
        g.away_team AS "awayTeamKey",
        p.predicted_winner AS "predictedWinner",
        p.confidence,
        p.home_win_probability AS "homeWinProbability",
        p.away_win_probability AS "awayWinProbability",
        p.reasoning
      FROM predictions p
      JOIN games g ON p.game_id = g.game_id
      WHERE g.game_date >= NOW()
      ORDER BY g.game_date ASC
      LIMIT 10
      `
    );

    res.json({ success: true, predictions: result.rows });
  } catch (error) {
    console.error("Error fetching upcoming predictions:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// -----------------------------
// NEW: GET historical accuracy statistics
// -----------------------------
router.get("/accuracy/historical", async (req, res) => {
  try {
    // Overall accuracy across all seasons
    const overallResult = await pool.query(`
      SELECT 
        COUNT(*) as total_predictions,
        SUM(CASE WHEN pr.is_correct = true THEN 1 ELSE 0 END) as correct_predictions,
        ROUND(
          (SUM(CASE WHEN pr.is_correct = true THEN 1 ELSE 0 END)::numeric / 
          NULLIF(COUNT(*), 0)) * 100, 
          1
        ) as accuracy_percentage,
        MIN(g.season) as first_season,
        MAX(g.season) as latest_season,
        COUNT(DISTINCT g.season) as total_seasons
      FROM prediction_results pr
      JOIN games g ON pr.game_id = g.game_id
      WHERE pr.is_correct IS NOT NULL
    `);

    // Accuracy by season
    const bySeasonResult = await pool.query(`
      SELECT 
        g.season,
        COUNT(*) as total_predictions,
        SUM(CASE WHEN pr.is_correct = true THEN 1 ELSE 0 END) as correct_predictions,
        ROUND(
          (SUM(CASE WHEN pr.is_correct = true THEN 1 ELSE 0 END)::numeric / 
          NULLIF(COUNT(*), 0)) * 100, 
          1
        ) as accuracy_percentage
      FROM prediction_results pr
      JOIN games g ON pr.game_id = g.game_id
      WHERE pr.is_correct IS NOT NULL
      GROUP BY g.season
      ORDER BY g.season DESC
    `);

    // Accuracy by confidence level
    const byConfidenceResult = await pool.query(`
      SELECT 
        p.confidence,
        COUNT(*) as total_predictions,
        SUM(CASE WHEN pr.is_correct = true THEN 1 ELSE 0 END) as correct_predictions,
        ROUND(
          (SUM(CASE WHEN pr.is_correct = true THEN 1 ELSE 0 END)::numeric / 
          NULLIF(COUNT(*), 0)) * 100, 
          1
        ) as accuracy_percentage
      FROM prediction_results pr
      JOIN predictions p ON pr.game_id = p.game_id
      WHERE pr.is_correct IS NOT NULL
      GROUP BY p.confidence
      ORDER BY 
        CASE p.confidence
          WHEN 'High' THEN 1
          WHEN 'Medium' THEN 2
          WHEN 'Low' THEN 3
        END
    `);

    // Weekly breakdown for current season
    const currentSeason = new Date().getMonth() >= 8 ? new Date().getFullYear() : new Date().getFullYear() - 1;
    const weeklyResult = await pool.query(`
      SELECT 
        g.week,
        COUNT(*) as total_predictions,
        SUM(CASE WHEN pr.is_correct = true THEN 1 ELSE 0 END) as correct_predictions,
        ROUND(
          (SUM(CASE WHEN pr.is_correct = true THEN 1 ELSE 0 END)::numeric / 
          NULLIF(COUNT(*), 0)) * 100, 
          1
        ) as accuracy_percentage
      FROM prediction_results pr
      JOIN games g ON pr.game_id = g.game_id
      WHERE pr.is_correct IS NOT NULL AND g.season = $1
      GROUP BY g.week
      ORDER BY g.week ASC
    `, [currentSeason]);

    res.json({
      success: true,
      overall: overallResult.rows[0] || {},
      bySeason: bySeasonResult.rows || [],
      byConfidence: byConfidenceResult.rows || [],
      weeklyBreakdown: weeklyResult.rows || []
    });
  } catch (error) {
    console.error("Error fetching historical accuracy:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

export default router;