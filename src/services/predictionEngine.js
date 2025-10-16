// src/services/predictionEngine.js
import pool from '../config/database.js';
import aiReasoningService from './aiReasoningService.js';

class PredictionEngine {
  constructor() {
    // Default weights (will be loaded from database)
    this.weights = {
      elo: 0.35,
      power: 0.15,
      situational: 0.25,
      matchup: 0.20,
      recentForm: 0.05
    };

    // Load weights from database on startup
    this.loadWeights();
  }

  /**
   * Load current weights from database
   */
  async loadWeights() {
    try {
      const result = await pool.query('SELECT weight_name, weight_value FROM prediction_weights');

      if (result.rows.length > 0) {
        result.rows.forEach(row => {
          this.weights[row.weight_name] = parseFloat(row.weight_value);
        });
        console.log('✅ Loaded weights from database:', this.weights);
      }
    } catch (error) {
      console.error('⚠️  Failed to load weights from database, using defaults:', error.message);
    }
  }

  /**
   * Reload weights from database (call this after updating weights)
   */
  async reloadWeights() {
    await this.loadWeights();
  }

  /**
   * Main method to analyze a matchup and generate prediction
   */
  async analyzeMatchup(game) {
    try {
      const { home_team, away_team, game_id } = game;

      // Fetch team statistics
      const homeStats = await this.getTeamStats(home_team);
      const awayStats = await this.getTeamStats(away_team);

      if (!homeStats || !awayStats) {
        throw new Error(`Missing stats for ${home_team} or ${away_team}`);
      }

      // Calculate all 5 components
      const eloScore = this.calculateEloScore(homeStats, awayStats);
      const powerScore = this.calculatePowerScore(homeStats, awayStats);
      const situationalScore = this.calculateSituationalScore(homeStats, awayStats);
      const matchupScore = this.calculateMatchupScore(homeStats, awayStats);
      const recentFormScore = this.calculateRecentFormScore(homeStats, awayStats);

      // Calculate weighted total score
      const totalScore =
        (eloScore * this.weights.elo) +
        (powerScore * this.weights.power) +
        (situationalScore * this.weights.situational) +
        (matchupScore * this.weights.matchup) +
        (recentFormScore * this.weights.recentForm);

      // Convert to win probabilities
      const homeWinProb = this.scoreToProbability(totalScore);
      const awayWinProb = 1 - homeWinProb;

      // Determine predicted winner and confidence
      const predictedWinner = homeWinProb > 0.5 ? home_team : away_team;
      const winnerProb = Math.max(homeWinProb, awayWinProb);
      const confidence = this.determineConfidence(winnerProb);

      // Generate AI-powered reasoning
      const reasoning = await aiReasoningService.generateReasoning({
        home_team,
        away_team,
        predicted_winner: predictedWinner,
        home_win_probability: homeWinProb,
        away_win_probability: awayWinProb,
        eloScore,
        powerScore,
        situationalScore,
        matchupScore,
        recentFormScore,
        homeStats,
        awayStats,
        confidence
      });

      return {
        game_id,
        predicted_winner: predictedWinner,
        home_win_probability: homeWinProb,
        away_win_probability: awayWinProb,
        confidence,
        reasoning,
        elo_score: eloScore,
        power_score: powerScore,
        situational_score: situationalScore,
        matchup_score: matchupScore,
        recent_form_score: recentFormScore
      };
    } catch (error) {
      console.error(`Error analyzing matchup for game ${game.game_id}:`, error);
      throw error;
    }
  }

  /**
   * Component 1: Elo Score (35% weight)
   * Range: -50 to +50 (positive favors home team)
   */
  calculateEloScore(homeStats, awayStats) {
    const eloDifference = homeStats.elo_rating - awayStats.elo_rating;
    const eloScore = Math.max(-50, Math.min(50, eloDifference / 20));
    return eloScore;
  }

  /**
   * Component 2: Power Score (15% weight)
   * Range: -50 to +50
   */
  calculatePowerScore(homeStats, awayStats) {
    // Home team's combined power (offense + adjusted defense)
    const homePower = (homeStats.offensive_rating + (100 - awayStats.defensive_rating)) / 2;

    // Away team's combined power
    const awayPower = (awayStats.offensive_rating + (100 - homeStats.defensive_rating)) / 2;

    // Convert to -50 to +50 scale
    const powerScore = ((homePower - awayPower) / 100) * 50;
    return Math.max(-50, Math.min(50, powerScore));
  }

