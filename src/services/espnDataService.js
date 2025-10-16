// src/services/espnDataService.js
import pool from '../config/database.js';

const ESPN_BASE_URL = 'https://site.api.espn.com/apis/site/v2/sports/football/nfl';

class ESPNDataService {

  /**
   * Fetch and store all NFL teams
   */
  async fetchAndStoreTeams() {
    try {
      console.log('📥 Fetching NFL teams from ESPN...');

      const response = await fetch(`${ESPN_BASE_URL}/teams`);
      const data = await response.json();

      const teams = data.sports[0].leagues[0].teams;
      let stored = 0;

      for (const teamWrapper of teams) {
        const team = teamWrapper.team;

        const query = `
          INSERT INTO teams (team_id, key, name, city, conference, division)
          VALUES ($1, $2, $3, $4, $5, $6)
          ON CONFLICT (team_id) 
          DO UPDATE SET
            key = EXCLUDED.key,
            name = EXCLUDED.name,
            city = EXCLUDED.city,
            conference = EXCLUDED.conference,
            division = EXCLUDED.division
        `;

        const values = [
          team.id,
          team.abbreviation,
          team.displayName,
          team.location,
          team.groups?.name || null,
          team.groups?.parent?.name || null
        ];

        await pool.query(query, values);
        stored++;
      }

      console.log(`✅ Stored ${stored} NFL teams`);
      return stored;
    } catch (error) {
      console.error('Error fetching teams:', error);
      throw error;
    }
  }

  /**
   * Fetch season schedule for a specific week
   */
  async fetchSeasonSchedule(season, week) {
    try {
      const year = season;
      const seasonType = week <= 18 ? 2 : 3; // Regular season (2) or Playoffs (3)
      const espnWeek = week <= 18 ? week : week - 18; // Playoffs use weeks 1-4

      const response = await fetch(
        `${ESPN_BASE_URL}/scoreboard?dates=${year}&seasontype=${seasonType}&week=${espnWeek}`
      );
      const data = await response.json();

      const events = data.events || [];
      let stored = 0;

      for (const event of events) {
        const competition = event.competitions[0];
        const homeTeam = competition.competitors.find(c => c.homeAway === 'home');
        const awayTeam = competition.competitors.find(c => c.homeAway === 'away');

        const query = `
          INSERT INTO games (
            game_id, season, week, game_date,
            home_team, away_team, home_score, away_score
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
          ON CONFLICT (game_id) 
          DO UPDATE SET
            game_date = EXCLUDED.game_date,
            home_score = EXCLUDED.home_score,
            away_score = EXCLUDED.away_score
        `;

        const values = [
          event.id,
          year,
          week,
          event.date,
          homeTeam.team.abbreviation,
          awayTeam.team.abbreviation,
          competition.status.type.completed ? parseInt(homeTeam.score) : null,
          competition.status.type.completed ? parseInt(awayTeam.score) : null
        ];

        await pool.query(query, values);
        stored++;
      }

      console.log(`✅ Stored ${stored} games for Week ${week}`);
      return stored;
    } catch (error) {
      console.error(`Error fetching schedule for week ${week}:`, error);
      throw error;
    }
  }

  /**
 * Update scores for completed games
 */
  async updateGameScores(season, week) {
    try {
      console.log(`🔄 Updating scores for ${season} Week ${week}...`);

      const year = season;
      const seasonType = week <= 18 ? 2 : 3; // Regular season (2) or Playoffs (3)
      const espnWeek = week <= 18 ? week : week - 18; // Playoffs use weeks 1-4

      const response = await fetch(
        `${ESPN_BASE_URL}/scoreboard?dates=${year}&seasontype=${seasonType}&week=${espnWeek}`
      );
      const data = await response.json();

      const events = data.events || [];
      let updated = 0;

      for (const event of events) {
        const competition = event.competitions[0];

        // Only update if game is completed
        if (competition.status.type.completed) {
          const homeTeam = competition.competitors.find(c => c.homeAway === 'home');
          const awayTeam = competition.competitors.find(c => c.homeAway === 'away');

          const query = `
          UPDATE games 
          SET home_score = $1, away_score = $2
          WHERE game_id = $3 AND home_score IS NULL
          RETURNING game_id
        `;

          const values = [
            parseInt(homeTeam.score),
            parseInt(awayTeam.score),
            event.id
          ];

          const result = await pool.query(query, values);
          if (result.rows.length > 0) {
            updated++;
            console.log(`  ✓ Updated: ${homeTeam.team.abbreviation} ${homeTeam.score} - ${awayTeam.score} ${awayTeam.team.abbreviation}`);
          }
        }
      }

      console.log(`✅ Updated ${updated} game scores`);
      return updated;
    } catch (error) {
      console.error('Error updating game scores:', error);
      throw error;
    }
  }

