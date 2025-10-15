import { checkForKeyInjuries } from './injury-checker.js';
import { exec } from 'child_process';
import util from 'util';
import pool from '../config/database.js';

const execPromise = util.promisify(exec);

/**
 * Regenerate game prediction with injury context
 */
async function regenerateGame(awayTeam, homeTeam, gameId, injuryContext) {
  console.log(`\n🔄 Regenerating: ${awayTeam} @ ${homeTeam}`);
  console.log(`   Reason: ${injuryContext.playerName} (${injuryContext.position}) OUT\n`);

  try {
    // Build command with injury information
    const command = `node src/scripts/regenerate-game.js ${awayTeam} ${homeTeam} "${injuryContext.playerName}" ${injuryContext.position}`;
    
    const { stdout, stderr } = await execPromise(command, {
      cwd: '/root/statmind-sports',
      timeout: 60000
    });

    console.log(stdout);
    if (stderr) console.error('⚠️  Warnings:', stderr);

    // Mark injury as regenerated in database
    await pool.query(
      `UPDATE injury_tracking SET regenerated = TRUE 
       WHERE player_name = $1 AND team_abbreviation = $2 AND game_id = $3`,
      [injuryContext.playerName, injuryContext.teamAbbr, gameId]
    );

    console.log(`✅ Regenerated successfully`);
    return true;
  } catch (error) {
    console.error(`❌ Error:`, error.message);
    return false;
  }
}

/**
 * Main monitoring function
 */
export async function monitorInjuries() {
  console.log('\n🏥 INJURY MONITOR STARTING');
  console.log(`   Time: ${new Date().toLocaleString()}\n`);

  try {
    const injuriesToProcess = await checkForKeyInjuries();

    if (injuriesToProcess.length === 0) {
      console.log('✅ No key injuries - all predictions up to date!\n');
      return;
    }

    console.log(`\n🎯 Found ${injuriesToProcess.length} prediction(s) to regenerate\n`);

    let successCount = 0;
    for (const injury of injuriesToProcess) {
      const success = await regenerateGame(
        injury.awayTeam,
        injury.homeTeam,
        injury.gameId,
        {
          playerName: injury.playerName,
          position: injury.position,
          teamAbbr: injury.teamAbbr
        }
      );

      if (success) successCount++;
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    console.log(`\n✅ COMPLETE: ${successCount}/${injuriesToProcess.length} regenerated\n`);
  } catch (error) {
    console.error('❌ Fatal error:', error);
    throw error;
  }
}

// Allow standalone execution
if (import.meta.url === `file://${process.argv[1]}`) {
  monitorInjuries()
    .then(() => process.exit(0))
    .catch(error => {
      console.error('❌ Error:', error);
      process.exit(1);
    });
}