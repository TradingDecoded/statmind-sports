// ============================================
// StatMind Sports - Leaderboard Service
// Calculate and fetch leaderboard rankings
// ============================================

import pool from '../config/database.js';

class LeaderboardService {

  // ==========================================
  // GET OVERALL LEADERBOARD
  // Top users by win rate (minimum 3 parlays)
  // ==========================================
  async getOverallLeaderboard(limit = 100, page = 1) {
    try {
      const offset = (page - 1) * limit;

      // ==========================================
      // QUERY 1: GET SUMMARY STATS (TOP CARDS)
      // Aggregate stats for all users with 3+ parlays
      // ==========================================
      const summaryResult = await pool.query(
        `SELECT 
          COUNT(DISTINCT u.id) as total_players,
          COALESCE(SUM(s.total_parlays), 0) as total_parlays,
          COALESCE(AVG(s.win_rate), 0) as avg_win_rate,
          COALESCE(MAX(s.best_streak), 0) as best_streak
         FROM users u
         INNER JOIN user_stats s ON u.id = s.user_id
         WHERE s.total_parlays >= 1
           AND u.is_active = true`
      );

      // ==========================================
      // QUERY 2: GET RANKED USERS (LEADERBOARD TABLE)
      // All users with 3+ parlays
      // ==========================================
      const result = await pool.query(
        `SELECT 
          u.id,
          u.username,
          u.display_name,
          u.avatar_url,
          u.membership_tier,
          s.total_parlays,
          s.total_wins,
          s.total_losses,
          s.win_rate,
          s.current_streak,
          s.best_streak,
          s.leg_accuracy,
          ROW_NUMBER() OVER (ORDER BY s.win_rate DESC, s.total_parlays DESC) as rank
         FROM users u
         INNER JOIN user_stats s ON u.id = s.user_id
         WHERE s.total_parlays >= 1
           AND u.is_active = true
         ORDER BY s.win_rate DESC, s.total_parlays DESC
         LIMIT $1 OFFSET $2`,
        [limit, offset]
      );

      // ==========================================
      // QUERY 3: GET TOTAL COUNT (FOR PAGINATION)
      // ==========================================
      const countResult = await pool.query(
        `SELECT COUNT(*) as total
         FROM users u
         INNER JOIN user_stats s ON u.id = s.user_id
         WHERE s.total_parlays >= 1
           AND u.is_active = true`
      );

      // ==========================================
      // RETURN ALL DATA INCLUDING SUMMARY
      // ==========================================
      return {
        summary: {
          totalPlayers: parseInt(summaryResult.rows[0].total_players) || 0,
          totalParlays: parseInt(summaryResult.rows[0].total_parlays) || 0,
          avgWinRate: parseFloat(summaryResult.rows[0].avg_win_rate) || 0,
          bestStreak: parseInt(summaryResult.rows[0].best_streak) || 0
        },
        leaderboard: result.rows,
        total: parseInt(countResult.rows[0].total),
        page,
        limit
      };

    } catch (error) {
      console.error('Error fetching overall leaderboard:', error);
      throw error;
    }
  }

