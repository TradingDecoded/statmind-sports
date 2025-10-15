import axios from 'axios';
import pool from '../config/database.js';

// ESPN Team ID mapping
const ESPN_TEAM_IDS = {
  'ARI': 22, 'ATL': 1, 'BAL': 33, 'BUF': 2, 'CAR': 29, 'CHI': 3,
  'CIN': 4, 'CLE': 5, 'DAL': 6, 'DEN': 7, 'DET': 8, 'GB': 9,
  'HOU': 34, 'IND': 11, 'JAX': 30, 'KC': 12, 'LV': 13, 'LAC': 24,
  'LAR': 14, 'MIA': 15, 'MIN': 16, 'NE': 17, 'NO': 18, 'NYG': 19,
  'NYJ': 20, 'PHI': 21, 'PIT': 23, 'SF': 25, 'SEA': 26, 'TB': 27,
  'TEN': 10, 'WAS': 28
};

/**
 * Fetch injury data from ESPN
 */
async function fetchTeamInjuries(teamAbbr) {
  const espnId = ESPN_TEAM_IDS[teamAbbr];
  if (!espnId) return [];

  try {
    const url = `http://site.api.espn.com/apis/site/v2/sports/football/nfl/teams/${espnId}/injuries`;
    const response = await axios.get(url, { timeout: 10000 });
    
    if (!response.data?.injuries) return [];

    return response.data.injuries.map(injury => ({
      playerName: injury.athlete?.displayName || 'Unknown',
      position: injury.athlete?.position?.abbreviation || 'Unknown',
      status: injury.status || 'Unknown',
      description: injury.details?.type || 'Undisclosed',
      teamAbbr
    }));
  } catch (error) {
    console.error(`❌ Error fetching ${teamAbbr}:`, error.message);
    return [];
  }
}

/**
 * Check if player is "key"
 */
async function isKeyPlayer(playerName, teamAbbr, position) {
  if (position === 'QB') return true;

  try {
    if (position === 'RB') {
      const result = await pool.query(
        `SELECT rushing_yards, games_played FROM team_statistics 
         WHERE team_abbreviation = $1 AND season = 2024`,
        [teamAbbr]
      );
      if (result.rows.length > 0) {
        const yardsPerGame = result.rows[0].rushing_yards / result.rows[0].games_played;
        if (yardsPerGame >= 60) {
          console.log(`   ✓ ${playerName} is key RB (${yardsPerGame.toFixed(1)} yds/g)`);
          return true;
        }
      }
    }

    if (position === 'WR') {
      const result = await pool.query(
        `SELECT passing_yards, games_played FROM team_statistics 
         WHERE team_abbreviation = $1 AND season = 2024`,
        [teamAbbr]
      );
      if (result.rows.length > 0) {
        const yardsPerGame = result.rows[0].passing_yards / result.rows[0].games_played;
        if (yardsPerGame >= 200) {
          console.log(`   ✓ ${playerName} is key WR (${yardsPerGame.toFixed(1)} pass yds/g)`);
          return true;
        }
      }
    }

    if (['DE', 'LB', 'DT'].includes(position)) {
      const result = await pool.query(
        `SELECT sacks FROM team_statistics 
         WHERE team_abbreviation = $1 AND season = 2024`,
        [teamAbbr]
      );
      if (result.rows.length > 0 && result.rows[0].sacks >= 15) {
        console.log(`   ✓ ${playerName} is key defender (${result.rows[0].sacks} team sacks)`);
        return true;
      }
    }

    return false;
  } catch (error) {
    console.error(`❌ Error checking key player:`, error.message);
    return false;
  }
}

/**
 * Find upcoming games
 */
async function findUpcomingGames(teamAbbr) {
  try {
    const result = await pool.query(
      `SELECT id, away_team, home_team, game_date 
       FROM games 
       WHERE (away_team = $1 OR home_team = $1)
       AND status = 'scheduled'
       AND game_date > NOW()
       ORDER BY game_date ASC LIMIT 2`,
      [teamAbbr]
    );
    return result.rows;
  } catch (error) {
    console.error(`❌ Error finding games:`, error.message);
    return [];
  }
}

/**
 * Save injury to database
 */
async function saveInjury(injury, gameId) {
  try {
    await pool.query(
      `INSERT INTO injury_tracking 
       (player_name, team_abbreviation, position, injury_status, injury_description, game_id)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (player_name, team_abbreviation, game_id) DO NOTHING`,
      [injury.playerName, injury.teamAbbr, injury.position, injury.status, injury.description, gameId]
    );
  } catch (error) {
    console.error(`❌ Error saving injury:`, error.message);
  }
}

/**
 * Main function
 */
export async function checkForKeyInjuries() {
  console.log('\n🏥 INJURY DETECTION STARTING\n');

  const injuriesRequiringRegeneration = [];
  const allTeams = Object.keys(ESPN_TEAM_IDS);

  for (const teamAbbr of allTeams) {
    const injuries = await fetchTeamInjuries(teamAbbr);
    const outInjuries = injuries.filter(inj => inj.status.toLowerCase().includes('out'));

    if (outInjuries.length === 0) {
      console.log(`✓ ${teamAbbr}: No players OUT`);
      continue;
    }

    console.log(`\n🚨 ${teamAbbr}: ${outInjuries.length} player(s) OUT`);

    for (const injury of outInjuries) {
      console.log(`   Checking: ${injury.playerName} (${injury.position})`);
      
      const isKey = await isKeyPlayer(injury.playerName, teamAbbr, injury.position);
      if (!isKey) {
        console.log(`   ⏭️  Not a key player`);
        continue;
      }

      const games = await findUpcomingGames(teamAbbr);
      if (games.length === 0) continue;

      for (const game of games) {
        // Check if already tracked
        const existing = await pool.query(
          `SELECT id FROM injury_tracking 
           WHERE player_name = $1 AND team_abbreviation = $2 AND game_id = $3`,
          [injury.playerName, teamAbbr, game.id]
        );

        if (existing.rows.length > 0) {
          console.log(`   ⏭️  Already tracked`);
          continue;
        }

        await saveInjury(injury, game.id);

        injuriesRequiringRegeneration.push({
          gameId: game.id,
          awayTeam: game.away_team,
          homeTeam: game.home_team,
          gameDate: game.game_date,
          playerName: injury.playerName,
          position: injury.position,
          teamAbbr,
          injuryDescription: injury.description
        });

        console.log(`   🎯 REGENERATION NEEDED`);
      }
    }

    await new Promise(resolve => setTimeout(resolve, 500));
  }

  console.log(`\n✅ SUMMARY: ${injuriesRequiringRegeneration.length} game(s) to regenerate\n`);
  return injuriesRequiringRegeneration;
}