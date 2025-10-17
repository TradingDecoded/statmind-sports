// ============================================
// StatMind Sports - Parlay Resolution Service
// Automatically resolves parlays when games finish
// ============================================

import pool from '../config/database.js';
import notificationService from './notificationService.js';

class ParlayResolutionService {

  // ==========================================
  // RESOLVE ALL PENDING PARLAYS
  // Checks completed games and updates parlays
  // ==========================================
  async resolveAllPendingParlays() {
    try {
      console.log('\n🔄 Starting parlay resolution process...');

      // Get all pending parlays
      const pendingParlays = await pool.query(
        `SELECT * FROM user_parlays 
         WHERE is_hit IS NULL 
         ORDER BY created_at DESC`
      );

      if (pendingParlays.rows.length === 0) {
        console.log('✅ No pending parlays to resolve');
        return { resolved: 0, pending: 0 };
      }

      console.log(`📊 Found ${pendingParlays.rows.length} pending parlays`);

      let resolvedCount = 0;

      for (const parlay of pendingParlays.rows) {
        const resolved = await this.resolveSingleParlay(parlay);
        if (resolved) resolvedCount++;
      }

      console.log(`✅ Resolved ${resolvedCount} parlays`);

      return {
        resolved: resolvedCount,
        pending: pendingParlays.rows.length - resolvedCount
      };

    } catch (error) {
      console.error('❌ Error resolving parlays:', error);
      throw error;
    }
  }

  // ==========================================
  // RESOLVE A SINGLE PARLAY
  // Checks if all games are complete and determines win/loss
  // ==========================================
  async resolveSingleParlay(parlay) {
    try {
      const games = parlay.games; // JSONB array

      // Check if all games in this parlay are complete
      const allGamesComplete = await this.areAllGamesComplete(games);

      if (!allGamesComplete) {
        return false; // Not ready to resolve yet
      }

      // Calculate how many legs were correct
      const { legsHit, totalLegs, isWin } = await this.calculateParlayResult(games);

      // Update the parlay
      await pool.query(
        `UPDATE user_parlays 
         SET is_hit = $1, 
             legs_hit = $2,
             resolved_at = CURRENT_TIMESTAMP
         WHERE id = $3`,
        [isWin, legsHit, parlay.id]
      );

      // Update user stats
      await this.updateUserStats(parlay.user_id, isWin, legsHit, totalLegs);

      // Send notifications (email + in-app)
      await notificationService.sendParlayResultNotifications(parlay.user_id, {
        ...parlay,
        is_hit: isWin,
        legs_hit: legsHit
      });

      console.log(`✅ Resolved parlay ${parlay.id} for user ${parlay.user_id}: ${isWin ? 'WON' : 'LOST'} (${legsHit}/${totalLegs})`);

      return true;

    } catch (error) {
      console.error(`❌ Error resolving parlay ${parlay.id}:`, error);
      return false;
    }
  }

  // ==========================================
  // CHECK IF ALL GAMES ARE COMPLETE
  // ==========================================
  async areAllGamesComplete(games) {
    try {
      for (const game of games) {
        const result = await pool.query(
          'SELECT is_final FROM games WHERE game_id = $1',
          [game.game_id]
        );

        if (result.rows.length === 0 || !result.rows[0].is_final) {
          return false; // At least one game is not final
        }
      }

      return true; // All games are final

    } catch (error) {
      console.error('Error checking game completion:', error);
      return false;
    }
  }

  // ==========================================
  // CALCULATE PARLAY RESULT
  // Determines how many legs won and if parlay won
  // ==========================================
  async calculateParlayResult(games) {
    try {
      let legsHit = 0;
      const totalLegs = games.length;

      for (const game of games) {
        // Get actual game result
        const result = await pool.query(
          `SELECT home_team, away_team, home_score, away_score, is_final
           FROM games 
           WHERE game_id = $1`,
          [game.game_id]
        );

        if (result.rows.length === 0) {
          console.warn(`⚠️  Game ${game.game_id} not found`);
          continue;
        }

        const gameData = result.rows[0];

        // Determine actual winner
        let actualWinner;
        if (gameData.home_score > gameData.away_score) {
          actualWinner = gameData.home_team;
        } else if (gameData.away_score > gameData.home_score) {
          actualWinner = gameData.away_team;
        } else {
          actualWinner = 'TIE'; // Rare but possible
        }

        // Check if user's pick was correct
        if (game.picked_winner === actualWinner) {
          legsHit++;
        }
      }

      // Parlay wins only if ALL legs win
      const isWin = (legsHit === totalLegs);

      return { legsHit, totalLegs, isWin };

    } catch (error) {
      console.error('Error calculating parlay result:', error);
      throw error;
    }
  }

