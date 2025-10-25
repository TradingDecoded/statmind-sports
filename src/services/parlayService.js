// ============================================
// StatMind Sports - Parlay Service
// Handles parlay creation, calculation, and management
// ============================================

import pool from '../config/database.js';
import competitionService from './competitionService.js';

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
  async createParlay(userId, parlayData, isPracticeMode = false) {
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      const { season, week, games } = parlayData;
      const legCount = games.length;

      // ALWAYS auto-generate parlay name (no user input)
      const parlayCountResult = await client.query(
        'SELECT COUNT(*) as count FROM user_parlays WHERE user_id = $1',
        [userId]
      );

      const parlayNumber = parseInt(parlayCountResult.rows[0].count) + 1;
      const parlayName = `Parlay #${parlayNumber}`;

      console.log(`🤖 Auto-generated parlay name: "${parlayName}"`);

      // Get current year/week FIRST (needed for multiple checks)
      const currentDate = new Date();
      const currentYear = currentDate.getFullYear();
      const currentWeek = parseInt(week);

      // 1. Get user's account tier and SMS Bucks balance
      const userResult = await client.query(
        'SELECT account_tier, sms_bucks FROM users WHERE id = $1',
        [userId]
      );

      if (userResult.rows.length === 0) {
        throw new Error('User not found');
      }

      const { account_tier, sms_bucks } = userResult.rows[0];

      // 2. Get user's competition status (opted in or not)
      console.log(`\n🔍 Calling getUserCompetitionStatus for user ${userId}...`);
      const competitionStatus = await competitionService.getUserCompetitionStatus(userId);
      console.log(`✅ Competition status received:`, JSON.stringify(competitionStatus, null, 2));

      // 2.5 CHECK FOR DUPLICATE PARLAY
      console.log(`\n🔍 Checking for duplicate parlays...`);

      // Get all user's parlays for this week
      const existingParlaysResult = await client.query(
        `SELECT id, games FROM user_parlays 
       WHERE user_id = $1 
       AND year = $2 
       AND week_number = $3`,
        [userId, currentYear, currentWeek]
      );

      // Create a normalized version of the current parlay for comparison
      const currentParlayGames = games.map(g => ({
        game_id: g.game_id,
        picked_winner: g.picked_winner
      })).sort((a, b) => a.game_id - b.game_id);

      // Check each existing parlay for duplicates
      for (const existingParlay of existingParlaysResult.rows) {
        const existingGames = existingParlay.games.map(g => ({
          game_id: g.game_id,
          picked_winner: g.picked_winner
        })).sort((a, b) => a.game_id - b.game_id);

        // Compare the two arrays
        const isDuplicate =
          currentParlayGames.length === existingGames.length &&
          currentParlayGames.every((game, index) =>
            game.game_id === existingGames[index].game_id &&
            game.picked_winner === existingGames[index].picked_winner
          );

        if (isDuplicate) {
          await client.query('ROLLBACK');
          throw new Error('You have already created this exact parlay this week. Please select different games or picks.');
        }
      }

      console.log(`✅ No duplicate found. Proceeding with parlay creation.`);

      // 3. Determine if this is a practice parlay or competition parlay
      // Use the isPracticeMode parameter passed from frontend (ignore competitionStatus logic)
      const isPracticParlay = isPracticeMode; // This now comes from the toggle
      const smsBucksCost = isPracticParlay ? 0 : 100;

      console.log(`\n🎲 Creating ${isPracticParlay ? 'PRACTICE' : 'COMPETITION'} parlay for user ${userId}`);
      console.log(`   - Account Tier: ${competitionStatus.accountTier}`);
      console.log(`   - Opted In: ${competitionStatus.isOptedIn}`);
      console.log(`   - Window Open: ${competitionStatus.isCompetitionWindowOpen}`);
      console.log(`   - Should Create Free Parlays: ${competitionStatus.shouldCreateFreeParlays}`);
      console.log(`   - Is Practice Parlay: ${isPracticParlay}`);
      console.log(`   - SMS Bucks Cost: ${smsBucksCost}`);

      // 4. If competition parlay, check sufficient balance
      if (!isPracticParlay && sms_bucks < smsBucksCost) {
        await client.query('ROLLBACK');
        throw new Error(`Insufficient SMS Bucks. Need ${smsBucksCost}, have ${sms_bucks}`);
      }

      // 5. Get current year/week for tracking

      // 6. Get current competition (if exists)
      let competitionId = null;
      if (!isPracticParlay) {
        const competitionResult = await client.query(
          'SELECT id FROM weekly_competitions WHERE season = $1 AND nfl_week = $2 AND status = $3',
          [season, week, 'active']
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

      // 9. Insert parlay with is_practice_parlay flag
      const parlayResult = await client.query(
        `INSERT INTO user_parlays 
      (user_id, parlay_name, season, week, leg_count, games, 
       combined_ai_probability, risk_level, sms_bucks_cost, 
       year, week_number, competition_id, sport, is_practice_parlay)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
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
          'nfl',
          isPracticParlay // NEW: Mark as practice or competition parlay
        ]
      );

      const parlayId = parlayResult.rows[0].id;

      // 10. Deduct SMS Bucks ONLY for competition parlays
      if (!isPracticParlay && smsBucksCost > 0) {
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
            `Competition entry: ${parlayName} (${legCount} legs)`, parlayId]
        );

        // 12. Add user to competition standings (or update parlay count)
        if (competitionId) {
          await client.query(
            `INSERT INTO weekly_competition_standings 
           (competition_id, user_id, parlays_entered, total_points, parlays_won, rank)
           VALUES ($1, $2, 1, 0, 0, 1)
           ON CONFLICT (competition_id, user_id) 
           DO UPDATE SET
             parlays_entered = weekly_competition_standings.parlays_entered + 1,
             updated_at = NOW()`,
            [competitionId, userId]
          );

          console.log(`✅ Updated competition standings for user ${userId}`);
        }

        // 13. Update weekly parlay count (competition entries only)
        await client.query(
          `INSERT INTO weekly_parlay_counts (user_id, year, week_number, parlay_count, last_parlay_date)
         VALUES ($1, $2, $3, 1, NOW())
         ON CONFLICT (user_id, year, week_number) 
         DO UPDATE SET parlay_count = weekly_parlay_counts.parlay_count + 1, 
                       last_parlay_date = NOW()`,
          [userId, currentYear, currentWeek]
        );

        console.log(`✅ Competition parlay created! ${smsBucksCost} SMS Bucks deducted. New balance: ${newBalance}`);
      } else {
        console.log(`✅ Practice parlay created! No SMS Bucks deducted.`);
      }

      // 14. Update user_stats (increment total and pending parlays)
      await client.query(
        `UPDATE user_stats 
         SET total_parlays = total_parlays + 1,
             pending_parlays = pending_parlays + 1,
             last_updated = NOW()
         WHERE user_id = $1`,
        [userId]
      );

      console.log(`✅ Updated user_stats for user ${userId}`);

      // 15. Commit transaction
      await client.query('COMMIT');

      return {
        success: true,
        parlay: parlayResult.rows[0],
        isPracticeParly: isPracticParlay,
        smsBucksCost: smsBucksCost,
        message: isPracticParlay
          ? 'Practice parlay created successfully! (Free)'
          : `Competition parlay created! ${smsBucksCost} SMS Bucks deducted.`
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

  // ==========================================
  // UPGRADE PRACTICE PARLAY TO COMPETITION
  // Converts a free practice parlay to paid competition entry
  // ==========================================
  async upgradePracticeParlayToCompetition(parlayId, userId) {
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      console.log(`\n🔄 Attempting to upgrade parlay ${parlayId} for user ${userId}...`);

      // 1. Get the parlay and verify ownership
      const parlayResult = await client.query(
        `SELECT * FROM user_parlays 
         WHERE id = $1 AND user_id = $2`,
        [parlayId, userId]
      );

      if (parlayResult.rows.length === 0) {
        await client.query('ROLLBACK');
        throw new Error('Parlay not found or does not belong to you');
      }

      const parlay = parlayResult.rows[0];

      // 2. Check if it's a practice parlay
      if (parlay.is_practice_parlay === false) {
        await client.query('ROLLBACK');
        throw new Error('This parlay is already a competition entry');
      }

      // 3. Check if parlay is already resolved
      if (parlay.is_hit !== null) {
        await client.query('ROLLBACK');
        throw new Error('Cannot upgrade a resolved parlay');
      }

      // 4. Check if parlay is locked (first game has started)
      const games = parlay.games;
      const gameIds = games.map(g => g.game_id);

      // Fetch actual game dates from database
      const gamesDataResult = await client.query(
        'SELECT id, game_date FROM games WHERE id = ANY($1::int[])',
        [gameIds]
      );

      if (gamesDataResult.rows.length === 0) {
        await client.query('ROLLBACK');
        throw new Error('Game data not found');
      }

      // Find the earliest game
      const firstGame = gamesDataResult.rows.reduce((earliest, game) => {
        return new Date(game.game_date) < new Date(earliest.game_date) ? game : earliest;
      }, gamesDataResult.rows[0]);

      const firstGameStart = new Date(firstGame.game_date);
      const now = new Date();

      if (now >= firstGameStart) {
        await client.query('ROLLBACK');
        throw new Error('Cannot upgrade: parlay is locked (first game has started)');
      }

      console.log(`✅ Parlay is unlocked. First game starts: ${firstGameStart.toISOString()}`);

      // 5. Get user's account info
      const userResult = await client.query(
        'SELECT account_tier, sms_bucks, competition_opted_in FROM users WHERE id = $1',
        [userId]
      );

      if (userResult.rows.length === 0) {
        await client.query('ROLLBACK');
        throw new Error('User not found');
      }

      const { account_tier, sms_bucks, competition_opted_in } = userResult.rows[0];

      // 6. Verify user is Premium/VIP
      if (account_tier === 'free') {
        await client.query('ROLLBACK');
        throw new Error('Must be Premium or VIP to enter competitions');
      }

      // 7. Check competition status (DISABLED FOR TESTING)
      // const competitionStatus = await competitionService.getUserCompetitionStatus(userId);
      // 
      // if (!competitionStatus.isCompetitionWindowOpen) {
      //   await client.query('ROLLBACK');
      //   throw new Error('Competition window is closed. Cannot upgrade parlay.');
      // }

      // 8. Check if user has enough SMS Bucks
      const upgradeCost = 100;
      if (sms_bucks < upgradeCost) {
        await client.query('ROLLBACK');
        throw new Error(`Insufficient SMS Bucks. Need ${upgradeCost}, have ${sms_bucks}`);
      }

      console.log(`💰 User has ${sms_bucks} SMS Bucks. Upgrade cost: ${upgradeCost}`);

      // 9. Get current competition ID (optional - create if doesn't exist)
      let competitionId = null;

      const competitionResult = await client.query(
        'SELECT id FROM weekly_competitions WHERE year = $1 AND week_number = $2',
        [parlay.year, parlay.week_number]
      );

      if (competitionResult.rows.length > 0) {
        competitionId = competitionResult.rows[0].id;
        console.log(`✅ Found existing competition: ${competitionId}`);
      } else {
        // Create a new competition for this week
        console.log(`🆕 Creating new competition for year ${parlay.year}, week ${parlay.week_number}`);

        const newCompResult = await client.query(
          `INSERT INTO weekly_competitions 
     (year, week_number, season, nfl_week, start_date, end_date, prize_amount, status)
     VALUES ($1, $2, $3, $4, CURRENT_DATE, CURRENT_DATE + INTERVAL '7 days', 50.00, 'active')
     RETURNING id`,
          [parlay.year, parlay.week_number, parlay.season, parlay.week]
        );

        competitionId = newCompResult.rows[0].id;
        console.log(`✅ Created new competition: ${competitionId}`);
      }

      // 10. If user is not opted in, opt them in automatically
      if (!competition_opted_in) {
        console.log(`🎯 User not opted in. Auto-opting in during upgrade...`);
        await client.query(
          `UPDATE users 
           SET competition_opted_in = TRUE,
               competition_opt_in_date = NOW()
           WHERE id = $1`,
          [userId]
        );
      }

      // 11. Update parlay: set is_practice_parlay = FALSE, add competition_id, update cost
      await client.query(
        `UPDATE user_parlays 
         SET is_practice_parlay = FALSE,
             competition_id = $1,
             sms_bucks_cost = $2
         WHERE id = $3`,
        [competitionId, upgradeCost, parlayId]
      );

      console.log(`✅ Parlay ${parlayId} upgraded to competition entry`);

      // 12. Deduct SMS Bucks
      const newBalance = sms_bucks - upgradeCost;
      await client.query(
        'UPDATE users SET sms_bucks = $1 WHERE id = $2',
        [newBalance, userId]
      );

      console.log(`💸 Deducted ${upgradeCost} SMS Bucks. New balance: ${newBalance}`);

      // 13. Record SMS Bucks transaction
      await client.query(
        `INSERT INTO sms_bucks_transactions 
         (user_id, amount, transaction_type, balance_after, description, related_parlay_id)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [userId, -upgradeCost, 'parlay_upgrade', newBalance,
          `Upgraded practice parlay to competition: ${parlay.parlay_name}`, parlayId]
      );

      // 14. Update weekly parlay count (now counts as competition entry)
      await client.query(
        `INSERT INTO weekly_parlay_counts (user_id, year, week_number, parlay_count, last_parlay_date)
         VALUES ($1, $2, $3, 1, NOW())
         ON CONFLICT (user_id, year, week_number) 
         DO UPDATE SET parlay_count = weekly_parlay_counts.parlay_count + 1, 
                       last_parlay_date = NOW()`,
        [userId, parlay.year, parlay.week_number]
      );

      // 15. Add user to competition standings (or update parlay count)
      await client.query(
        `INSERT INTO weekly_competition_standings 
   (competition_id, user_id, parlays_entered, total_points, parlays_won, rank)
   VALUES ($1, $2, 1, 0, 0, 1)
   ON CONFLICT (competition_id, user_id) 
   DO UPDATE SET
     parlays_entered = weekly_competition_standings.parlays_entered + 1,
     updated_at = NOW()`,
        [competitionId, userId]
      );

      console.log(`✅ Updated competition standings for user ${userId}`);

      await client.query('COMMIT');

      console.log(`\n🎉 UPGRADE SUCCESSFUL!`);
      console.log(`   - Parlay ID: ${parlayId}`);
      console.log(`   - Cost: ${upgradeCost} SMS Bucks`);
      console.log(`   - New Balance: ${newBalance}`);
      console.log(`   - Competition ID: ${competitionId}`);

      return {
        success: true,
        message: 'Parlay upgraded to competition entry!',
        parlay: {
          id: parlayId,
          is_practice_parlay: false,
          competition_id: competitionId,
          sms_bucks_cost: upgradeCost
        },
        newBalance,
        amountCharged: upgradeCost
      };

    } catch (error) {
      await client.query('ROLLBACK');
      console.error('❌ Upgrade parlay error:', error);
      throw error;
    } finally {
      client.release();
    }
  }
}

export default new ParlayService();
