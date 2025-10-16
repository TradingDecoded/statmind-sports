import pool from './src/config/database.js';

async function checkGames() {
  try {
    console.log('\n=== GAMES TABLE STRUCTURE ===');
    const structure = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'games'
      ORDER BY ordinal_position
    `);
    console.log(structure.rows);

    console.log('\n=== SAMPLE GAMES DATA ===');
    const sample = await pool.query('SELECT * FROM games LIMIT 2');
    console.log(sample.rows);

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkGames();
