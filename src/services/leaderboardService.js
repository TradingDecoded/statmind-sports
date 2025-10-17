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
      
      // Get ranked users with minimum parlay requirement
      const result = await pool.query(
        `SELECT 
          u.id,
          u.username,
          u.display_name,
          u.avatar_url,
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
         WHERE s.total_parlays >= 3
           AND u.is_active = true
         ORDER BY s.win_rate DESC, s.total_parlays DESC
         LIMIT $1 OFFSET $2`,
        [limit, offset]
      );
      
      // Get total count
      const countResult = await pool.query(
        `SELECT COUNT(*) as total
         FROM users u
         INNER JOIN user_stats s ON u.id = s.user_id
         WHERE s.total_parlays >= 3
           AND u.is_active = true`
      );
      
      return {
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
  // GET WEEKLY LEADERBOARD
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
          WHERE s.total_parlays >= 3
            AND u.is_active = true
        )
        SELECT rank FROM ranked_users WHERE id = $1`,
        [userId]
      );
      
      // Weekly rank
      const now = new Date();
      const dayOfWeek = now.getDay();
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - dayOfWeek);
      startOfWeek.setHours(0, 0, 0, 0);
      
      const weeklyResult = await pool.query(
        `WITH weekly_stats AS (
          SELECT 
            user_id,
            COUNT(*) as weekly_parlays,
            CASE 
              WHEN COUNT(CASE WHEN is_hit IS NOT NULL THEN 1 END) > 0 
              THEN ROUND((SUM(CASE WHEN is_hit = true THEN 1 ELSE 0 END)::DECIMAL / 
                         COUNT(CASE WHEN is_hit IS NOT NULL THEN 1 END)) * 100, 2)
              ELSE 0 
            END as weekly_win_rate
          FROM user_parlays
          WHERE created_at >= $1
          GROUP BY user_id
        ),
        ranked_users AS (
          SELECT 
            ws.user_id,
            ROW_NUMBER() OVER (ORDER BY ws.weekly_win_rate DESC, ws.weekly_parlays DESC) as rank
          FROM weekly_stats ws
          INNER JOIN users u ON u.id = ws.user_id
          WHERE ws.weekly_parlays >= 1
            AND u.is_active = true
        )
        SELECT rank FROM ranked_users WHERE user_id = $2`,
        [startOfWeek, userId]
      );
      
      // Get total user counts
      const totalOverall = await pool.query(
        `SELECT COUNT(*) as total
         FROM users u
         INNER JOIN user_stats s ON u.id = s.user_id
         WHERE s.total_parlays >= 3
           AND u.is_active = true`
      );
      
      const totalWeekly = await pool.query(
        `SELECT COUNT(DISTINCT user_id) as total
         FROM user_parlays
         WHERE created_at >= $1`,
        [startOfWeek]
      );
      
      return {
        overall_rank: overallResult.rows[0]?.rank || null,
        weekly_rank: weeklyResult.rows[0]?.rank || null,
        total_overall: parseInt(totalOverall.rows[0].total),
        total_weekly: parseInt(totalWeekly.rows[0].total),
        percentile_overall: overallResult.rows[0]?.rank 
          ? Math.round((1 - (overallResult.rows[0].rank / parseInt(totalOverall.rows[0].total))) * 100)
          : null,
        percentile_weekly: weeklyResult.rows[0]?.rank
          ? Math.round((1 - (weeklyResult.rows[0].rank / parseInt(totalWeekly.rows[0].total))) * 100)
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
         WHERE u.is_active = true`
      );
      
      return result.rows[0];
      
    } catch (error) {
      console.error('Error fetching leaderboard stats:', error);
      throw error;
    }
  }
}

export default new LeaderboardService();
