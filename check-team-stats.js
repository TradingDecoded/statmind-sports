import pool from './src/config/database.js';

async function checkTeamStats() {
  try {
    console.log('\n=== TEAM_STATISTICS TABLE STRUCTURE ===');
    const structure = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'team_statistics'
      ORDER BY ordinal_position
    `);
    console.log(structure.rows);

    console.log('\n=== SAMPLE TEAM_STATISTICS DATA ===');
    const sample = await pool.query('SELECT * FROM team_statistics LIMIT 3');
    console.log(sample.rows);

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkTeamStats();
