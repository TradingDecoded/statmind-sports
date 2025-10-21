import pool from './src/config/database.js';

async function addUserToStandings() {
  try {
    // Get user's competition parlays
    const parlaysResult = await pool.query(`
      SELECT COUNT(*) as count 
      FROM user_parlays 
      WHERE user_id = 1 
      AND competition_id = 10 
      AND is_practice_parlay = FALSE
    `);
    
    const parlayCount = parseInt(parlaysResult.rows[0].count);
    
    console.log(`User has ${parlayCount} competition parlays`);
    
    // Add user to standings
    const result = await pool.query(`
      INSERT INTO weekly_competition_standings 
      (competition_id, user_id, parlays_entered, total_points, parlays_won, rank)
      VALUES (10, 1, $1, 0, 0, 1)
      ON CONFLICT (competition_id, user_id) 
      DO UPDATE SET
        parlays_entered = $1,
        updated_at = NOW()
      RETURNING *
    `, [parlayCount]);
    
    console.log('✅ Added to standings:', result.rows[0]);
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

addUserToStandings();
