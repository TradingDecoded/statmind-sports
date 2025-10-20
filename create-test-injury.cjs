const { Pool } = require('pg');

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'statmind_db',
  user: 'statmind_user',
  password: 'YourStrongPasswordHere'
});

async function createTestInjury() {
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
    console.log(`   Game ID: ${game.game_id}`);
    console.log(`   Internal ID: ${game.id}`);
    
    // Delete any existing injury for this game first
    console.log('\n🧹 Removing any existing injury records for this game...');
    await pool.query('DELETE FROM injury_tracking WHERE game_id = $1', [game.id]);
    
    console.log('🏥 Creating test injury in injury_tracking...');
    await pool.query(`
      INSERT INTO injury_tracking (
        player_name, 
        team_abbreviation, 
        position, 
        injury_status,
        injury_description, 
        game_id, 
        regenerated, 
        detected_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
    `, [
      'Brock Purdy',
      'SF',
      'QB',
      'OUT',
      'Shoulder injury - Ruled OUT',
      game.id,
      true
    ]);
    console.log('✅ Injury tracking record created');
    
    console.log('📊 Updating prediction reasoning...');
    const predResult = await pool.query(`
      UPDATE predictions 
      SET 
        reasoning = '🚨 CRITICAL INJURY UPDATE: Brock Purdy (QB) has been ruled OUT due to a shoulder injury. This significantly impacts SF offensive capabilities. The 49ers will need to rely on their backup quarterback, which affects their passing game efficiency and overall offensive rhythm. ' || COALESCE(reasoning, 'Standard prediction analysis.')
      WHERE game_id = $1
      RETURNING predicted_winner, confidence
    `, [game.game_id]);
    
    if (predResult.rows.length > 0) {
      const pred = predResult.rows[0];
      console.log(`✅ Prediction reasoning updated: ${pred.predicted_winner} predicted to win (${pred.confidence} confidence)`);
    } else {
      console.log('⚠️  No prediction found for game_id:', game.game_id);
      console.log('   The injury is still tracked and will show when the API returns it!');
    }
    
    console.log('\n🎉 TEST INJURY CREATED SUCCESSFULLY!\n');
    console.log('📱 Next steps:');
    console.log('   1. Go to your website and refresh (Ctrl+Shift+R for hard refresh)');
    console.log('   2. Find the ATL @ SF game card');
    console.log('   3. Look for the 🏥 icon on the card');
    console.log('   4. Click the card to open the modal');
    console.log('   5. See the beautiful Injury Impact section!\n');
    console.log('🧹 To remove this test injury later, run:');
    console.log('   node cleanup-test-injury.cjs');
    
  } catch (err) {
    console.error('❌ Error:', err.message);
    console.error(err);
  } finally {
    pool.end();
  }
}

createTestInjury();
