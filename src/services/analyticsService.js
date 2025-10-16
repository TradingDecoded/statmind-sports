// src/services/analyticsService.js
import pool from '../config/database.js';

class AnalyticsService {
  
  // Get overall accuracy statistics for 2025 season
  async getOverallStats() {
    const query = `
      SELECT 
        COUNT(*) as total_predictions,
        SUM(CASE WHEN pr.is_correct THEN 1 ELSE 0 END) as correct_predictions,
        ROUND(AVG(CASE WHEN pr.is_correct THEN 100 ELSE 0 END), 1) as accuracy_percentage,
        MIN(g.week) as first_week,
        MAX(g.week) as last_week,
        MIN(g.season) as season
      FROM prediction_results pr
      JOIN games g ON pr.game_id = g.game_id
      WHERE g.season = 2025
    `;
    
    const result = await pool.query(query);
    return result.rows[0];
  }

  // Get accuracy by confidence level
  async getAccuracyByConfidence() {
    const query = `
      SELECT 
        COALESCE(p.confidence, 'Unknown') as confidence_level,
        COUNT(*) as total_predictions,
        SUM(CASE WHEN pr.is_correct THEN 1 ELSE 0 END) as correct_predictions,
        ROUND(AVG(CASE WHEN pr.is_correct THEN 100 ELSE 0 END), 1) as accuracy_percentage
      FROM prediction_results pr
      JOIN games g ON pr.game_id = g.game_id
      LEFT JOIN predictions p ON pr.game_id = p.game_id
      WHERE g.season = 2025
      GROUP BY p.confidence
      ORDER BY 
        CASE 
          WHEN p.confidence = 'High' THEN 1
          WHEN p.confidence = 'Medium' THEN 2
          WHEN p.confidence = 'Low' THEN 3
          ELSE 4
        END
    `;
    
    const result = await pool.query(query);
    return result.rows;
  }

  // Get weekly accuracy trend
  async getWeeklyAccuracy() {
    const query = `
      SELECT 
        g.week,
        COUNT(*) as total_predictions,
        SUM(CASE WHEN pr.is_correct THEN 1 ELSE 0 END) as correct_predictions,
        ROUND(AVG(CASE WHEN pr.is_correct THEN 100 ELSE 0 END), 1) as accuracy_percentage
      FROM prediction_results pr
      JOIN games g ON pr.game_id = g.game_id
      WHERE g.season = 2025
      GROUP BY g.week
      ORDER BY g.week ASC
    `;
    
    const result = await pool.query(query);
    return result.rows;
  }

  // Get most predictable teams (teams we predict correctly most often)
  async getMostPredictableTeams(limit = 5) {
    const query = `
      SELECT 
        team_name,
        COUNT(*) as total_predictions,
        SUM(CASE WHEN is_correct THEN 1 ELSE 0 END) as correct_predictions,
        ROUND(AVG(CASE WHEN is_correct THEN 100 ELSE 0 END), 1) as accuracy_percentage
      FROM (
        SELECT 
          g.home_team as team_name,
          pr.is_correct
        FROM prediction_results pr
        JOIN games g ON pr.game_id = g.game_id
        WHERE g.season = 2025 AND pr.predicted_winner = g.home_team
        UNION ALL
        SELECT 
          g.away_team as team_name,
          pr.is_correct
        FROM prediction_results pr
        JOIN games g ON pr.game_id = g.game_id
        WHERE g.season = 2025 AND pr.predicted_winner = g.away_team
      ) team_predictions
      GROUP BY team_name
      HAVING COUNT(*) >= 3
      ORDER BY accuracy_percentage DESC, total_predictions DESC
      LIMIT $1
    `;
    
    const result = await pool.query(query, [limit]);
    return result.rows;
  }

  // Get least predictable teams (hardest to predict)
  async getLeastPredictableTeams(limit = 5) {
    const query = `
      SELECT 
        team_name,
        COUNT(*) as total_predictions,
        SUM(CASE WHEN is_correct THEN 1 ELSE 0 END) as correct_predictions,
        ROUND(AVG(CASE WHEN is_correct THEN 100 ELSE 0 END), 1) as accuracy_percentage
      FROM (
        SELECT 
          g.home_team as team_name,
          pr.is_correct
        FROM prediction_results pr
        JOIN games g ON pr.game_id = g.game_id
        WHERE g.season = 2025 AND pr.predicted_winner = g.home_team
        UNION ALL
        SELECT 
          g.away_team as team_name,
          pr.is_correct
        FROM prediction_results pr
        JOIN games g ON pr.game_id = g.game_id
        WHERE g.season = 2025 AND pr.predicted_winner = g.away_team
      ) team_predictions
      GROUP BY team_name
      HAVING COUNT(*) >= 3
      ORDER BY accuracy_percentage ASC, total_predictions DESC
      LIMIT $1
    `;
    
    const result = await pool.query(query, [limit]);
    return result.rows;
  }

  // Get biggest upsets (high probability favorites that lost)
  async getBiggestUpsets(limit = 10) {
    const query = `
      SELECT 
        g.week,
        g.home_team,
        g.away_team,
        g.home_score,
        g.away_score,
        pr.predicted_winner,
        GREATEST(p.home_win_probability, p.away_win_probability) as win_probability,
        pr.actual_winner,
        g.game_date
      FROM prediction_results pr
      JOIN games g ON pr.game_id = g.game_id
      JOIN predictions p ON pr.game_id = p.game_id
      WHERE g.season = 2025
        AND pr.is_correct = FALSE
        AND GREATEST(p.home_win_probability, p.away_win_probability) >= 70
      ORDER BY GREATEST(p.home_win_probability, p.away_win_probability) DESC
      LIMIT $1
    `;
    
    const result = await pool.query(query, [limit]);
    return result.rows;
  }

  // Get current Elo ratings leaderboard (2025 season)
  async getEloLeaderboard() {
    const query = `
      SELECT 
        team_key,
        elo_rating,
        wins,
        losses,
        ROUND(
          CASE 
            WHEN (wins + losses) = 0 THEN 0 
            ELSE (wins::numeric / (wins + losses)) * 100 
          END, 
        1) as win_percentage
      FROM team_statistics
      ORDER BY elo_rating DESC
    `;
    
    const result = await pool.query(query);
    return result.rows;
  }
}

export default new AnalyticsService();
