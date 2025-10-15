import cron from "node-cron";
import predictionEngine from "./predictionEngine.js";
import espnDataService from "./espnDataService.js";

console.log("📅 Scheduler initialized...");

// 1️⃣ Daily at 6 AM - generate predictions
cron.schedule("0 6 * * *", async () => {
  console.log("⏰ Running daily prediction generation (6 AM)...");
  try {
    await predictionEngine.generatePredictions(2025);
  } catch (error) {
    console.error("Error generating predictions:", error);
  }
});

// 2️⃣ Every hour - update game scores
cron.schedule("0 * * * *", async () => {
  console.log("🔁 Updating game scores (hourly)...");
  try {
    const currentWeek = 7; // TODO: Make this dynamic
    await espnDataService.updateGameScores(2025, currentWeek);
  } catch (error) {
    console.error("Error updating scores:", error);
  }
});

// 3️⃣ Every 6 hours - refresh schedule
cron.schedule("0 */6 * * *", async () => {
  console.log("📆 Fetching latest schedule (every 6 hours)...");
  try {
    await espnDataService.fetchSeasonSchedule(2025, 8);
  } catch (error) {
    console.error("Error fetching schedule:", error);
  }
});

// 4️⃣ Daily at 3 AM - update team statistics
cron.schedule("0 3 * * *", async () => {
  console.log("📊 Updating team statistics (3 AM)...");
  try {
    await espnDataService.updateTeamStatistics(2025);
  } catch (error) {
    console.error("Error updating statistics:", error);
  }
});