  /**
   * Component 3: Situational Score (25% weight)
   * Range: -30 to +30 (home field advantage emphasis)
   */
  calculateSituationalScore(homeStats, awayStats) {
    const homeWinRate = homeStats.home_wins / Math.max(homeStats.home_games, 1);
    const awayWinRate = awayStats.away_wins / Math.max(awayStats.away_games, 1);

    const situationalScore = (homeWinRate - awayWinRate) * 30;
    return Math.max(-30, Math.min(30, situationalScore));
  }

  /**
   * Component 4: Matchup Score (20% weight)
   * Range: -40 to +40
   */
  calculateMatchupScore(homeStats, awayStats) {
    // Home offense vs Away defense
    const homeOffenseAdvantage = homeStats.offensive_rating - awayStats.defensive_rating;

    // Away offense vs Home defense
    const awayOffenseAdvantage = awayStats.offensive_rating - homeStats.defensive_rating;

    // Net advantage for home team
    const matchupScore = (homeOffenseAdvantage - awayOffenseAdvantage) / 5;
    return Math.max(-40, Math.min(40, matchupScore));
  }

  /**
   * Component 5: Recent Form Score (5% weight)
   * Range: -50 to +50
   */
  calculateRecentFormScore(homeStats, awayStats) {
    const homeWinRate = homeStats.wins / Math.max(homeStats.total_games, 1);
    const awayWinRate = awayStats.wins / Math.max(awayStats.total_games, 1);

    const recentFormScore = (homeWinRate - awayWinRate) * 50;
    return Math.max(-50, Math.min(50, recentFormScore));
  }

  /**
   * Convert composite score to win probability
   * Uses logistic function for smooth probability curve
   */
  scoreToProbability(score) {
    // Normalize score (typical range is -30 to +30 after weighting)
    const normalizedScore = score / 15;

    // Logistic function: 1 / (1 + e^(-score))
    const probability = 1 / (1 + Math.exp(-normalizedScore));

    return Math.max(0, Math.min(1, probability));
  }

  /**
 * Determine confidence level based on win probability
 * RECALIBRATED: Stricter thresholds for better accuracy correlation
 */
  determineConfidence(probability) {
    if (probability >= 0.70) return 'High';    // 70%+ = High Confidence
    if (probability >= 0.60) return 'Medium';  // 60-69% = Medium Confidence
    return 'Low';                               // <60% = Low Confidence
  }

  /**
   * Generate human-readable reasoning for the prediction
   */
  generateReasoning(data) {
    const {
      home_team,
      away_team,
      eloScore,
      powerScore,
      situationalScore,
      matchupScore,
      recentFormScore,
      homeWinProb
    } = data;

    const favored = homeWinProb > 0.5 ? home_team : away_team;
    const probability = Math.round(Math.max(homeWinProb, 1 - homeWinProb) * 100);

    let reasoning = `${favored} favored with ${probability}% win probability. `;

    // Identify strongest factors
    const factors = [
      { name: 'Elo advantage', score: Math.abs(eloScore), favorable: eloScore > 0 === homeWinProb > 0.5 },
      { name: 'Power rating edge', score: Math.abs(powerScore), favorable: powerScore > 0 === homeWinProb > 0.5 },
      { name: 'Home field advantage', score: Math.abs(situationalScore), favorable: situationalScore > 0 },
      { name: 'Matchup superiority', score: Math.abs(matchupScore), favorable: matchupScore > 0 === homeWinProb > 0.5 },
      { name: 'Recent form momentum', score: Math.abs(recentFormScore), favorable: recentFormScore > 0 === homeWinProb > 0.5 }
    ];

    // Sort by impact
    factors.sort((a, b) => b.score - a.score);

    // Add top 2 positive factors
    const topFactors = factors.filter(f => f.favorable).slice(0, 2);
    if (topFactors.length > 0) {
      reasoning += 'Key factors: ' + topFactors.map(f => f.name).join(', ') + '.';
    }

    return reasoning;
  }

