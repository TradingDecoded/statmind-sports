// generate-historical-predictions.js
// Run this to generate predictions for ALL historical completed games

import pool from './src/config/database.js';
import predictionEngine from './src/services/predictionEngine.js';

async function generateHistoricalPredictions() {
  console.log('🎯 StatMind Sports - Historical Predictions Generator');
  console.log('=====================================================');
  console.log('');

  try {
    // Get all completed games WITHOUT predictions (across all seasons)
    const gamesQuery = `
      SELECT g.*
      FROM games g
      LEFT JOIN predictions p ON g.game_id = p.game_id
      WHERE g.home_score IS NOT NULL
        AND g.away_score IS NOT NULL
        AND p.game_id IS NULL
      ORDER BY g.season ASC, g.week ASC, g.game_date ASC
    `;

    const result = await pool.query(gamesQuery);
    const games = result.rows;

    console.log(`📊 Found ${games.length} completed games without predictions`);
    console.log('');

    if (games.length === 0) {
      console.log('✅ All completed games already have predictions!');
      console.log('');
      
      // Show what we have
      const statsQuery = `
        SELECT 
          g.season,
          COUNT(DISTINCT g.game_id) as total_games,
          COUNT(DISTINCT p.game_id) as with_predictions
        FROM games g
        LEFT JOIN predictions p ON g.game_id = p.game_id
        WHERE g.home_score IS NOT NULL
        GROUP BY g.season
        ORDER BY g.season DESC
      `;
      
      const stats = await pool.query(statsQuery);
      console.log('Current prediction coverage:');
      console.table(stats.rows);
      
      process.exit(0);
    }

    // Group by season for progress tracking
    const gamesBySeason = {};
    games.forEach(game => {
      if (!gamesBySeason[game.season]) {
        gamesBySeason[game.season] = [];
      }
      gamesBySeason[game.season].push(game);
    });

    console.log('Games to predict by season:');
    Object.keys(gamesBySeason).sort().forEach(season => {
      console.log(`  ${season}: ${gamesBySeason[season].length} games`);
    });
    console.log('');
    console.log('⏳ Generating predictions... (this may take a few minutes)');
    console.log('');

    let totalGenerated = 0;
    let totalErrors = 0;

    // Process each season
    for (const [season, seasonGames] of Object.entries(gamesBySeason).sort()) {
      console.log(`📅 Processing ${season} season (${seasonGames.length} games)...`);
      
      for (let i = 0; i < seasonGames.length; i++) {
        const game = seasonGames[i];
        
        try {
          // Generate prediction for this game
          const prediction = await predictionEngine.analyzeMatchup(game);
          
          // Save prediction
          await predictionEngine.savePrediction(prediction);
          
          totalGenerated++;
          
          // Show progress every 50 games
          if (totalGenerated % 50 === 0) {
            console.log(`  ✓ ${totalGenerated} predictions generated...`);
          }
        } catch (error) {
          totalErrors++;
          console.error(`  ✗ Failed for game ${game.game_id}: ${error.message}`);
        }
      }
      
      console.log(`  ✅ Completed ${season}: ${seasonGames.length} predictions`);
      console.log('');
    }

    console.log('=====================================================');
    console.log(`✅ Historical prediction generation complete!`);
    console.log(`   Total generated: ${totalGenerated}`);
    console.log(`   Errors: ${totalErrors}`);
    console.log('');

    // Now populate prediction_results for all completed games
    console.log('📊 Populating prediction results...');
    
    const resultsQuery = `
      INSERT INTO prediction_results (game_id, predicted_winner, actual_winner, is_correct)
      SELECT 
        g.game_id,
        p.predicted_winner,
        CASE 
          WHEN g.home_score > g.away_score THEN g.home_team
          WHEN g.away_score > g.home_score THEN g.away_team
          ELSE NULL
        END as actual_winner,
        CASE 
          WHEN g.home_score > g.away_score AND p.predicted_winner = g.home_team THEN TRUE
          WHEN g.away_score > g.home_score AND p.predicted_winner = g.away_team THEN TRUE
          ELSE FALSE
        END as is_correct
      FROM games g
      JOIN predictions p ON g.game_id = p.game_id
      LEFT JOIN prediction_results pr ON g.game_id = pr.game_id
      WHERE g.home_score IS NOT NULL 
        AND g.away_score IS NOT NULL
        AND pr.game_id IS NULL
        AND g.home_score != g.away_score
      ON CONFLICT (game_id) DO NOTHING
    `;

    const resultsInsert = await pool.query(resultsQuery);
    console.log(`✅ Populated ${resultsInsert.rowCount} prediction results`);
    console.log('');

    // Show final statistics
    console.log('📈 Final Statistics by Season:');
    const finalStats = await pool.query(`
      SELECT 
        g.season,
        COUNT(DISTINCT g.game_id) as total_completed_games,
        COUNT(DISTINCT p.game_id) as with_predictions,
        COUNT(DISTINCT pr.game_id) as with_results,
        SUM(CASE WHEN pr.is_correct THEN 1 ELSE 0 END) as correct,
        ROUND(AVG(CASE WHEN pr.is_correct THEN 100.0 ELSE 0 END), 1) as accuracy_pct
      FROM games g
      LEFT JOIN predictions p ON g.game_id = p.game_id
      LEFT JOIN prediction_results pr ON g.game_id = pr.game_id
      WHERE g.home_score IS NOT NULL
      GROUP BY g.season
      ORDER BY g.season DESC
    `);

    console.table(finalStats.rows);
    console.log('');
    console.log('🎉 All done! Your Results page should now show all seasons.');
    console.log('   Visit: https://statmindsports.com/results');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await pool.end();
    process.exit(0);
  }
}

// Run the generator
generateHistoricalPredictions();