// ============================================
// StatMind Sports - Parlay Resolution Job
// Runs every hour to check and resolve parlays
// ============================================

import cron from 'node-cron';
import parlayResolutionService from '../services/parlayResolutionService.js';

// Run every hour at minute 5
// Example: 12:05, 1:05, 2:05, etc.
const schedule = '5 * * * *';

console.log('📅 Parlay resolution job scheduled (every hour at :05)');

cron.schedule(schedule, async () => {
  console.log('\n⏰ Running scheduled parlay resolution...');
  
  try {
    const result = await parlayResolutionService.resolveAllPendingParlays();
    console.log(`✅ Job complete: ${result.resolved} resolved, ${result.pending} still pending`);
  } catch (error) {
    console.error('❌ Job failed:', error);
  }
});

// Also expose a manual trigger function
export async function runNow() {
  console.log('🚀 Manual parlay resolution triggered');
  return await parlayResolutionService.resolveAllPendingParlays();
}
