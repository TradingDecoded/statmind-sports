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
    home_teams.key as home_team,
    away_teams.key as away_team,
    g.home_score,
    g.away_score,
    g.is_final,
    p.predicted_winner,
    p.confidence as confidence_level,
    p.home_win_probability,
    p.away_win_probability,
    home_stats.wins as home_wins,
    home_stats.losses as home_losses,
    away_stats.wins as away_wins,
    away_stats.losses as away_losses
  FROM games g
  LEFT JOIN teams home_teams ON g.home_team = home_teams.key
  LEFT JOIN teams away_teams ON g.away_team = away_teams.key
  LEFT JOIN predictions p ON g.game_id = p.game_id
  LEFT JOIN team_statistics home_stats ON g.home_team = home_stats.team_key
  LEFT JOIN team_statistics away_stats ON g.away_team = away_stats.team_key
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
        let prob = parseFloat(game.ai_probability || game.win_probability);

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
  // Saves a user's parlay to the database with SMS Bucks integration
  // ==========================================
  async createParlay(userId, parlayData) {
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      const { parlayName, season, week, games } = parlayData;
      const legCount = games.length;

      // 1. Get user's membership tier and SMS Bucks balance
      const userResult = await client.query(
        'SELECT membership_tier, sms_bucks FROM users WHERE id = $1',
        [userId]
      );

      if (userResult.rows.length === 0) {
        throw new Error('User not found');
      }

      const { membership_tier, sms_bucks } = userResult.rows[0];

      // 2. Determine if user can enter contest (VIP/Premium only)
      const canEnterContest = (membership_tier === 'vip' || membership_tier === 'premium');
      const isFreeTier = (membership_tier === 'free');

      // 3. Calculate SMS Bucks cost and check weekly limits (only for VIP/Premium entering contest)
      let smsBucksCost = 0;
      let competitionId = null;
      const currentYear = new Date().getFullYear();
      const currentWeek = this.getWeekNumber(new Date());
      let currentWeekCount = 0;  // ← ADD THIS LINE

      if (canEnterContest) {
        smsBucksCost = this.calculateParlayCost(legCount);

        // 4. Check if user has enough SMS Bucks (only for contest entry)
        if (sms_bucks < smsBucksCost) {
          throw new Error(`Insufficient SMS Bucks. Need ${smsBucksCost}, have ${sms_bucks}`);
        }

        // 5. Check weekly parlay limit for contest entries (max 10 per week)
        const weeklyCountResult = await client.query(
          `SELECT parlay_count FROM weekly_parlay_counts 
           WHERE user_id = $1 AND year = $2 AND week_number = $3`,
          [userId, currentYear, currentWeek]
        );

        currentWeekCount = weeklyCountResult.rows.length > 0
          ? weeklyCountResult.rows[0].parlay_count
          : 0;

        if (currentWeekCount >= 10) {
          throw new Error('Weekly contest entry limit reached (10 parlays per week)');
        }

        // 6. Get active competition ID (only for VIP/Premium)
        const competitionResult = await client.query(
          `SELECT id FROM weekly_competitions 
           WHERE status = 'active' AND year = $1 AND week_number = $2`,
          [currentYear, currentWeek]
        );

        competitionId = competitionResult.rows.length > 0
          ? competitionResult.rows[0].id
          : null;
      }

      // 7. Calculate probability
      const calculation = this.calculateParlayProbability(games);

      // 8. Prepare games data for JSON storage
      const gamesJson = games.map(game => ({
        game_id: game.game_id,
        home_team: game.home_team,
        away_team: game.away_team,
        picked_winner: game.picked_winner,
        ai_winner: game.ai_winner,
        ai_probability: game.ai_probability
      }));

      // 9. Insert parlay with SMS Bucks cost and competition tracking
      const parlayResult = await client.query(
        `INSERT INTO user_parlays 
        (user_id, parlay_name, season, week, leg_count, games, 
         combined_ai_probability, risk_level, sms_bucks_cost, 
         year, week_number, competition_id, sport)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
        RETURNING *`,
        [
          userId,
          parlayName,
          season,
          week,
          legCount,
          JSON.stringify(gamesJson),
          calculation.combinedProbability,
          calculation.riskLevel,
          smsBucksCost,
          currentYear,
          currentWeek,
          competitionId,
          'nfl'
        ]
      );

      const parlayId = parlayResult.rows[0].id;

      // 10. Deduct SMS Bucks and update contest tracking (only for VIP/Premium)
      if (canEnterContest && smsBucksCost > 0) {
        const newBalance = sms_bucks - smsBucksCost;
        await client.query(
          'UPDATE users SET sms_bucks = $1 WHERE id = $2',
          [newBalance, userId]
        );

        // 11. Record SMS Bucks transaction
        await client.query(
          `INSERT INTO sms_bucks_transactions 
           (user_id, amount, transaction_type, balance_after, description, related_parlay_id)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [userId, -smsBucksCost, 'parlay_entry', newBalance,
            `Contest entry: ${parlayName} (${legCount} legs)`, parlayId]
        );

        // 12. Update weekly parlay count (contest entries only)
        await client.query(
          `INSERT INTO weekly_parlay_counts (user_id, year, week_number, parlay_count, last_parlay_date)
           VALUES ($1, $2, $3, 1, NOW())
           ON CONFLICT (user_id, year, week_number) 
           DO UPDATE SET parlay_count = weekly_parlay_counts.parlay_count + 1, 
                         last_parlay_date = NOW()`,
          [userId, currentYear, currentWeek]
        );
      }

      // 13. Update competition standings (only for VIP/Premium with active competition)
      if (canEnterContest && competitionId) {
        await client.query(
          `INSERT INTO weekly_competition_standings (competition_id, user_id, parlays_entered)
           VALUES ($1, $2, 1)
           ON CONFLICT (competition_id, user_id) 
           DO UPDATE SET parlays_entered = weekly_competition_standings.parlays_entered + 1`,
          [competitionId, userId]
        );

        // Update competition participant count
        await client.query(
          `UPDATE weekly_competitions 
           SET total_parlays = total_parlays + 1,
               total_participants = (
                 SELECT COUNT(DISTINCT user_id) 
                 FROM weekly_competition_standings 
                 WHERE competition_id = $1
               )
           WHERE id = $1`,
          [competitionId]
        );
      }

      // 14. Update user stats
      await client.query(
        `UPDATE user_stats 
        SET total_parlays = total_parlays + 1,
            pending_parlays = pending_parlays + 1,
            total_legs_picked = total_legs_picked + $2,
            avg_parlay_legs = ROUND(
              (total_legs_picked + $2)::DECIMAL / (total_parlays + 1), 1
            )
        WHERE user_id = $1`,
        [userId, legCount]
      );

      await client.query('COMMIT');

      console.log(`✅ Parlay created by user ${userId}: ${parlayName} (Cost: ${smsBucksCost} SMS Bucks)`);

      return {
        success: true,
        parlay: parlayResult.rows[0],
        calculation,
        smsBucksCost,
        enteredContest: canEnterContest && competitionId !== null,
        weeklyParlaysRemaining: canEnterContest ? (10 - (currentWeekCount + 1)) : null
      };

    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Create parlay error:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  // ==========================================
  // HELPER: Calculate SMS Bucks cost based on leg count
  // ==========================================
  calculateParlayCost(legCount) {
    if (legCount === 2) return 50;
    if (legCount === 3) return 75;
    if (legCount === 4) return 100;
    if (legCount === 5) return 125;
    if (legCount >= 6) return 150;
    return 0;
  }

  // ==========================================
  // HELPER: Get ISO week number
  // ==========================================
  getWeekNumber(date) {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
  }

  // ==========================================
  // GET USER'S PARLAYS
  // Returns all parlays for a specific user
  // ==========================================
  async getUserParlays(userId, options = {}) {
    try {
      const { season, status } = options;
      let query = `SELECT * FROM user_parlays WHERE user_id = $1`;
      const params = [userId];

      if (season) {
        query += ` AND season = $2`;
        params.push(season);
      }

      if (status === 'won') {
        query += ` AND is_hit = true`;
      } else if (status === 'lost') {
        query += ` AND is_hit = false`;
      } else if (status === 'pending') {
        query += ` AND is_hit IS NULL`;
      }

      query += ` ORDER BY created_at DESC`;

      const result = await pool.query(query, params);

      // ENHANCEMENT: Enrich each parlay with actual game results
      const enrichedParlays = await Promise.all(
        result.rows.map(async (parlay) => {
          if (!parlay.games || parlay.games.length === 0) {
            return parlay;
          }

          // Fetch actual game results for each game in the parlay
          const gamesWithResults = await Promise.all(
            parlay.games.map(async (game) => {
              console.log(`🔍 Looking for game_id: ${game.game_id}`);

              const gameResult = await pool.query(
                `SELECT home_team, away_team, home_score, away_score, is_final, status, game_date
                 FROM games
                 WHERE id = $1`,
                [game.game_id]
              );

              console.log(`🔍 Query result for game ${game.game_id}:`, gameResult.rows.length, 'rows found');

              if (gameResult.rows.length > 0) {
                console.log(`🔍 Game data:`, gameResult.rows[0]);
              }

              if (gameResult.rows.length === 0) {
                return { ...game, gameData: null };
              }

              const gameData = gameResult.rows[0];

              // Determine actual winner
              let actualWinner = null;
              let isCorrect = null;

              if (gameData.is_final) {
                if (gameData.home_score > gameData.away_score) {
                  actualWinner = gameData.home_team;
                } else if (gameData.away_score > gameData.home_score) {
                  actualWinner = gameData.away_team;
                } else {
                  actualWinner = 'TIE';
                }

                // Check if user's pick was correct
                isCorrect = (game.picked_winner === actualWinner);
              }

              return {
                ...game,
                status: gameData.status,
                game_date: gameData.game_date,
                gameData: {
                  home_score: gameData.home_score,
                  away_score: gameData.away_score,
                  is_final: gameData.is_final,
                  status: gameData.status,
                  actual_winner: actualWinner,
                  is_correct: isCorrect
                }
              };
            })
          );

          return {
            ...parlay,
            games: gamesWithResults
          };
        })
      );

      return enrichedParlays;
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

  // ==========================================
  // AWARD WIN BONUS
  // Give SMS Bucks bonus when parlay wins
  // ==========================================
  async awardWinBonus(parlayId) {
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // Get parlay and user info
      const parlayResult = await client.query(
        `SELECT up.user_id, up.leg_count, up.sms_bucks_reward, u.membership_tier, u.sms_bucks
         FROM user_parlays up
         JOIN users u ON up.user_id = u.id
         WHERE up.id = $1`,
        [parlayId]
      );

      if (parlayResult.rows.length === 0) {
        throw new Error('Parlay not found');
      }

      const { user_id, leg_count, sms_bucks_reward, membership_tier, sms_bucks } = parlayResult.rows[0];

      // Check if bonus already awarded
      if (sms_bucks_reward > 0) {
        console.log(`⚠️ Win bonus already awarded for parlay ${parlayId}`);
        return { success: false, message: 'Bonus already awarded' };
      }

      // Calculate bonus based on tier
      const bonus = membership_tier === 'vip' ? 50 : membership_tier === 'premium' ? 25 : 0;

      if (bonus === 0) {
        console.log(`⚠️ No bonus for free tier user`);
        return { success: false, message: 'Free users do not receive win bonuses' };
      }

      // Update user balance
      const newBalance = sms_bucks + bonus;
      await client.query(
        'UPDATE users SET sms_bucks = $1 WHERE id = $2',
        [newBalance, user_id]
      );

      // Record transaction
      await client.query(
        `INSERT INTO sms_bucks_transactions 
         (user_id, amount, transaction_type, balance_after, description, related_parlay_id)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [user_id, bonus, 'parlay_win', newBalance,
          `Parlay win bonus (${leg_count} legs)`, parlayId]
      );

      // Update parlay reward record
      await client.query(
        'UPDATE user_parlays SET sms_bucks_reward = $1 WHERE id = $2',
        [bonus, parlayId]
      );

      await client.query('COMMIT');

      console.log(`✅ Win bonus awarded: ${bonus} SMS Bucks to user ${user_id} for parlay ${parlayId}`);

      return {
        success: true,
        bonus,
        newBalance
      };

    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Award win bonus error:', error);
      throw error;
    } finally {
      client.release();
    }
  }
}

export default new ParlayService();
