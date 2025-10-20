// src/scripts/updateScores.js
import pool from '../config/database.js';
import espnDataService from '../services/espnDataService.js';

async function updateScores() {
  console.log('='.repeat(60));
  console.log('🔄 Starting Score Update Process');
  console.log(`📅 ${new Date().toISOString()}`);
  console.log('='.repeat(60));

  try {
    // Get current season and week
    const now = new Date();
    const year = now.getFullYear();
    const season = now.getMonth() >= 8 ? year : year - 1;

    // Calculate current week
    const seasonStart = new Date(season, 8, 4);
    const weeksDiff = Math.floor((now - seasonStart) / (7 * 24 * 60 * 60 * 1000));
    const currentWeek = Math.min(Math.max(weeksDiff + 1, 1), 18);

    console.log(`📊 Season: ${season}, Week: ${currentWeek}`);

    // Update scores for current week
    console.log(`\n🏈 Fetching scores for Week ${currentWeek}...`);
    const updated = await espnDataService.updateGameScores(season, currentWeek);
    console.log(`✅ Updated ${updated} game(s)`);

    // Also check previous week in case of Monday night games
    if (currentWeek > 1) {
      console.log(`\n🏈 Checking Week ${currentWeek - 1} for late updates...`);
      const prevUpdated = await espnDataService.updateGameScores(season, currentWeek - 1);
      console.log(`✅ Updated ${prevUpdated} game(s) from previous week`);
    }

    // Update prediction results for completed games
    console.log('\n📈 Updating prediction results...');
    const resultQuery = `
      INSERT INTO prediction_results (game_id, predicted_winner, actual_winner, is_correct, confidence)
      SELECT 
        p.game_id,
        p.predicted_winner,
        CASE 
          WHEN g.home_score > g.away_score THEN g.home_team
          WHEN g.away_score > g.home_score THEN g.away_team
          ELSE NULL
        END as actual_winner,
        CASE 
          WHEN g.home_score > g.away_score AND p.predicted_winner = g.home_team THEN true
          WHEN g.away_score > g.home_score AND p.predicted_winner = g.away_team THEN true
          ELSE false
        END as is_correct,
        p.confidence
      FROM predictions p
      JOIN games g ON p.game_id = g.game_id
      WHERE g.home_score IS NOT NULL 
        AND g.away_score IS NOT NULL
        AND g.season = $1
        AND NOT EXISTS (
          SELECT 1 FROM prediction_results pr WHERE pr.game_id = p.game_id
        )
    `;

    const result = await pool.query(resultQuery, [season]);
    console.log(`✅ Recorded ${result.rowCount} new prediction result(s)`);

    // Show accuracy stats
    const accuracyQuery = `
      SELECT 
        COUNT(*) as total_predictions,
        SUM(CASE WHEN is_correct = true THEN 1 ELSE 0 END) as correct_predictions,
        ROUND(
          (SUM(CASE WHEN is_correct = true THEN 1 ELSE 0 END)::numeric / 
          NULLIF(COUNT(*), 0)) * 100, 
          1
        ) as accuracy_percentage
      FROM prediction_results pr
      JOIN games g ON pr.game_id = g.game_id
      WHERE g.season = $1
    `;

    const accuracyResult = await pool.query(accuracyQuery, [season]);
    const stats = accuracyResult.rows[0];

    console.log('\n📊 Season Accuracy Stats:');
    console.log(`   Total Predictions: ${stats.total_predictions}`);
    console.log(`   Correct: ${stats.correct_predictions}`);
    console.log(`   Accuracy: ${stats.accuracy_percentage}%`);

    console.log('\n' + '='.repeat(60));
    console.log('✅ Score Update Complete!');
    console.log('='.repeat(60));

  } catch (error) {
    console.error('\n❌ Error updating scores:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

// Run the update
updateScores()
  .then(() => {
    console.log('\n✨ Process completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Process failed:', error);
    process.exit(1);
  });