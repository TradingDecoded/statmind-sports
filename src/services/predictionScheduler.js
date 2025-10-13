import cron from "node-cron";
import { generatePredictions } from "./predictionEngine.js";
import { updateGameScores, fetchSeasonSchedule, updateTeamStatistics } from "./espnDataService.js";

console.log("📅 Scheduler initialized...");

// 1️⃣  Daily at 6 AM - generate predictions
cron.schedule("0 6 * * *", async () => {
  console.log("⏰ Running daily prediction generation (6 AM)...");
  await generatePredictions();
});

// 2️⃣  Every hour - update game scores
cron.schedule("0 * * * *", async () => {
  console.log("🔁 Updating game scores (hourly)...");
  await updateGameScores();
});

// 3️⃣  Every 6 hours - refresh schedule
cron.schedule("0 */6 * * *", async () => {
  console.log("📆 Fetching latest schedule (every 6 hours)...");
  await fetchSeasonSchedule();
});

// 4️⃣  Daily at 3 AM - update team statistics
cron.schedule("0 3 * * *", async () => {
  console.log("📊 Updating team statistics (3 AM)...");
  await updateTeamStatistics();
});