  /**
   * Fetch team statistics from database
   */
  async getTeamStats(teamKey) {
    try {
      const query = `
        SELECT 
          team_key,
          elo_rating,
          offensive_rating,
          defensive_rating,
          wins,
          losses,
          home_wins,
          home_losses,
          away_wins,
          away_losses,
          (wins + losses) as total_games,
          (home_wins + home_losses) as home_games,
          (away_wins + away_losses) as away_games
        FROM team_statistics
        WHERE team_key = $1
        LIMIT 1
      `;

      const result = await pool.query(query, [teamKey]);

      if (result.rows.length === 0) {
        console.warn(`No stats found for team: ${teamKey}`);
        return null;
      }

      // Convert string values to numbers
      const stats = result.rows[0];
      return {
        team_key: stats.team_key,
        elo_rating: parseFloat(stats.elo_rating) || 1500,
        offensive_rating: parseFloat(stats.offensive_rating) || 50,
        defensive_rating: parseFloat(stats.defensive_rating) || 50,
        wins: parseInt(stats.wins) || 0,
        losses: parseInt(stats.losses) || 0,
        home_wins: parseInt(stats.home_wins) || 0,
        home_losses: parseInt(stats.home_losses) || 0,
        away_wins: parseInt(stats.away_wins) || 0,
        away_losses: parseInt(stats.away_losses) || 0,
        total_games: parseInt(stats.total_games) || 0,
        home_games: parseInt(stats.home_games) || 0,
        away_games: parseInt(stats.away_games) || 0
      };
    } catch (error) {
      console.error(`Error fetching stats for ${teamKey}:`, error);
      throw error;
    }
  }

  /**
   * Save prediction to database
   */
  async savePrediction(prediction) {
    try {
      const query = `
        INSERT INTO predictions (
          game_id,
          predicted_winner,
          home_win_probability,
          away_win_probability,
          confidence,
          reasoning,
          elo_score,
          power_score,
          situational_score,
          matchup_score,
          recent_form_score
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        ON CONFLICT (game_id) 
        DO UPDATE SET
          predicted_winner = EXCLUDED.predicted_winner,
          home_win_probability = EXCLUDED.home_win_probability,
          away_win_probability = EXCLUDED.away_win_probability,
          confidence = EXCLUDED.confidence,
          reasoning = EXCLUDED.reasoning,
          elo_score = EXCLUDED.elo_score,
          power_score = EXCLUDED.power_score,
          situational_score = EXCLUDED.situational_score,
          matchup_score = EXCLUDED.matchup_score,
          recent_form_score = EXCLUDED.recent_form_score,
          created_at = CURRENT_TIMESTAMP
        RETURNING *
      `;

      const values = [
        prediction.game_id,
        prediction.predicted_winner,
        prediction.home_win_probability,
        prediction.away_win_probability,
        prediction.confidence,
        prediction.reasoning,
        prediction.elo_score,
        prediction.power_score,
        prediction.situational_score,
        prediction.matchup_score,
        prediction.recent_form_score
      ];

      const result = await pool.query(query, values);
      return result.rows[0];
    } catch (error) {
      console.error('Error saving prediction:', error);
      throw error;
    }
  }

