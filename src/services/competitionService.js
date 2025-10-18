// ============================================
// StatMind Sports - Competition Service
// Handles weekly competitions and prize distribution
// ============================================

import pool from '../config/database.js';

class CompetitionService {
  
  // ==========================================
  // GET CURRENT WEEK COMPETITION
  // ==========================================
  async getCurrentCompetition() {
    try {
      const result = await pool.query(
        `SELECT * FROM weekly_competitions 
         WHERE status = 'active' 
         ORDER BY created_at DESC 
         LIMIT 1`
      );
      
      if (result.rows.length === 0) {
        return null;
      }
      
      return result.rows[0];
      
    } catch (error) {
      console.error('Error getting current competition:', error);
      throw error;
    }
  }
  
  // ==========================================
  // GET COMPETITION LEADERBOARD
  // ==========================================
  async getCompetitionLeaderboard(competitionId, limit = 100) {
    try {
      const result = await pool.query(
        `SELECT 
          wcs.rank,
          wcs.user_id,
          u.username,
          u.display_name,
          u.avatar_url,
          u.membership_tier,
          wcs.total_points,
          wcs.parlays_entered,
          wcs.parlays_won,
          wc.prize_amount,
          wc.is_rollover
         FROM weekly_competition_standings wcs
         JOIN users u ON wcs.user_id = u.id
         JOIN weekly_competitions wc ON wcs.competition_id = wc.id
         WHERE wcs.competition_id = $1
         ORDER BY wcs.rank ASC
         LIMIT $2`,
        [competitionId, limit]
      );
      
      return result.rows;
      
    } catch (error) {
      console.error('Error getting competition leaderboard:', error);
      throw error;
    }
  }
  
