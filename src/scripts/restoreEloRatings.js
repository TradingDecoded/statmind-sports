// src/scripts/restoreEloRatings.js
import pool from '../config/database.js';

/**
 * RESTORE Original Elo Ratings
 * Reverses the 30% regression we just applied
 * Use this ONLY if you accidentally ran seasonTransition mid-season
 */

async function restoreEloRatings() {
  console.log('\n' + '='.repeat(70));
  console.log('🔄 RESTORING ORIGINAL ELO RATINGS');
  console.log('='.repeat(70));
  console.log('⚠️  Reversing the 30% regression applied during testing');
  console.log('='.repeat(70) + '\n');

  try {
    // Get all teams with their current (regressed) Elo ratings
    const teamsQuery = `
      SELECT team_key, elo_rating
      FROM team_statistics
      ORDER BY elo_rating DESC
    `;
    
    const result = await pool.query(teamsQuery);
    const teams = result.rows;

    console.log(`📋 Processing ${teams.length} teams...\n`);

    const restorations = [];

    // Restore each team's original Elo
    // Reverse formula: oldElo = (newElo - 450) / 0.7
    for (const team of teams) {
      const regressedElo = team.elo_rating;
      const originalElo = Math.round((regressedElo - 450) / 0.7);

      restorations.push({
        team: team.team_key,
        regressedElo,
        originalElo,
        change: originalElo - regressedElo
      });

      // Update the database
      const updateQuery = `
        UPDATE team_statistics
        SET elo_rating = $1
        WHERE team_key = $2
      `;
      
      await pool.query(updateQuery, [originalElo, team.team_key]);
    }

    // Display restorations
    console.log('📊 ELO RESTORATION RESULTS:\n');
    console.log('Team | Regressed | Original | Restored');
    console.log('-'.repeat(70));
    
    restorations.forEach(r => {
      console.log(`${r.team.padEnd(4)} | ${r.regressedElo.toString().padEnd(9)} | ${r.originalElo.toString().padEnd(8)} | +${r.change}`);
    });

    console.log('\n' + '='.repeat(70));
    console.log('✅ ORIGINAL ELO RATINGS RESTORED');
    console.log('='.repeat(70));
    console.log('Your 2025 season Elo ratings are back to pre-test values');
    console.log('The automatic September 1st transition will NOT run until 2026');
    console.log('='.repeat(70) + '\n');

  } catch (error) {
    console.error('❌ ERROR during restoration:', error);
    throw error;
  }
}

// Run the restoration
restoreEloRatings()
  .then(() => {
    console.log('✅ Restoration complete');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Restoration failed:', error);
    process.exit(1);
  });
