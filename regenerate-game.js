// regenerate-game.js - Manually regenerate a specific game's prediction
import predictionEngine from './src/services/predictionEngine.js';
import pool from './src/config/database.js';

async function regenerateGame(awayTeam, homeTeam) {
  try {
    console.log('🔄 Regenerating prediction...');
    console.log(`🏈 Game: ${awayTeam} @ ${homeTeam}\n`);
    
    // Find the game in database
    const gameQuery = await pool.query(
      `SELECT * FROM games 
       WHERE away_team = $1 AND home_team = $2 
       AND home_score IS NULL
       ORDER BY game_date DESC 
       LIMIT 1`,
      [awayTeam, homeTeam]
    );
    
    if (gameQuery.rows.length === 0) {
      console.log('❌ Game not found or already completed');
      process.exit(1);
    }
    
    const game = gameQuery.rows[0];
    console.log(`✅ Found game: ${game.game_id} (Week ${game.week})`);
    console.log(`📅 Game Date: ${game.game_date}\n`);
    
    // Regenerate prediction with fresh AI analysis
    console.log('🤖 Generating fresh AI analysis...');
    const prediction = await predictionEngine.analyzeMatchup(game);
    
    // Save updated prediction
    await predictionEngine.savePrediction(prediction);
    
    console.log('\n✅ Prediction updated successfully!');
    console.log(`📊 Winner: ${prediction.predicted_winner}`);
    console.log(`🎯 Confidence: ${prediction.confidence}`);
    console.log(`💰 Cost: ~$0.015\n`);
    console.log('📝 New Analysis:');
    console.log(prediction.reasoning);
    
    await pool.end();
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error:', error);
    await pool.end();
    process.exit(1);
  }
}

// Get teams from command line arguments
const args = process.argv.slice(2);

if (args.length !== 2) {
  console.log('Usage: node regenerate-game.js AWAY_TEAM HOME_TEAM');
  console.log('Example: node regenerate-game.js BUF KC');
  console.log('\nTeam Abbreviations:');
  console.log('ARI, ATL, BAL, BUF, CAR, CHI, CIN, CLE, DAL, DEN');
  console.log('DET, GB, HOU, IND, JAX, KC, LAC, LAR, LV, MIA');
  console.log('MIN, NE, NO, NYG, NYJ, PHI, PIT, SEA, SF, TB');
  console.log('TEN, WSH');
  process.exit(1);
}

const [awayTeam, homeTeam] = args;
regenerateGame(awayTeam, homeTeam);