  /**
   * Generate prediction for a SINGLE game with optional injury context
   * This is used when regenerating after an injury is detected
   */
  async generateSingleGamePrediction(game, injuryContext = null) {
    try {
      const { home_team, away_team, game_id } = game;

      console.log(`\n🎯 Generating single-game prediction: ${away_team} @ ${home_team}`);
      if (injuryContext) {
        console.log(`   📋 Injury context: ${injuryContext.playerName} (${injuryContext.position}) OUT`);
      }

      // Fetch team statistics
      const homeStats = await this.getTeamStats(home_team);
      const awayStats = await this.getTeamStats(away_team);

      if (!homeStats || !awayStats) {
        throw new Error(`Missing stats for ${home_team} or ${away_team}`);
      }

      // Calculate all 5 components (same as before)
      const eloScore = this.calculateEloScore(homeStats, awayStats);
      const powerScore = this.calculatePowerScore(homeStats, awayStats);
      const situationalScore = this.calculateSituationalScore(homeStats, awayStats);
      const matchupScore = this.calculateMatchupScore(homeStats, awayStats);
      const recentFormScore = this.calculateRecentFormScore(homeStats, awayStats);

      // Calculate weighted total score
      const totalScore =
        (eloScore * this.weights.elo) +
        (powerScore * this.weights.power) +
        (situationalScore * this.weights.situational) +
        (matchupScore * this.weights.matchup) +
        (recentFormScore * this.weights.recentForm);

      // Convert to win probabilities
      let homeWinProb = this.scoreToProbability(totalScore);
      let awayWinProb = 1 - homeWinProb;

      // ========================================
      // APPLY INJURY PENALTY IF INJURY DETECTED
      // ========================================
      if (injuryContext) {
        const { playerName, position, teamAbbr } = injuryContext;

        console.log(`   🏥 Applying injury penalty for ${playerName} (${position})...`);

        // Determine penalty based on position
        let injuryPenalty = 0;

        if (position === 'QB') {
          // Scale QB penalty based on team quality (Elo rating)
          const teamElo = teamAbbr === home_team ? homeStats.elo_rating : awayStats.elo_rating;

          if (teamElo >= 1650) {
            // Elite team - QB is critical (Chiefs, Bills, 49ers)
            injuryPenalty = 0.28;
            console.log(`   🌟 Elite team losing starting QB - major impact`);
          } else if (teamElo >= 1500) {
            // Playoff-caliber team - significant QB impact
            injuryPenalty = 0.23;
            console.log(`   ⭐ Good team losing starting QB - significant impact`);
          } else {
            // Average/weak team - still important but less critical
            injuryPenalty = 0.18;
            console.log(`   📊 Average team losing starting QB - notable impact`);
          }
        } else if (position === 'RB' || position === 'WR') {
          injuryPenalty = 0.12; // 12% penalty for star skill position players
        } else if (position === 'CB' || position === 'LB' || position === 'DE' || position === 'DT') {
          injuryPenalty = 0.08; // 8% penalty for top defenders
        } else {
          injuryPenalty = 0.05; // 5% default penalty for other key players
        }

        // Apply penalty to the correct team
        if (teamAbbr === home_team) {
          homeWinProb = Math.max(0.05, homeWinProb - injuryPenalty); // Floor at 5%
          awayWinProb = 1 - homeWinProb;
          console.log(`   📉 ${home_team} win probability: ${(homeWinProb * 100).toFixed(1)}% (down ${(injuryPenalty * 100).toFixed(0)}% due to ${position} injury)`);
        } else if (teamAbbr === away_team) {
          awayWinProb = Math.max(0.05, awayWinProb - injuryPenalty); // Floor at 5%
          homeWinProb = 1 - awayWinProb;
          console.log(`   📉 ${away_team} win probability: ${(awayWinProb * 100).toFixed(1)}% (down ${(injuryPenalty * 100).toFixed(0)}% due to ${position} injury)`);
        }
      }
      // ========================================
      // END INJURY PENALTY
      // ========================================

      // Determine predicted winner and confidence
      const predictedWinner = homeWinProb > 0.5 ? home_team : away_team;
      const winnerProb = Math.max(homeWinProb, awayWinProb);
      const confidence = this.determineConfidence(winnerProb);

      // Build prediction data object WITH injury context
      const predictionData = {
        game_id,
        home_team,
        away_team,
        predicted_winner: predictedWinner,
        home_win_probability: homeWinProb,
        away_win_probability: awayWinProb,
        confidence,
        eloScore,
        powerScore,
        situationalScore,
        matchupScore,
        recentFormScore,
        homeStats,
        awayStats,
        injuryContext  // <-- PASS INJURY CONTEXT TO AI
      };

      // Generate AI reasoning (with injury awareness)
      const reasoning = await aiReasoningService.generateReasoning(predictionData);

      const prediction = {
        ...predictionData,
        reasoning
      };

      // Save to database
      await this.savePrediction(prediction);

      console.log(`✅ Single-game prediction complete: ${predictedWinner} (${Math.round(winnerProb * 100)}%)`);

      return prediction;

    } catch (error) {
      console.error('❌ Error generating single-game prediction:', error);
      throw error;
    }
  }

  /**
   * Generate predictions for all upcoming games
   */
  async generatePredictions(season = 2024, week = null) {
    try {
      // Get upcoming games
      let query = `
        SELECT * FROM games
        WHERE season = $1
        AND home_score IS NULL
      `;
      const params = [season];

      if (week) {
        query += ` AND week = $2`;
        params.push(week);
      }

      query += ` ORDER BY game_date ASC`;

      const result = await pool.query(query, params);
      const games = result.rows;

      console.log(`Generating predictions for ${games.length} games...`);

      const predictions = [];
      for (const game of games) {
        try {
          const prediction = await this.analyzeMatchup(game);
          await this.savePrediction(prediction);
          predictions.push(prediction);
          console.log(`✓ ${game.home_team} vs ${game.away_team}: ${prediction.predicted_winner} (${Math.round(prediction.home_win_probability * 100)}%)`);
        } catch (error) {
          console.error(`Failed to predict game ${game.game_id}:`, error.message);
        }
      }

      console.log(`\n✅ Generated ${predictions.length} predictions successfully`);
      return predictions;
    } catch (error) {
      console.error('Error generating predictions:', error);
      throw error;
    }
  }
  /**
   * Update weights from admin panel
   */
  async updateWeights(newWeights) {
    this.weights = { ...newWeights };
    console.log('✅ Weights updated in memory:', this.weights);
  }
}

// Export singleton instance
const predictionEngine = new PredictionEngine();
export default predictionEngine;