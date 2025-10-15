import cron from "node-cron";
import predictionEngine from "./predictionEngine.js";
import espnDataService from "./espnDataService.js";

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

// WEDNESDAY 8:00 PM - Mid-week injury check
cron.schedule("0 20 * * 3", async () => {
  console.log("⏰ WEDNESDAY 8 PM: Checking for injury updates...");
  try {
    const { currentWeek, season } = getCurrentWeekInfo();
    console.log(`🏥 Scanning for injuries affecting Week ${currentWeek} games...`);
    
    // TODO: Implement injury detection in Phase 2
    console.log("⚠️ Injury monitoring coming soon - use manual regeneration for now");
    
  } catch (error) {
    console.error("❌ Error in Wednesday injury check:", error);
  }
});

// SATURDAY 8:00 PM - Final injury check before Sunday games
cron.schedule("0 20 * * 6", async () => {
  console.log("⏰ SATURDAY 8 PM: Final injury check before Sunday games...");
  try {
    const { currentWeek, season } = getCurrentWeekInfo();
    console.log(`🏥 Final injury scan for Week ${currentWeek} games...`);
    
    // TODO: Implement injury detection in Phase 2
    console.log("⚠️ Injury monitoring coming soon - use manual regeneration for now");
    
  } catch (error) {
    console.error("❌ Error in Saturday injury check:", error);
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