  // ==========================================
  // UPDATE STANDINGS WHEN PARLAY RESOLVES
  // ==========================================
  async updateStandingsForParlay(parlayId, isWin) {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Get parlay info
      const parlayResult = await client.query(
        `SELECT user_id, leg_count, competition_id 
         FROM user_parlays 
         WHERE id = $1`,
        [parlayId]
      );
      
      if (parlayResult.rows.length === 0) {
        throw new Error('Parlay not found');
      }
      
      const { user_id, leg_count, competition_id } = parlayResult.rows[0];
      
      if (!competition_id) {
        console.log('Parlay not part of a competition');
        await client.query('COMMIT');
        return { success: true, message: 'Parlay not in competition' };
      }
      
      // Calculate points earned if win
      let pointsEarned = 0;
      if (isWin) {
        pointsEarned = this.calculatePoints(leg_count);
        
        // Update parlay points
        await client.query(
          'UPDATE user_parlays SET points_earned = $1 WHERE id = $2',
          [pointsEarned, parlayId]
        );
      }
      
      // Update standings
      await client.query(
        `UPDATE weekly_competition_standings 
         SET total_points = total_points + $1,
             parlays_won = parlays_won + $2,
             updated_at = NOW()
         WHERE competition_id = $3 AND user_id = $4`,
        [pointsEarned, isWin ? 1 : 0, competition_id, user_id]
      );
      
      // Recalculate ranks
      await this.recalculateRanks(competition_id, client);
      
      await client.query('COMMIT');
      
      console.log(`✅ Updated standings for parlay ${parlayId}: ${pointsEarned} points`);
      
      return {
        success: true,
        pointsEarned
      };
      
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Error updating standings:', error);
      throw error;
    } finally {
      client.release();
    }
  }
  
  // ==========================================
  // RECALCULATE RANKS
  // ==========================================
  async recalculateRanks(competitionId, client = null) {
    const db = client || pool;
    
    try {
      await db.query(
        `WITH ranked_users AS (
          SELECT 
            id,
            ROW_NUMBER() OVER (
              ORDER BY total_points DESC, parlays_won DESC, parlays_entered ASC
            ) as new_rank
          FROM weekly_competition_standings
          WHERE competition_id = $1
        )
        UPDATE weekly_competition_standings wcs
        SET rank = ru.new_rank
        FROM ranked_users ru
        WHERE wcs.id = ru.id`,
        [competitionId]
      );
      
    } catch (error) {
      console.error('Error recalculating ranks:', error);
      throw error;
    }
  }
  
  // ==========================================
  // DETERMINE WEEKLY WINNER (Run every Tuesday 2AM)
  // ==========================================
  async determineWeeklyWinner() {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Get current active competition
      const compResult = await client.query(
        `SELECT * FROM weekly_competitions 
         WHERE status = 'active' 
         ORDER BY created_at DESC 
         LIMIT 1`
      );
      
      if (compResult.rows.length === 0) {
        console.log('⚠️ No active competition found');
        await client.query('COMMIT');
        return { success: false, message: 'No active competition' };
      }
      
      const competition = compResult.rows[0];
      const competitionId = competition.id;
      
      // Check if competition should be ended (after end_date)
      const now = new Date();
      const endDate = new Date(competition.end_date);
      if (now <= endDate) {
        console.log('⚠️ Competition not yet ended');
        await client.query('COMMIT');
        return { success: false, message: 'Competition still active' };
      }
      
      // Get standings
      const standingsResult = await client.query(
        `SELECT wcs.*, u.membership_tier
         FROM weekly_competition_standings wcs
         JOIN users u ON wcs.user_id = u.id
         WHERE wcs.competition_id = $1
         AND u.membership_tier IN ('premium', 'vip')
         AND wcs.parlays_entered >= 3
         ORDER BY wcs.rank ASC`,
        [competitionId]
      );
      
      const qualifiedUsers = standingsResult.rows;
      
      // Check minimum requirements (at least 2 users with 3+ parlays each)
      if (qualifiedUsers.length < 2) {
        console.log('⚠️ Minimum entries not met. Rolling over prize.');
        
        // Mark competition as completed but no winner
        await client.query(
          `UPDATE weekly_competitions 
           SET status = 'completed',
               minimum_entries_met = false,
               completed_at = NOW()
           WHERE id = $1`,
          [competitionId]
        );
        
        // Create next week's competition with rollover
        const newPrize = parseFloat(competition.prize_amount) + 50.00;
        await this.createNextWeekCompetition(newPrize, true, client);
        
        await client.query('COMMIT');
        
        return {
          success: true,
          minimumMet: false,
          rolledOver: true,
          newPrize: newPrize
        };
      }
      
      // We have a winner! (highest rank with minimum entries)
      const winner = qualifiedUsers[0];
      
      // Update competition with winner
      await client.query(
        `UPDATE weekly_competitions 
         SET status = 'completed',
             minimum_entries_met = true,
             winner_user_id = $1,
             winner_points = $2,
             winner_parlays = $3,
             completed_at = NOW()
         WHERE id = $4`,
        [winner.user_id, winner.total_points, winner.parlays_won, competitionId]
      );
      
      // Create next week's competition (no rollover, back to $50)
      await this.createNextWeekCompetition(50.00, false, client);
      
      await client.query('COMMIT');
      
      console.log(`🏆 WINNER: User ${winner.user_id} with ${winner.total_points} points!`);
      
      return {
        success: true,
        minimumMet: true,
        winner: {
          userId: winner.user_id,
          points: winner.total_points,
          parlaysWon: winner.parlays_won,
          prizeAmount: competition.prize_amount
        }
      };
      
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Error determining weekly winner:', error);
      throw error;
    } finally {
      client.release();
    }
  }
  
  // ==========================================
  // CREATE NEXT WEEK COMPETITION
  // ==========================================
  async createNextWeekCompetition(prizeAmount, isRollover, client = null) {
    const db = client || pool;
    
    try {
      const now = new Date();
      const nextWeekStart = new Date(now);
      nextWeekStart.setDate(now.getDate() + 7 - now.getDay()); // Next Sunday
      nextWeekStart.setHours(0, 0, 0, 0);
      
      const nextWeekEnd = new Date(nextWeekStart);
      nextWeekEnd.setDate(nextWeekStart.getDate() + 6); // Following Saturday
      
      const year = nextWeekStart.getFullYear();
      const weekNumber = this.getWeekNumber(nextWeekStart);
      
      // Determine NFL week (you may need to adjust this logic)
      const nflWeek = this.calculateNFLWeek(nextWeekStart);
      
      await db.query(
        `INSERT INTO weekly_competitions 
         (year, week_number, season, nfl_week, start_date, end_date, 
          prize_amount, is_rollover, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'active')
         ON CONFLICT (year, week_number) DO NOTHING`,
        [year, weekNumber, 2024, nflWeek, nextWeekStart, nextWeekEnd, 
         prizeAmount, isRollover]
      );
      
      console.log(`✅ Created next week competition: Week ${weekNumber}, Prize: $${prizeAmount}`);
      
    } catch (error) {
      console.error('Error creating next week competition:', error);
      throw error;
    }
  }
  
  // ==========================================
  // HELPER: Calculate points based on legs
  // ==========================================
  calculatePoints(legCount) {
    if (legCount === 2) return 2;
    if (legCount === 3) return 5;
    if (legCount === 4) return 10;
    if (legCount === 5) return 20;
    if (legCount >= 6) return 40;
    return 0;
  }
  
  // ==========================================
  // HELPER: Get week number
  // ==========================================
  getWeekNumber(date) {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
  }
  
  // ==========================================
  // HELPER: Calculate NFL week from date
  // ==========================================
  calculateNFLWeek(date) {
    // NFL 2024 season starts September 5, 2024 (Week 1)
    const seasonStart = new Date('2024-09-05');
    const diffTime = Math.abs(date - seasonStart);
    const diffWeeks = Math.ceil(diffTime / (1000 * 60 * 60 * 24 * 7));
    return Math.min(Math.max(diffWeeks, 1), 18); // Weeks 1-18
  }
}

export default new CompetitionService();