  // ==========================================
  // UPDATE USER STATS AFTER PARLAY RESOLVES
  // ==========================================
  async updateUserStats(userId, isWin, legsHit, totalLegs) {
    try {
      // Get current stats
      const currentStats = await pool.query(
        'SELECT * FROM user_stats WHERE user_id = $1',
        [userId]
      );

      if (currentStats.rows.length === 0) {
        console.warn(`⚠️  No stats found for user ${userId}, creating...`);
        await pool.query(
          'INSERT INTO user_stats (user_id) VALUES ($1)',
          [userId]
        );
      }

      const stats = currentStats.rows[0] || {};

      // Calculate new values
      const newTotalWins = (stats.total_wins || 0) + (isWin ? 1 : 0);
      const newTotalLosses = (stats.total_losses || 0) + (isWin ? 0 : 1);
      const newPendingParlays = Math.max(0, (stats.pending_parlays || 0) - 1);
      const newTotalParlays = newTotalWins + newTotalLosses;
      const newWinRate = newTotalParlays > 0 ? ((newTotalWins / newTotalParlays) * 100).toFixed(2) : 0;

      // Calculate streak
      let newCurrentStreak;
      let newBestStreak = stats.best_streak || 0;
      let newWorstStreak = stats.worst_streak || 0;

      if (isWin) {
        // Winning: Increase positive streak or reset from negative
        newCurrentStreak = (stats.current_streak || 0) >= 0 ? (stats.current_streak || 0) + 1 : 1;
        newBestStreak = Math.max(newBestStreak, newCurrentStreak);
      } else {
        // Losing: Decrease (negative) streak or reset from positive
        newCurrentStreak = (stats.current_streak || 0) <= 0 ? (stats.current_streak || 0) - 1 : -1;
        newWorstStreak = Math.min(newWorstStreak, newCurrentStreak);
      }

      // Calculate leg accuracy
      const newCorrectLegs = (stats.correct_legs || 0) + legsHit;
      const newTotalLegsPicked = (stats.total_legs_picked || 0) + totalLegs;
      const newLegAccuracy = newTotalLegsPicked > 0 ? ((newCorrectLegs / newTotalLegsPicked) * 100).toFixed(2) : 0;

      // Calculate average parlay legs
      const newAvgParlayLegs = newTotalParlays > 0 ? (newTotalLegsPicked / newTotalParlays).toFixed(1) : 0;

      // Update stats
      await pool.query(
        `UPDATE user_stats 
         SET total_wins = $1,
             total_losses = $2,
             pending_parlays = $3,
             win_rate = $4,
             current_streak = $5,
             best_streak = $6,
             worst_streak = $7,
             correct_legs = $8,
             leg_accuracy = $9,
             avg_parlay_legs = $10,
             last_updated = CURRENT_TIMESTAMP
         WHERE user_id = $11`,
        [
          newTotalWins,
          newTotalLosses,
          newPendingParlays,
          newWinRate,
          newCurrentStreak,
          newBestStreak,
          newWorstStreak,
          newCorrectLegs,
          newLegAccuracy,
          newAvgParlayLegs,
          userId
        ]
      );

      console.log(`📊 Updated stats for user ${userId}: ${newTotalWins}W-${newTotalLosses}L (${newWinRate}% win rate, ${newCurrentStreak} streak)`);

    } catch (error) {
      console.error('Error updating user stats:', error);
      throw error;
    }
  }
}

export default new ParlayResolutionService();
