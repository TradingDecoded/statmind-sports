// load-2025-data.js
import espnDataService from './src/services/espnDataService.js';

async function load2025Data() {
  try {
    console.log('🚀 Loading 2025 NFL Season Data...\n');
    
    // Step 1: Fetch teams (if not already done)
    console.log('Step 1: Fetching NFL teams...');
    await espnDataService.fetchAndStoreTeams();
    
    // Step 2: Fetch and update scores for weeks 1-6 (already played)
    console.log('\nStep 2: Fetching completed games (Weeks 1-6)...');
    for (let week = 1; week <= 6; week++) {
      await espnDataService.fetchSeasonSchedule(2025, week);
      await espnDataService.updateGameScores(2025, week);
    }
    
    // Step 3: Fetch upcoming games (Weeks 7-18)
    console.log('\nStep 3: Fetching upcoming games (Weeks 7-18)...');
    for (let week = 7; week <= 18; week++) {
      await espnDataService.fetchSeasonSchedule(2025, week);
    }
    
    // Step 4: Calculate team statistics
    console.log('\nStep 4: Calculating team statistics...');
    await espnDataService.updateTeamStatistics(2025);
    
    console.log('\n✅ 2025 Season data loaded successfully!');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error loading data:', error);
    process.exit(1);
  }
}

load2025Data();
