// ============================================
// StatMind Sports - Parlay Service
// Handles parlay creation, calculation, and management
// ============================================

import pool from '../config/database.js';

class ParlayService {

  // ==========================================
  // GET AVAILABLE GAMES FOR PARLAY
  // Returns games from specified week with AI predictions
  // ==========================================
  async getAvailableGames(season, week) {
    try {
      const result = await pool.query(
        `SELECT 
          g.id,
          g.season,
          g.week,
          g.game_date,
          g.home_team,
          g.away_team,
          g.home_score,
          g.away_score,
          g.is_final,
          p.predicted_winner,
          p.confidence as confidence_level,
          p.home_win_probability,
          p.away_win_probability
        FROM games g
        LEFT JOIN predictions p ON g.game_id = p.game_id
        WHERE g.season = $1 AND g.week = $2
        ORDER BY g.game_date ASC`,
        [season, week]
      );

      // Add calculated win_probability field based on predicted winner
      const gamesWithProbability = result.rows.map(game => ({
        ...game,
        win_probability: game.predicted_winner === game.home_team
          ? parseFloat(game.home_win_probability)
          : parseFloat(game.away_win_probability)
      }));

      return gamesWithProbability;
    } catch (error) {
      console.error('Get available games error:', error);
      throw error;
    }
  }

  // ==========================================
  // CALCULATE PARLAY PROBABILITY
  // Calculates combined probability for selected picks
  // ==========================================
  calculateParlayProbability(games) {
    try {
      // Validate input
      if (!games || games.length === 0) {
        return {
          combinedProbability: 0,
          riskLevel: 'Unknown',
          individualProbabilities: [],
          legCount: 0
        };
      }

      // Get individual probabilities
      const probabilities = games.map(game => {
        // Ensure win_probability exists and is a number
        let prob = parseFloat(game.win_probability);

        // If it's already a decimal (0-1), use as-is
        // If it's a percentage (1-100), convert to decimal
        if (prob > 1) {
          prob = prob / 100;
        }

        // Ensure it's a valid number between 0 and 1
        if (isNaN(prob) || prob < 0 || prob > 1) {
          console.error('Invalid probability:', game.win_probability);
          prob = 0.5; // Default to 50% if invalid
        }

        return prob;
      });

      // Calculate combined probability (multiply all together)
      const combinedProbability = probabilities.reduce(
        (acc, prob) => acc * prob,
        1
      );

      // Ensure result is valid
      const finalProb = isNaN(combinedProbability) ? 0 : combinedProbability;

      // Determine risk level
      let riskLevel;
      if (finalProb >= 0.5) {
        riskLevel = 'Low';
      } else if (finalProb >= 0.3) {
        riskLevel = 'Medium';
      } else {
        riskLevel = 'High';
      }

      return {
        combinedProbability: (finalProb * 100).toFixed(1), // Convert to percentage
        riskLevel,
        individualProbabilities: probabilities.map(p => (p * 100).toFixed(1)),
        legCount: games.length
      };
    } catch (error) {
      console.error('Calculate probability error:', error);
      return {
        combinedProbability: 0,
        riskLevel: 'Unknown',
        individualProbabilities: [],
        legCount: games.length
      };
    }
  }

  // ==========================================
  // CREATE NEW PARLAY
  // Saves a user's parlay to the database
  // ==========================================
  async createParlay(userId, parlayData) {
    try {
      const { parlayName, season, week, games } = parlayData;

      // Calculate probability
      const calculation = this.calculateParlayProbability(games);

      // Prepare games data for JSON storage
      const gamesJson = games.map(game => ({
        game_id: game.game_id,
        home_team: game.home_team,
        away_team: game.away_team,
        picked_winner: game.picked_winner,
        ai_winner: game.ai_winner,
        ai_probability: game.ai_probability
      }));

      // Insert parlay
      const result = await pool.query(
        `INSERT INTO user_parlays 
        (user_id, parlay_name, season, week, leg_count, games, 
         combined_ai_probability, risk_level)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING *`,
        [
          userId,
          parlayName,
          season,
          week,
          games.length,
          JSON.stringify(gamesJson),
          calculation.combinedProbability,
          calculation.riskLevel
        ]
      );

      // Update user stats
      await pool.query(
        `UPDATE user_stats 
        SET total_parlays = total_parlays + 1,
            pending_parlays = pending_parlays + 1,
            total_legs_picked = total_legs_picked + $2
        WHERE user_id = $1`,
        [userId, games.length]
      );

      console.log(`✅ Parlay created by user ${userId}: ${parlayName}`);

      return {
        success: true,
        parlay: result.rows[0],
        calculation
      };

    } catch (error) {
      console.error('Create parlay error:', error);
      throw error;
    }
  }

  // ==========================================
  // GET USER'S PARLAYS
  // Returns all parlays for a specific user
  // ==========================================
  async getUserParlays(userId, filters = {}) {
    try {
      const { season, status } = filters;

      let query = `
        SELECT * FROM user_parlays
        WHERE user_id = $1
      `;
      const params = [userId];

      // Add season filter if provided
      if (season) {
        query += ` AND season = $${params.length + 1}`;
        params.push(season);
      }

      // Add status filter if provided
      if (status === 'won') {
        query += ` AND is_hit = true`;
      } else if (status === 'lost') {
        query += ` AND is_hit = false`;
      } else if (status === 'pending') {
        query += ` AND is_hit IS NULL`;
      }

      query += ` ORDER BY created_at DESC`;

      const result = await pool.query(query, params);

      return result.rows;
    } catch (error) {
      console.error('Get user parlays error:', error);
      throw error;
    }
  }

  // ==========================================
  // GET SINGLE PARLAY BY ID
  // Returns detailed information for one parlay
  // ==========================================
  async getParlayById(parlayId, userId) {
    try {
      const result = await pool.query(
        `SELECT * FROM user_parlays
        WHERE id = $1 AND user_id = $2`,
        [parlayId, userId]
      );

      if (result.rows.length === 0) {
        throw new Error('Parlay not found');
      }

      return result.rows[0];
    } catch (error) {
      console.error('Get parlay error:', error);
      throw error;
    }
  }

  // ==========================================
  // DELETE PARLAY
  // Removes a parlay (only if not resolved)
  // ==========================================
  async deleteParlay(parlayId, userId) {
    try {
      // Check if parlay exists and belongs to user
      const checkResult = await pool.query(
        `SELECT is_hit FROM user_parlays
        WHERE id = $1 AND user_id = $2`,
        [parlayId, userId]
      );

      if (checkResult.rows.length === 0) {
        throw new Error('Parlay not found');
      }

      if (checkResult.rows[0].is_hit !== null) {
        throw new Error('Cannot delete resolved parlay');
      }

      // Delete the parlay
      await pool.query(
        'DELETE FROM user_parlays WHERE id = $1',
        [parlayId]
      );

      // Update user stats
      await pool.query(
        `UPDATE user_stats 
        SET total_parlays = total_parlays - 1,
            pending_parlays = pending_parlays - 1
        WHERE user_id = $1`,
        [userId]
      );

      console.log(`✅ Parlay ${parlayId} deleted by user ${userId}`);

      return { success: true };
    } catch (error) {
      console.error('Delete parlay error:', error);
      throw error;
    }
  }
}

export default new ParlayService();
