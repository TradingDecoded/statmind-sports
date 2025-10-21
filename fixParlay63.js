import pool from './src/config/database.js';

async function fix() {
  const result = await pool.query(
    'UPDATE user_parlays SET competition_id = 10 WHERE id = 63 RETURNING *'
  );
  
  console.log('✅ Fixed parlay:', result.rows[0].parlay_name);
  console.log('   Competition ID:', result.rows[0].competition_id);
  
  process.exit();
}

fix();
