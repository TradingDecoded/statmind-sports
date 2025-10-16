// src/scripts/seasonTransition.js
import pool from '../config/database.js';

/**
 * Season Transition Script
 * Runs automatically on March 1st each year (after Super Bowl)
 * 
 * Purpose: Regress Elo ratings 30% toward mean (1500)
 * This accounts for roster turnover, coaching changes, etc.
 * 
 * Formula: newElo = (currentElo * 0.7) + (1500 * 0.3)
 * Example: Team with 1857 Elo → (1857 * 0.7) + (1500 * 0.3) = 1750
 */

const REGRESSION_PERCENT = 0.30; // 30% regression - industry standard

async function seasonTransition() {
  console.log('\n' + '='.repeat(70));
  console.log('🔄 SEASON TRANSITION - ELO REGRESSION');
  console.log('='.repeat(70));
  console.log(`📅 Date: ${new Date().toISOString()}`);
  console.log(`📊 Regression: ${REGRESSION_PERCENT * 100}% toward mean (1500)`);
  console.log('='.repeat(70) + '\n');

  try {
    // Get all teams with their current Elo ratings
    const teamsQuery = `
      SELECT team_key, elo_rating, wins, losses
      FROM team_statistics
      ORDER BY elo_rating DESC
    `;

    const result = await pool.query(teamsQuery);
    const teams = result.rows;

    console.log(`📋 Processing ${teams.length} teams...\n`);

    // Store regression changes for logging
    const changes = [];

    // Regress each team's Elo using configurable percentage
    for (const team of teams) {
      const oldElo = team.elo_rating;
      const keepPercent = 1 - REGRESSION_PERCENT;
      const newElo = Math.round((oldElo * keepPercent) + (1500 * REGRESSION_PERCENT));
      const change = newElo - oldElo;

      changes.push({
        team: team.team_key,
        oldElo,
        newElo,
        change,
        record: `${team.wins}-${team.losses}`
      });

      // Update the database
      const updateQuery = `
        UPDATE team_statistics
        SET elo_rating = $1
        WHERE team_key = $2
      `;

      await pool.query(updateQuery, [newElo, team.team_key]);
    }

    // Display changes
    console.log('📊 ELO REGRESSION RESULTS:\n');
    console.log('Team | Old Elo | New Elo | Change | Last Season Record');
    console.log('-'.repeat(70));

    changes.forEach(c => {
      const sign = c.change >= 0 ? '+' : '';
      console.log(`${c.team.padEnd(4)} | ${c.oldElo.toString().padEnd(7)} | ${c.newElo.toString().padEnd(7)} | ${sign}${c.change.toString().padEnd(6)} | ${c.record}`);
    });

    console.log('\n' + '='.repeat(70));
    console.log('✅ SEASON TRANSITION COMPLETE');
    console.log('='.repeat(70));
    console.log(`📈 Average Elo change: ${Math.round(changes.reduce((sum, c) => sum + Math.abs(c.change), 0) / changes.length)}`);
    console.log(`🏆 New top team: ${changes[0].team} (${changes[0].newElo} Elo)`);
    console.log('='.repeat(70) + '\n');

    // Log to database for transparency
    const logQuery = `
      INSERT INTO system_logs (log_type, message, details)
      VALUES ($1, $2, $3)
    `;

    await pool.query(logQuery, [
      'season_transition',
      'Elo ratings regressed 30% toward 1500',
      JSON.stringify({ date: new Date().toISOString(), changes })
    ]);

    console.log('💾 Changes logged to database\n');

  } catch (error) {
    console.error('❌ ERROR during season transition:', error);
    throw error;
  }
}

// Allow running manually or from scheduler
if (import.meta.url === `file://${process.argv[1]}`) {
  seasonTransition()
    .then(() => {
      console.log('✅ Manual season transition complete');
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ Season transition failed:', error);
      process.exit(1);
    });
}

export { seasonTransition };
