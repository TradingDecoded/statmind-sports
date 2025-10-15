// debug-stats.js
import pool from './src/config/database.js';

async function debug() {
  try {
    const query = `
      SELECT 
        team_key,
        elo_rating,
        offensive_rating,
        defensive_rating,
        wins,
        losses,
        home_wins,
        home_losses,
        away_wins,
        away_losses,
        (wins + losses) as total_games,
        (home_wins + home_losses) as home_games,
        (away_wins + away_losses) as away_games
      FROM team_statistics
      WHERE team_key IN ('KC', 'BUF')
    `;

    const result = await pool.query(query);
    console.log('KC Stats:', JSON.stringify(result.rows[0], null, 2));
    console.log('\nBUF Stats:', JSON.stringify(result.rows[1], null, 2));
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

debug();
