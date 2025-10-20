// ============================================
// Weekly Competition Winner Determination Job
// Runs every Tuesday at 2:00 AM ET
// ============================================

import competitionService from '../services/competitionService.js';

async function runWeeklyWinner() {
  console.log('🏆 Starting weekly winner determination...');

  try {
    const result = await competitionService.determineWeeklyWinner();

    if (!result.success) {
      console.log(`⚠️  ${result.message}`);
      process.exit(0);
    }

    // Reset all users' opt-in status for the new week
    console.log('🔄 Resetting weekly opt-ins...');
    await competitionService.resetWeeklyOptIns();

    if (result.minimumMet) {
      console.log('✅ Weekly winner determined!');
      console.log(`   Winner: User ${result.winner.userId}`);
      console.log(`   Points: ${result.winner.points}`);
      console.log(`   Prize: $${result.winner.prizeAmount}`);
    } else {
      console.log('⚠️  Minimum entries not met. Prize rolled over.');
      console.log(`   New prize pool: $${result.newPrize}`);
    }

    process.exit(0);

  } catch (error) {
    console.error('❌ Weekly winner determination failed:', error);
    process.exit(1);
  }
}

runWeeklyWinner();