  /**
   * Calculate and update team statistics based on completed games
   */
  async updateTeamStatistics(season) {
    try {
      console.log(`📊 Updating team statistics for ${season} season...`);

      // Get all teams
      const teamsResult = await pool.query('SELECT key FROM teams');
      const teams = teamsResult.rows;

      let updated = 0;

      for (const team of teams) {
        const teamKey = team.key;

        // Calculate statistics from completed games
        const statsQuery = `
          WITH team_games AS (
            SELECT 
              CASE WHEN home_team = $1 THEN home_score ELSE away_score END as team_score,
              CASE WHEN home_team = $1 THEN away_score ELSE home_score END as opp_score,
              CASE WHEN home_team = $1 THEN 'home' ELSE 'away' END as location,
              home_team, away_team
            FROM games
            WHERE season = $2 
              AND (home_team = $1 OR away_team = $1)
              AND home_score IS NOT NULL
          )
          SELECT 
            COUNT(*) as total_games,
            SUM(CASE WHEN team_score > opp_score THEN 1 ELSE 0 END) as wins,
            SUM(CASE WHEN team_score < opp_score THEN 1 ELSE 0 END) as losses,
            SUM(CASE WHEN team_score = opp_score THEN 1 ELSE 0 END) as ties,
            SUM(team_score) as points_for,
            SUM(opp_score) as points_against,
            SUM(CASE WHEN location = 'home' AND team_score > opp_score THEN 1 ELSE 0 END) as home_wins,
            SUM(CASE WHEN location = 'home' AND team_score < opp_score THEN 1 ELSE 0 END) as home_losses,
            SUM(CASE WHEN location = 'away' AND team_score > opp_score THEN 1 ELSE 0 END) as away_wins,
            SUM(CASE WHEN location = 'away' AND team_score < opp_score THEN 1 ELSE 0 END) as away_losses,
            AVG(team_score) as avg_points_for,
            AVG(opp_score) as avg_points_against
          FROM team_games
        `;

        const statsResult = await pool.query(statsQuery, [teamKey, season]);
        const stats = statsResult.rows[0];

        if (parseInt(stats.total_games) === 0) {
          continue; // Skip teams with no games played
        }

        // Calculate ratings (simple version - can be enhanced)
        const offensiveRating = Math.min(100, (parseFloat(stats.avg_points_for) / 35) * 100);
        const defensiveRating = Math.max(0, 100 - ((parseFloat(stats.avg_points_against) / 35) * 100));

        // Get current Elo or initialize to 1500
        const eloQuery = `
          SELECT elo_rating FROM team_statistics 
          WHERE team_key = $1
        `;
        const eloResult = await pool.query(eloQuery, [teamKey]);
        const currentElo = eloResult.rows.length > 0
          ? parseFloat(eloResult.rows[0].elo_rating)
          : 1500;

        // Update team statistics
        const updateQuery = `
          INSERT INTO team_statistics (
            team_key, wins, losses, ties, points_for, points_against,
            home_wins, home_losses, away_wins, away_losses,
            offensive_rating, defensive_rating, elo_rating
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
          ON CONFLICT (team_key)
          DO UPDATE SET
            wins = EXCLUDED.wins,
            losses = EXCLUDED.losses,
            ties = EXCLUDED.ties,
            points_for = EXCLUDED.points_for,
            points_against = EXCLUDED.points_against,
            home_wins = EXCLUDED.home_wins,
            home_losses = EXCLUDED.home_losses,
            away_wins = EXCLUDED.away_wins,
            away_losses = EXCLUDED.away_losses,
            offensive_rating = EXCLUDED.offensive_rating,
            defensive_rating = EXCLUDED.defensive_rating,
            elo_rating = EXCLUDED.elo_rating,
            last_updated = CURRENT_TIMESTAMP
        `;

        const updateValues = [
          teamKey,
          parseInt(stats.wins),
          parseInt(stats.losses),
          parseInt(stats.ties),
          parseInt(stats.points_for),
          parseInt(stats.points_against),
          parseInt(stats.home_wins),
          parseInt(stats.home_losses),
          parseInt(stats.away_wins),
          parseInt(stats.away_losses),
          offensiveRating,
          defensiveRating,
          currentElo
        ];

        await pool.query(updateQuery, updateValues);
        updated++;
      }

      console.log(`✅ Updated statistics for ${updated} teams`);
      return updated;
    } catch (error) {
      console.error('Error updating team statistics:', error);
      throw error;
    }
  }

  /**
   * Fetch all weeks of a season (convenience method)
   */
  async fetchFullSeason(year, startWeek = 1, endWeek = 18) {
    try {
      console.log(`📥 Fetching full season ${year} (weeks ${startWeek}-${endWeek})...`);

      for (let week = startWeek; week <= endWeek; week++) {
        await this.fetchSeasonSchedule(year, week);
        await this.updateGameScores(year, week);
      }

      // Update statistics after fetching all weeks
      await this.updateTeamStatistics(year);

      console.log(`✅ Full season ${year} loaded successfully`);
    } catch (error) {
      console.error('Error fetching full season:', error);
      throw error;
    }
  }
}

// Export singleton instance
const espnDataService = new ESPNDataService();
export default espnDataService;