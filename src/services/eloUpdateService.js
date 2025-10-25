// src/services/eloUpdateService.js
import pool from '../config/database.js';

class EloUpdateService {
  /**
   * Update Elo ratings for all teams based on completed games
   * Uses standard chess Elo formula with K-factor of 32
   */
  async updateEloRatings(season) {
    try {
      console.log(`🔢 Recalculating Elo ratings for ${season} season...`);

      // Get all teams with their current Elo
      const teamsResult = await pool.query(`
        SELECT team_key, elo_rating 
        FROM team_statistics
      `);
      
      const teamElos = new Map();
      teamsResult.rows.forEach(team => {
        teamElos.set(team.team_key, parseFloat(team.elo_rating) || 1500);
      });

      // Get ALL completed games in chronological order
      const gamesResult = await pool.query(`
        SELECT 
          game_id,
          home_team,
          away_team,
          home_score,
          away_score,
          game_date
        FROM games
        WHERE season = $1
        AND home_score IS NOT NULL
        AND away_score IS NOT NULL
        ORDER BY game_date ASC
      `, [season]);

      console.log(`📊 Processing ${gamesResult.rows.length} completed games...`);

      // Process each game and update Elo progressively
      for (const game of gamesResult.rows) {
        const homeTeam = game.home_team;
        const awayTeam = game.away_team;
        const homeScore = parseInt(game.home_score);
        const awayScore = parseInt(game.away_score);

        // Get current Elo ratings
        const homeElo = teamElos.get(homeTeam) || 1500;
        const awayElo = teamElos.get(awayTeam) || 1500;

        // Calculate expected win probabilities
        const homeExpected = 1 / (1 + Math.pow(10, (awayElo - homeElo) / 400));
        const awayExpected = 1 - homeExpected;

        // Determine actual result (1 = win, 0.5 = tie, 0 = loss)
        let homeActual, awayActual;
        if (homeScore > awayScore) {
          homeActual = 1;
          awayActual = 0;
        } else if (homeScore < awayScore) {
          homeActual = 0;
          awayActual = 1;
        } else {
          homeActual = 0.5;
          awayActual = 0.5;
        }

        // Calculate margin of victory multiplier
        const scoreDiff = Math.abs(homeScore - awayScore);
        const movMultiplier = Math.log(Math.max(scoreDiff, 1) + 1);

        // K-factor (32 is standard for NFL)
        const K = 32;

        // Update Elo ratings
        const homeEloChange = K * movMultiplier * (homeActual - homeExpected);
        const awayEloChange = K * movMultiplier * (awayActual - awayExpected);

        const newHomeElo = homeElo + homeEloChange;
        const newAwayElo = awayElo + awayEloChange;

        // Update in our map
        teamElos.set(homeTeam, newHomeElo);
        teamElos.set(awayTeam, newAwayElo);
      }

      // Write updated Elo ratings back to database
      let updatedCount = 0;
      for (const [teamKey, eloRating] of teamElos.entries()) {
        await pool.query(`
          UPDATE team_statistics
          SET elo_rating = $1
          WHERE team_key = $2
        `, [eloRating, teamKey]);
        updatedCount++;
      }

      console.log(`✅ Updated Elo ratings for ${updatedCount} teams`);
      
      // Show top 5 teams
      const top5 = Array.from(teamElos.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5);
      
      console.log('\n🏆 Top 5 Elo Ratings:');
      top5.forEach(([team, elo], i) => {
        console.log(`   ${i + 1}. ${team}: ${Math.round(elo)}`);
      });
      console.log('');

      return { success: true, updatedCount };

    } catch (error) {
      console.error('❌ Error updating Elo ratings:', error);
      throw error;
    }
  }
}

export default new EloUpdateService();