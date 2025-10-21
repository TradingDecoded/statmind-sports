import pool from './src/config/database.js';

async function check() {
  // Check what the parlay has
  const parlayResult = await pool.query(
    'SELECT year, week_number FROM user_parlays WHERE id = 63'
  );
  
  console.log('Parlay has:', parlayResult.rows[0]);
  
  // Check what competitions exist
  const compResult = await pool.query(
    'SELECT id, year, week_number, nfl_week, status FROM weekly_competitions WHERE status = \'active\''
  );
  
  console.log('Active Competition:', compResult.rows[0]);
  
  process.exit();
}

check();
