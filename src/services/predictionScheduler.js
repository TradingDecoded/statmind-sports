// src/services/predictionScheduler.js
import cron from "node-cron";
import predictionEngine from "./predictionEngine.js";
import espnDataService from './espnDataService.js';
import { monitorInjuries } from '../scripts/injury-monitor.js';
import { seasonTransition } from '../scripts/seasonTransition.js';

console.log("📅 Full-Year Scheduler initialized...");

// ============================================
// SEASON TRANSITION - MARCH 1ST
// Regress Elo ratings 30% toward 1500
// Runs after Super Bowl, before next season starts
// ============================================

cron.schedule("0 6 1 3 *", async () => {
  console.log("🔄 MARCH 1ST: Running season transition...");
  try {
    await seasonTransition();
    console.log("✅ Season transition complete!");
  } catch (error) {
    console.error("❌ Season transition failed:", error);
  }
});

// ============================================
// WEEKLY PREDICTION GENERATION
// Handles regular season (weeks 1-18) AND playoffs (weeks 19-22)
// ============================================

// TUESDAY 8:00 AM - Generate upcoming week predictions
cron.schedule("0 8 * * 2", async () => {
  console.log("⏰ TUESDAY 8 AM: Generating upcoming week predictions...");
  try {
    const { currentWeek, season } = getCurrentWeekInfo();
    
    // Generate predictions for NEXT week (after current week's games complete)
    const targetWeek = currentWeek + 1;
    
    // Handle BOTH regular season (1-18) AND playoffs (19-22)
    if (targetWeek <= 22) {
      const weekType = targetWeek <= 18 ? 'Regular Season' : 'Playoff';
      const playoffRound = getPlayoffRound(targetWeek);
      
      console.log(`📊 Season: ${season}, Current Week: ${currentWeek}`);
      console.log(`🎯 Generating Week ${targetWeek} predictions (${weekType}${playoffRound ? ' - ' + playoffRound : ''})...`);
      
      await predictionEngine.generatePredictions(season, targetWeek);
      
      console.log(`✅ Week ${targetWeek} predictions complete!`);
    } else {
      console.log("🏁 Season complete (Super Bowl finished) - no more predictions");
    }
  } catch (error) {
    console.error("❌ Error in Tuesday generation:", error);
  }
});

// Wednesday 8 PM - Injury check (runs through playoffs)
cron.schedule('0 20 * * 3', async () => {
  console.log('🏥 Wednesday 8 PM - Injury check...');
  try {
    await monitorInjuries();
  } catch (error) {
    console.error('❌ Wednesday injury check failed:', error);
  }
});

// Saturday 8 PM - Final injury check (runs through playoffs)
cron.schedule('0 20 * * 6', async () => {
  console.log('🏥 Saturday 8 PM - Final injury check...');
  try {
    await monitorInjuries();
  } catch (error) {
    console.error('❌ Saturday injury check failed:', error);
  }
});

// ============================================
// CONTINUOUS MONITORING (ALL YEAR)
// ============================================

// Every hour - update game scores (includes playoffs)
cron.schedule("0 * * * *", async () => {
  console.log("🔁 Updating game scores (hourly)...");
  try {
    const { currentWeek, season } = getCurrentWeekInfo();
    
    // Update current week (regular season or playoff)
    if (currentWeek <= 22) {
      await espnDataService.updateGameScores(season, currentWeek);
    }
  } catch (error) {
    console.error("❌ Error updating scores:", error);
  }
});

// Every 6 hours - refresh schedule (includes playoff games)
cron.schedule("0 */6 * * *", async () => {
  console.log("📆 Fetching latest schedule (every 6 hours)...");
  try {
    const { currentWeek, season } = getCurrentWeekInfo();
    
    // Fetch schedule for current week (up through Super Bowl)
    if (currentWeek <= 22) {
      await espnDataService.fetchSeasonSchedule(season, currentWeek);
    }
  } catch (error) {
    console.error("❌ Error fetching schedule:", error);
  }
});

// Daily at 3 AM - update team statistics (year-round)
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
// HELPER FUNCTIONS
// ============================================

function getCurrentWeekInfo() {
  const now = new Date();
  const year = now.getFullYear();
  const season = now.getMonth() >= 8 ? year : year - 1;
  
  const seasonStart = new Date(season, 8, 4); // September 1st
  const weeksDiff = Math.floor((now - seasonStart) / (7 * 24 * 60 * 60 * 1000));
  
  // Weeks 1-18: Regular season
  // Week 19: Wild Card
  // Week 20: Divisional
  // Week 21: Conference Championships
  // Week 22: Super Bowl
  const currentWeek = Math.min(Math.max(weeksDiff + 1, 1), 22);
  
  return { currentWeek, season };
}

function getPlayoffRound(week) {
  const rounds = {
    19: 'Wild Card',
    20: 'Divisional Round',
    21: 'Conference Championships',
    22: 'Super Bowl'
  };
  return rounds[week] || null;
}

console.log("✅ Full-year scheduler ready!");
console.log("📅 Automated tasks:");
console.log("   - March 1st 6am: Elo regression (after Super Bowl)");
console.log("   - Tuesday 8am: Generate upcoming week (regular season + playoffs)");
console.log("   - Wednesday/Saturday 8pm: Injury checks");
console.log("   - Hourly: Game score updates");
console.log("   - Every 6 hours: Schedule refresh");
console.log("   - Daily 3am: Team statistics update");
console.log("🏈 Supports weeks 1-22 (regular season + playoffs)");