  // ==========================================
  // GET WEEKLY LEADERBOARD (OLD METHOD - KEPT FOR COMPATIBILITY)
  // Top users for parlays created this week
  // ==========================================
  async getWeeklyLeaderboard(limit = 100) {
    try {
      // Calculate start of current week (Sunday)
      const now = new Date();
      const dayOfWeek = now.getDay(); // 0 = Sunday
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - dayOfWeek);
      startOfWeek.setHours(0, 0, 0, 0);

      const result = await pool.query(
        `WITH weekly_stats AS (
          SELECT 
            user_id,
            COUNT(*) as weekly_parlays,
            SUM(CASE WHEN is_hit = true THEN 1 ELSE 0 END) as weekly_wins,
            SUM(CASE WHEN is_hit = false THEN 1 ELSE 0 END) as weekly_losses,
            CASE 
              WHEN COUNT(CASE WHEN is_hit IS NOT NULL THEN 1 END) > 0 
              THEN ROUND((SUM(CASE WHEN is_hit = true THEN 1 ELSE 0 END)::DECIMAL / 
                         COUNT(CASE WHEN is_hit IS NOT NULL THEN 1 END)) * 100, 2)
              ELSE 0 
            END as weekly_win_rate
          FROM user_parlays
          WHERE created_at >= $1
          GROUP BY user_id
        )
        SELECT 
          u.id,
          u.username,
          u.display_name,
          u.avatar_url,
          ws.weekly_parlays,
          ws.weekly_wins,
          ws.weekly_losses,
          ws.weekly_win_rate,
          s.current_streak,
          s.competitions_won,
          ROW_NUMBER() OVER (ORDER BY ws.weekly_win_rate DESC, ws.weekly_parlays DESC) as rank
        FROM users u
        INNER JOIN weekly_stats ws ON u.id = ws.user_id
        INNER JOIN user_stats s ON u.id = s.user_id
        WHERE ws.weekly_parlays >= 1
          AND u.is_active = true
        ORDER BY ws.weekly_win_rate DESC, ws.weekly_parlays DESC
        LIMIT $2`,
        [startOfWeek, limit]
      );

      return {
        leaderboard: result.rows,
        period_start: startOfWeek,
        period_end: now,
        total: result.rows.length
      };

    } catch (error) {
      console.error('Error fetching weekly leaderboard:', error);
      throw error;
    }
  }

  // ==========================================
  // GET COMPETITION LEADERBOARD (NEW FOR PHASE 4)
  // Current week's competition standings with points
  // ==========================================
  async getCompetitionLeaderboard(limit = 100) {
    try {
      // Get current active competition
      const compResult = await pool.query(
        `SELECT * FROM weekly_competitions 
         WHERE status = 'active' 
         ORDER BY created_at DESC 
         LIMIT 1`
      );

      if (compResult.rows.length === 0) {
        return {
          leaderboard: [],
          competition: null,
          total: 0
        };
      }

      const competition = compResult.rows[0];

      // Get standings from weekly_competition_standings
      const result = await pool.query(
        `SELECT 
          wcs.rank,
          wcs.total_points,
          wcs.parlays_entered,
          wcs.parlays_won,
          u.id,
          u.username,
          u.display_name,
          u.avatar_url,
          u.membership_tier,
          s.current_streak
         FROM weekly_competition_standings wcs
         INNER JOIN users u ON wcs.user_id = u.id
         INNER JOIN user_stats s ON u.id = s.user_id
         WHERE wcs.competition_id = $1
           AND u.is_active = true
         ORDER BY wcs.rank ASC
         LIMIT $2`,
        [competition.id, limit]
      );

      return {
        leaderboard: result.rows,
        competition: {
          id: competition.id,
          week_number: competition.week_number,
          nfl_week: competition.nfl_week,
          year: competition.year,
          prize_amount: parseFloat(competition.prize_amount),
          is_rollover: competition.is_rollover,
          start_datetime: competition.start_datetime,
          end_datetime: competition.end_datetime,
          status: competition.status
        },
        total: result.rows.length
      };

    } catch (error) {
      console.error('Error fetching competition leaderboard:', error);
      throw error;
    }
  }

  // ==========================================
  // GET USER'S RANK
  // Find where the current user ranks
  // ==========================================
  async getUserRank(userId) {
    try {
      // Overall rank
      const overallResult = await pool.query(
        `WITH ranked_users AS (
          SELECT 
            u.id,
            ROW_NUMBER() OVER (ORDER BY s.win_rate DESC, s.total_parlays DESC) as rank
          FROM users u
          INNER JOIN user_stats s ON u.id = s.user_id
          WHERE s.total_parlays >= 1
            AND u.is_active = true
        )
        SELECT rank FROM ranked_users WHERE id = $1`,
        [userId]
      );

      // Competition rank
      const compResult = await pool.query(
        `SELECT wc.id 
         FROM weekly_competitions wc 
         WHERE wc.status = 'active' 
         ORDER BY wc.created_at DESC 
         LIMIT 1`
      );

      let competitionRank = null;
      if (compResult.rows.length > 0) {
        const competitionId = compResult.rows[0].id;
        const compRankResult = await pool.query(
          `SELECT rank 
           FROM weekly_competition_standings 
           WHERE competition_id = $1 AND user_id = $2`,
          [competitionId, userId]
        );
        competitionRank = compRankResult.rows[0]?.rank || null;
      }

      // Get total user counts
      const totalOverall = await pool.query(
        `SELECT COUNT(*) as total
         FROM users u
         INNER JOIN user_stats s ON u.id = s.user_id
         WHERE s.total_parlays >= 1
           AND u.is_active = true`
      );

      const totalCompetition = compResult.rows.length > 0
        ? await pool.query(
          `SELECT COUNT(*) as total
             FROM weekly_competition_standings
             WHERE competition_id = $1`,
          [compResult.rows[0].id]
        )
        : { rows: [{ total: 0 }] };

      return {
        overall_rank: overallResult.rows[0]?.rank || null,
        competition_rank: competitionRank,
        total_overall: parseInt(totalOverall.rows[0].total),
        total_competition: parseInt(totalCompetition.rows[0].total),
        percentile_overall: overallResult.rows[0]?.rank
          ? Math.round((1 - (overallResult.rows[0].rank / parseInt(totalOverall.rows[0].total))) * 100)
          : null,
        percentile_competition: competitionRank && parseInt(totalCompetition.rows[0].total) > 0
          ? Math.round((1 - (competitionRank / parseInt(totalCompetition.rows[0].total))) * 100)
          : null
      };

    } catch (error) {
      console.error('Error fetching user rank:', error);
      throw error;
    }
  }

  // ==========================================
  // GET LEADERBOARD STATS
  // Overall platform statistics
  // ==========================================
  async getLeaderboardStats() {
    try {
      const result = await pool.query(
        `SELECT 
          COUNT(DISTINCT u.id) as total_users,
          SUM(s.total_parlays) as total_parlays,
          ROUND(AVG(s.win_rate), 2) as avg_win_rate,
          MAX(s.best_streak) as best_streak_ever,
          MAX(s.current_streak) as current_best_streak
         FROM users u
         INNER JOIN user_stats s ON u.id = s.user_id
         WHERE u.is_active = true
           AND s.total_parlays >= 1`
      );

      return result.rows[0];

    } catch (error) {
      console.error('Error fetching leaderboard stats:', error);
      throw error;
    }
  }

  // ==========================================
  // GET COMPETITION STATS
  // Statistics for current week's competition
  // ==========================================
  async getCompetitionStats() {
    try {
      // Get current active competition
      const compResult = await pool.query(
        `SELECT id FROM weekly_competitions 
         WHERE status = 'active' 
         ORDER BY created_at DESC 
         LIMIT 1`
      );

      if (compResult.rows.length === 0) {
        return {
          total_users: 0,
          total_parlays: 0,
          avg_win_rate: 0,
          best_streak_ever: 0
        };
      }

      const competitionId = compResult.rows[0].id;

      // Get competition-specific stats
      const statsResult = await pool.query(
        `SELECT 
          COUNT(DISTINCT wcs.user_id) as total_users,
          SUM(wcs.parlays_entered) as total_parlays,
          COALESCE(ROUND(AVG(
            CASE 
              WHEN wcs.parlays_entered > 0 
              THEN (wcs.parlays_won::DECIMAL / wcs.parlays_entered) * 100 
              ELSE 0 
            END
          ), 2), 0) as avg_win_rate,
          COALESCE(MAX(s.best_streak), 0) as best_streak_ever
         FROM weekly_competition_standings wcs
         INNER JOIN users u ON wcs.user_id = u.id
         LEFT JOIN user_stats s ON u.id = s.user_id
         WHERE wcs.competition_id = $1
           AND u.is_active = true`,
        [competitionId]
      );

      return statsResult.rows[0];

    } catch (error) {
      console.error('Error fetching competition stats:', error);
      throw error;
    }
  }

  // ==========================================
  // GET REIGNING CHAMPION
  // Get the most recent competition winner
  // ==========================================
  async getReigningChampion() {
    try {
      const result = await pool.query(
        `SELECT 
          wc.winner_user_id,
          wc.winner_points,
          wc.winner_parlays,
          wc.prize_amount,
          wc.nfl_week,
          wc.year,
          wc.completed_at,
          u.username,
          u.display_name,
          u.avatar_url,
          s.competitions_won
         FROM weekly_competitions wc
         INNER JOIN users u ON wc.winner_user_id = u.id
         INNER JOIN user_stats s ON u.id = s.user_id
         WHERE wc.status = 'completed'
           AND wc.winner_user_id IS NOT NULL
         ORDER BY wc.completed_at DESC
         LIMIT 1`
      );

      if (result.rows.length === 0) {
        return null;
      }

      return result.rows[0];

    } catch (error) {
      console.error('Error fetching reigning champion:', error);
      return null;
    }
  }
}

export default new LeaderboardService();