import pool from './src/config/database.js';

async function checkTables() {
  try {
    console.log('\n=== PREDICTION_RESULTS TABLE ===');
    const pr = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'prediction_results'
      ORDER BY ordinal_position
    `);
    console.log(pr.rows);

    console.log('\n=== PREDICTIONS TABLE ===');
    const p = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'predictions'
      ORDER BY ordinal_position
    `);
    console.log(p.rows);

    console.log('\n=== SAMPLE PREDICTION_RESULTS DATA ===');
    const sample = await pool.query('SELECT * FROM prediction_results LIMIT 2');
    console.log(sample.rows);

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkTables();
