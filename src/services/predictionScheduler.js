import cron from "node-cron";
import { generatePredictions } from "./predictionEngine.js";
import { updateGameScores, fetchSeasonSchedule, updateTeamStatistics } from "./espnDataService.js";

console.log("📅 Scheduler initialized...");

// Temporary mock functions until real services are integrated
export async function updateScores() {
  console.log("✅ (Placeholder) Game scores would be updated here...");
}

export async function fetchSchedule() {
  console.log("✅ (Placeholder) Schedule would be refreshed here...");
}

// 1️⃣  Daily at 6 AM - generate predictions
cron.schedule("0 6 * * *", async () => {
  console.log("⏰ Running daily prediction generation (6 AM)...");
  await generatePredictions();
});

// 2️⃣  Every hour - update game scores
cron.schedule("0 * * * *", async () => {
  console.log("🔁 Updating game scores (hourly)...");
  await updateScores();
});

// 3️⃣  Every 6 hours - refresh schedule
cron.schedule("0 */6 * * *", async () => {
  console.log("📆 Fetching latest schedule (every 6 hours)...");
  await fetchSchedule();
});

// 4️⃣  Daily at 3 AM - update team statistics
cron.schedule("0 3 * * *", async () => {
  console.log("📊 Updating team statistics (3 AM)...");
  await updateTeamStatistics();
});

// Manual run helper (used only for testing)
export async function runNow(which) {
  console.log("🔧 Manual scheduler run triggered for:", which || "all");

  try {
    if (!which || which === "predictions") await generatePredictions?.();
    if (!which || which === "scores") await updateScores?.();
    if (!which || which === "schedule") await fetchSchedule?.();
    if (!which || which === "teamstats") await updateTeamStatistics?.();
    console.log("✅ Manual scheduler run completed:", which || "all");
  } catch (err) {
    console.error("❌ Manual run failed:", err.message);
  }
}

