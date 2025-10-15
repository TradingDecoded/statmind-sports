import cron from "node-cron";
import predictionEngine from "./predictionEngine.js";
import espnDataService from "./espnDataService.js";
import { monitorInjuries } from '../scripts/injury-monitor.js';

console.log("📅 Smart Scheduler initialized...");

// ============================================
// SMART WEEKLY PREDICTION GENERATION
// Generates ONLY the upcoming week AFTER previous week completes
// ============================================

// TUESDAY 8:00 AM - Generate upcoming week predictions
cron.schedule("0 8 * * 2", async () => {
  console.log("⏰ TUESDAY 8 AM: Generating upcoming week predictions...");
  try {
    const { currentWeek, season } = getCurrentWeekInfo();
    
    // Generate predictions for NEXT week (after current week's MNF is done)
    const targetWeek = currentWeek + 1;
    
    if (targetWeek <= 18) {
      console.log(`📊 Season: ${season}, Current Week: ${currentWeek}`);
      console.log(`🎯 Generating Week ${targetWeek} predictions...`);
      
      await predictionEngine.generatePredictions(season, targetWeek);
      
      console.log(`✅ Week ${targetWeek} predictions complete!`);
    } else {
      console.log("🏁 Season complete - no more predictions to generate");
    }
  } catch (error) {
    console.error("❌ Error in Tuesday generation:", error);
  }
});

// Wednesday 8 PM - Injury check
cron.schedule('0 20 * * 3', async () => {
  console.log('🏥 Wednesday 8 PM - Injury check...');
  try {
    await monitorInjuries();
  } catch (error) {
    console.error('❌ Wednesday injury check failed:', error);
  }
});

// Saturday 8 PM - Injury check
cron.schedule('0 20 * * 6', async () => {
  console.log('🏥 Saturday 8 PM - Injury check...');
  try {
    await monitorInjuries();
  } catch (error) {
    console.error('❌ Saturday injury check failed:', error);
  }
});

// ============================================
// EXISTING SCHEDULERS (UNCHANGED)
// ============================================

// Every hour - update game scores
cron.schedule("0 * * * *", async () => {
  console.log("🔁 Updating game scores (hourly)...");
  try {
    const { currentWeek, season } = getCurrentWeekInfo();
    await espnDataService.updateGameScores(season, currentWeek);
  } catch (error) {
    console.error("❌ Error updating scores:", error);
  }
});

// Every 6 hours - refresh schedule
cron.schedule("0 */6 * * *", async () => {
  console.log("📆 Fetching latest schedule (every 6 hours)...");
  try {
    const { currentWeek, season } = getCurrentWeekInfo();
    await espnDataService.fetchSeasonSchedule(season, currentWeek);
  } catch (error) {
    console.error("❌ Error fetching schedule:", error);
  }
});

// Daily at 3 AM - update team statistics
cron.schedule("0 3 * * *", async () => {
  console.log("📊 Updating team statistics (3 AM)...");
  try {
    const { season } = getCurrentWeekInfo();
    await espnDataService.updateTeamStatistics(season);
  } catch (error) {
    console.error("❌ Error updating statistics:", error);
  }
});

// ============================================
// HELPER FUNCTION
// ============================================

function getCurrentWeekInfo() {
  const now = new Date();
  const year = now.getFullYear();
  const season = now.getMonth() >= 8 ? year : year - 1;
  
  const seasonStart = new Date(season, 8, 1); // September 1st
  const weeksDiff = Math.floor((now - seasonStart) / (7 * 24 * 60 * 60 * 1000));
  const currentWeek = Math.min(Math.max(weeksDiff + 1, 1), 18);
  
  return { currentWeek, season };
}

console.log("✅ Smart scheduler ready!");
console.log("📅 Tuesday 8am: Generate upcoming week predictions");
console.log("🏥 Wednesday 8pm: Injury check");
console.log("🏥 Saturday 8pm: Final injury check");