import express from "express";
import pool from "../config/database.js"; // ✅ ensure this matches your DB config
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
      "/api/predictions/upcoming"
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
// NEW: GET upcoming predictions
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

export default router;
