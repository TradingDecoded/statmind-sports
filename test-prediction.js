// test-prediction.js
import predictionEngine from './src/services/predictionEngine.js';
import pool from './src/config/database.js';

async function test() {
  try {
    console.log('🧪 Testing prediction engine for Week 7...\n');
    
    // Generate predictions for Week 7
    const predictions = await predictionEngine.generatePredictions(2025, 7);
    
    console.log(`\n✅ Generated ${predictions.length} predictions\n`);
    
    // Fetch game details for better display
    for (const p of predictions) {
      const gameQuery = await pool.query(
        'SELECT home_team, away_team FROM games WHERE game_id = $1',
        [p.game_id]
      );
      const game = gameQuery.rows[0];
      
      console.log(`\n📊 ${game.away_team} @ ${game.home_team}`);
      console.log(`   Winner: ${p.predicted_winner}`);
      console.log(`   Confidence: ${p.confidence}`);
      console.log(`   Win Probability: ${Math.round(Math.max(p.home_win_probability, p.away_win_probability) * 100)}%`);
      console.log(`   ${p.reasoning}`);
    }
    
    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Test failed:', error);
    await pool.end();
    process.exit(1);
  }
}

test();