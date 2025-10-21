import pool from './src/config/database.js';

async function checkLiveGame() {
  try {
    const result = await pool.query(`
      SELECT 
        game_id,
        home_team,
        away_team,
        home_score,
        away_score,
        status,
        is_final,
        updated_at
      FROM games
      WHERE game_id = '401772826'
    `);

    console.log('\n=== HOU @ SEA Game in Database ===');
    if (result.rows.length > 0) {
      const game = result.rows[0];
      console.log('Game ID:', game.game_id);
      console.log('Teams:', game.away_team, '@', game.home_team);
      console.log('Database Score:', game.away_score, '-', game.home_score);
      console.log('Status:', game.status);
      console.log('Is Final:', game.is_final);
      console.log('Last Updated:', game.updated_at);
      console.log('\n🔴 LIVE SCORE FROM ESPN: HOU 12 - 17 SEA');
      
      if (game.home_score === 17 && game.away_score === 12) {
        console.log('✅ Database is UP TO DATE with live score!');
      } else {
        console.log('❌ Database is NOT updated with live score!');
        console.log('   Need to fix the updateGameScores function');
      }
    } else {
      console.log('❌ Game not found in database!');
    }
    
    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkLiveGame();
