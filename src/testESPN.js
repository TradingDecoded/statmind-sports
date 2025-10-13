import espnDataService from "./services/espnDataService.js";

// Example: fetch teams and first week's schedule
(async () => {
  await espnDataService.fetchAndStoreTeams();
  await espnDataService.fetchSeasonSchedule(2025, 1);
})();
