const { Pool } = require('pg');

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'statmind_db',
  user: 'statmind_user',
  password: 'YourStrongPasswordHere'
});

async function cleanupTestInjury() {
  try {
    console.log('🔍 Finding ATL @ SF game...');
    
    const gameResult = await pool.query(`
      SELECT id, game_id, home_team, away_team, game_date, week 
      FROM games 
      WHERE (home_team = 'SF' AND away_team = 'ATL') 
         OR (home_team = 'ATL' AND away_team = 'SF')
      ORDER BY game_date DESC 
      LIMIT 1
    `);
    
    if (gameResult.rows.length === 0) {
      console.log('❌ ATL @ SF game not found');
      pool.end();
      return;
    }
    
    const game = gameResult.rows[0];
    console.log(`✅ Found game: ${game.away_team} @ ${game.home_team} (Week ${game.week})`);
    
    console.log('\n🧹 Removing test injury from injury_tracking...');
    const deleteResult = await pool.query('DELETE FROM injury_tracking WHERE game_id = $1', [game.id]);
    console.log(`✅ Injury tracking removed (${deleteResult.rowCount} row(s) deleted)`);
    
    console.log('📊 Cleaning prediction reasoning...');
    const cleanResult = await pool.query(`
      UPDATE predictions 
      SET 
        reasoning = REPLACE(
          REPLACE(reasoning, '🚨 CRITICAL INJURY UPDATE: Brock Purdy (QB) has been ruled OUT due to a shoulder injury. This significantly impacts SF offensive capabilities. The 49ers will need to rely on their backup quarterback, which affects their passing game efficiency and overall offensive rhythm. ', ''),
          '🚨 CRITICAL INJURY UPDATE: Brock Purdy (QB) has been ruled OUT due to a shoulder injury. This significantly impacts SF offensive capabilities. ', ''
        )
      WHERE game_id = $1
      RETURNING predicted_winner
    `, [game.game_id]);
    
    if (cleanResult.rows.length > 0) {
      console.log(`✅ Prediction cleaned (${cleanResult.rowCount} row(s) updated)`);
    } else {
      console.log('⚠️  No prediction found to clean');
    }
    
    console.log('\n🎉 TEST INJURY REMOVED SUCCESSFULLY!\n');
    console.log('📱 The ATL @ SF game card should no longer show the 🏥 icon');
    console.log('   Refresh your website (Ctrl+Shift+R) to see the changes.');
    
  } catch (err) {
    console.error('❌ Error:', err.message);
    console.error(err);
  } finally {
    pool.end();
  }
}

cleanupTestInjury();
