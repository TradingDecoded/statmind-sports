import predictionEngine from '../services/predictionEngine.js';
import pool from '../config/database.js';

/**
 * Regenerate prediction for a specific game
 * Usage: node src/scripts/regenerate-game.js AWAY HOME [PLAYER] [POSITION]
 * Example: node src/scripts/regenerate-game.js LV KC "Patrick Mahomes" QB
 */

async function regenerateGame(awayTeam, homeTeam, injuredPlayer = null, position = null) {
  console.log('\n🔄 ========================================');
  console.log(`   REGENERATING PREDICTION`);
  console.log(`   ${awayTeam} @ ${homeTeam}`);
  if (injuredPlayer) {
    console.log(`   🚨 Injury: ${injuredPlayer} (${position}) OUT`);
  }
  console.log('========================================\n');

  try {
    // Find the game
    const gameResult = await pool.query(
      `SELECT id, game_id, season, week, game_date, status 
       FROM games 
       WHERE away_team = $1 AND home_team = $2 
       AND status = 'scheduled'
       ORDER BY game_date ASC 
       LIMIT 1`,
      [awayTeam, homeTeam]
    );

    if (gameResult.rows.length === 0) {
      console.log(`❌ No scheduled game found: ${awayTeam} @ ${homeTeam}`);
      console.log('   Make sure teams use correct abbreviations (e.g., KC, LV, SF)');
      process.exit(1);
    }

    const game = gameResult.rows[0];
    console.log(`✅ Found game:`);
    console.log(`   Game ID: ${game.game_id}`);
    console.log(`   Week: ${game.week}`);
    console.log(`   Date: ${new Date(game.game_date).toLocaleString()}`);
    console.log(`   Status: ${game.status}\n`);

    // Delete old prediction if exists
    const deleteResult = await pool.query(
      'DELETE FROM predictions WHERE game_id = $1',
      [game.game_id]
    );

    if (deleteResult.rowCount > 0) {
      console.log(`🗑️  Deleted old prediction\n`);
    }

    // Build injury context if provided
    let injuryContext = null;
    if (injuredPlayer && position) {
      // Try to determine which team based on player name
      // For manual testing, we'll check both teams' rosters in future
      // For now, let's make it a required 6th parameter
      let teamAbbr = process.argv[6]; // Optional 6th argument
      
      if (!teamAbbr) {
        // If not provided, default to away team but show warning
        teamAbbr = awayTeam;
        console.log(`⚠️  Team not specified for ${injuredPlayer}, defaulting to ${awayTeam}\n`);
      }
      
      injuryContext = {
        playerName: injuredPlayer,
        position: position,
        teamAbbr: teamAbbr
      };
    }

    // Build complete game object with all required properties
    const gameObject = {
      game_id: game.game_id,
      home_team: homeTeam,
      away_team: awayTeam,
      season: game.season,
      week: game.week,
      game_date: game.game_date,
      status: game.status
    };

    // Generate new prediction using SINGLE-GAME function
    console.log(`🤖 Generating new prediction with AI analysis...\n`);
    
    await predictionEngine.generateSingleGamePrediction(gameObject, injuryContext);

    console.log(`✅ New prediction generated!\n`);

    // Show the new prediction
    const predResult = await pool.query(
      `SELECT predicted_winner, home_win_probability, away_win_probability, confidence, reasoning
       FROM predictions 
       WHERE game_id = $1`,
      [game.game_id]
    );

    if (predResult.rows.length > 0) {
      const pred = predResult.rows[0];
      console.log(`📊 NEW PREDICTION:`);
      console.log(`   Winner: ${pred.predicted_winner}`);
      console.log(`   Confidence: ${pred.confidence}`);
      console.log(`   ${homeTeam} Win Probability: ${(pred.home_win_probability * 100).toFixed(1)}%`);
      console.log(`   ${awayTeam} Win Probability: ${(pred.away_win_probability * 100).toFixed(1)}%`);
      console.log(`\n   AI Reasoning Preview:`);
      console.log(`   ${pred.reasoning.substring(0, 300)}...\n`);
    }

    console.log('========================================');
    console.log('✨ REGENERATION COMPLETE');
    console.log('========================================\n');

    process.exit(0);

  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    console.error(error);
    process.exit(1);
  }
}

// Get command line arguments
const awayTeam = process.argv[2];
const homeTeam = process.argv[3];
const injuredPlayer = process.argv[4] || null;
const position = process.argv[5] || null;

if (!awayTeam || !homeTeam) {
  console.log('\n❌ Usage: node src/scripts/regenerate-game.js AWAY HOME [PLAYER] [POSITION] [TEAM]');
  console.log('   Example: node src/scripts/regenerate-game.js LV KC');
  console.log('   Example: node src/scripts/regenerate-game.js LV KC "Patrick Mahomes" QB KC\n');
  process.exit(1);
}

// Run regeneration
regenerateGame(awayTeam.toUpperCase(), homeTeam.toUpperCase(), injuredPlayer, position);