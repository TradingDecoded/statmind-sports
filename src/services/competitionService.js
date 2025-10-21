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
        `SELECT 
        wc.*,
        COALESCE(
          (SELECT COUNT(DISTINCT user_id) 
           FROM weekly_competition_standings 
           WHERE competition_id = wc.id),
          0
        ) as total_participants
       FROM weekly_competitions wc
       WHERE wc.status = 'active' 
       ORDER BY wc.created_at DESC 
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
  // CHECK: Is competition window currently open?
  // Returns true if between Tuesday 2 AM ET and Sunday 3:50 PM ET
  // ==========================================
  isCompetitionWindowOpen(competition) {
    if (!competition || !competition.start_datetime || !competition.end_datetime) {
      return false;
    }

    const now = new Date();
    const startTime = new Date(competition.start_datetime);
    const endTime = new Date(competition.end_datetime);

    return now >= startTime && now <= endTime;
  }

  // ==========================================
  // GET: User's competition status
  // Determines if user can create free or paid parlays
  // ==========================================
  async getUserCompetitionStatus(userId) {
    try {
      console.log(`\n🔍 Checking competition status for user ${userId}`);

      // Get user details
      const userResult = await pool.query(
        'SELECT account_tier, competition_opted_in FROM users WHERE id = $1',
        [userId]
      );

      if (userResult.rows.length === 0) {
        throw new Error('User not found');
      }

      const { account_tier, competition_opted_in } = userResult.rows[0];

      console.log(`   - Account Tier: ${account_tier}`);
      console.log(`   - Competition Opted In: ${competition_opted_in}`);

      // Get current competition
      const competition = await this.getCurrentCompetition();

      // Check if competition window is open
      const isCompetitionWindowOpen = this.isCompetitionWindowOpen(competition);
      console.log(`   - Competition Window Open: ${isCompetitionWindowOpen}`);

      // Determine opt-in status
      const isOptedIn = competition_opted_in === true;

      // Determine if user should create free parlays
      let shouldCreateFreeParlays = false;

      // Free tier ALWAYS gets free parlays (never competes)
      if (account_tier === 'free') {
        shouldCreateFreeParlays = true;
        console.log(`   → Free tier: shouldCreateFreeParlays = TRUE (never competes)`);
      }
      // Premium/VIP: Free parlays if NOT opted in OR window closed
      else if (account_tier === 'premium' || account_tier === 'vip') {
        if (!isOptedIn) {
          shouldCreateFreeParlays = true;
          console.log(`   → Premium/VIP not opted in: shouldCreateFreeParlays = TRUE`);
        } else if (!isCompetitionWindowOpen) {
          shouldCreateFreeParlays = true;
          console.log(`   → Competition window closed: shouldCreateFreeParlays = TRUE`);
        } else {
          shouldCreateFreeParlays = false;
          console.log(`   → Premium/VIP opted in + window open: shouldCreateFreeParlays = FALSE (paid)`);
        }
      }

      console.log(`\n📊 Final Status: shouldCreateFreeParlays = ${shouldCreateFreeParlays}\n`);

      return {
        accountTier: account_tier,
        isOptedIn,
        isCompetitionWindowOpen,
        shouldCreateFreeParlays,
        canOptIn: (account_tier === 'premium' || account_tier === 'vip') && isCompetitionWindowOpen
      };

    } catch (error) {
      console.error('Error getting competition status:', error);
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

      // Calculate next Tuesday 2:00 AM ET as start time
      // If today IS Tuesday and it's after 2 AM, we want NEXT week's Tuesday
      // If today is NOT Tuesday, calculate days until next Tuesday
      const nextWeekStart = new Date(now);
      const currentDay = now.getDay(); // 0 = Sunday, 1 = Monday, 2 = Tuesday, etc.

      let daysUntilTuesday;
      if (currentDay === 2) {
        // Today IS Tuesday - always go to NEXT Tuesday (7 days)
        daysUntilTuesday = 7;
      } else if (currentDay < 2) {
        // Before Tuesday this week
        daysUntilTuesday = 2 - currentDay;
      } else {
        // After Tuesday this week
        daysUntilTuesday = 7 - currentDay + 2;
      }

      nextWeekStart.setDate(now.getDate() + daysUntilTuesday);
      nextWeekStart.setHours(2, 0, 0, 0); // 2:00 AM ET

      // Calculate Sunday 3:50 PM ET as end time (5 days after Tuesday)
      const nextWeekEnd = new Date(nextWeekStart);
      nextWeekEnd.setDate(nextWeekStart.getDate() + 5); // Sunday
      nextWeekEnd.setHours(15, 50, 0, 0); // 3:50 PM ET

      const year = nextWeekStart.getFullYear();
      const weekNumber = this.getWeekNumber(nextWeekStart);

      // Determine NFL week (you may need to adjust this logic)
      const nflWeek = this.calculateNFLWeek(nextWeekStart);

      await db.query(
        `INSERT INTO weekly_competitions 
   (year, week_number, season, nfl_week, start_datetime, end_datetime, 
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
    // Determine which NFL season we're in
    const year = date.getFullYear();
    const month = date.getMonth(); // 0-11

    // NFL season runs September through February
    // If we're in Jan-July, we're in the previous year's season
    // If we're in Aug-Dec, we're in the current year's season
    let seasonYear;
    if (month >= 0 && month <= 7) {
      // Jan-Aug: Use previous year's season
      seasonYear = year - 1;
    } else {
      // Sep-Dec: Use current year's season
      seasonYear = year;
    }

    // NFL 2025 season starts September 4, 2025 (Week 1)
    const seasonStart = new Date(`${seasonYear}-09-04`);

    const diffTime = Math.abs(date - seasonStart);
    const diffWeeks = Math.ceil(diffTime / (1000 * 60 * 60 * 24 * 7));
    const nflWeek = Math.min(Math.max(diffWeeks, 1), 18);

    console.log(`📅 Calculating NFL Week for ${date.toISOString()}`);
    console.log(`   Season Year: ${seasonYear}`);
    console.log(`   Season Start: ${seasonStart.toISOString()}`);
    console.log(`   NFL Week: ${nflWeek}`);

    return nflWeek;
  }

  // ==========================================
  // OPT IN: User opts into weekly competition
  // ==========================================
  async optInToCompetition(userId) {
    try {
      const competition = await this.getCurrentCompetition();

      if (!competition) {
        return {
          success: false,
          message: 'No active competition available'
        };
      }

      const windowOpen = this.isCompetitionWindowOpen(competition);

      if (!windowOpen) {
        return {
          success: false,
          message: 'Competition window is closed'
        };
      }

      // Check user is Premium/VIP
      const userResult = await pool.query(
        'SELECT membership_tier FROM users WHERE id = $1',
        [userId]
      );

      if (userResult.rows.length === 0) {
        return { success: false, message: 'User not found' };
      }

      if (userResult.rows[0].membership_tier === 'free') {
        return {
          success: false,
          message: 'Must upgrade to Premium/VIP to enter competitions'
        };
      }

      // Opt user in
      await pool.query(
        `UPDATE users 
       SET competition_opted_in = TRUE,
           competition_opt_in_date = NOW()
       WHERE id = $1`,
        [userId]
      );

      return {
        success: true,
        message: 'Successfully opted into competition!',
        competition: {
          id: competition.id,
          prizeAmount: parseFloat(competition.prize_amount),
          endsAt: competition.end_datetime
        }
      };

    } catch (error) {
      console.error('Error opting into competition:', error);
      throw error;
    }
  }

  // ==========================================
  // OPT OUT: User opts out of weekly competition
  // All future parlays become free practice
  // ==========================================
  async optOutOfCompetition(userId) {
    try {
      await pool.query(
        `UPDATE users 
       SET competition_opted_in = FALSE,
           competition_opt_out_date = NOW()
       WHERE id = $1`,
        [userId]
      );

      return {
        success: true,
        message: 'Opted out successfully. Future parlays are now free practice parlays.',
        note: 'Your existing competition parlays will still count for this week.'
      };

    } catch (error) {
      console.error('Error opting out of competition:', error);
      throw error;
    }
  }

  // ==========================================
  // RESET: Reset all users opt-in status for new week
  // Called by weekly job on Tuesday 2 AM
  // ==========================================
  async resetWeeklyOptIns() {
    try {
      const result = await pool.query(
        `UPDATE users 
       SET competition_opted_in = FALSE,
           competition_opt_in_date = NULL,
           competition_opt_out_date = NULL
       WHERE competition_opted_in = TRUE`
      );

      console.log(`✅ Reset ${result.rowCount} users' opt-in status for new week`);

      return {
        success: true,
        usersReset: result.rowCount
      };

    } catch (error) {
      console.error('Error resetting weekly opt-ins:', error);
      throw error;
    }
  }
}

export default new CompetitionService();