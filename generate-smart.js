// generate-smart.js - Only generates current + next week
import predictionEngine from './src/services/predictionEngine.js';

async function generateSmart() {
  try {
    console.log('🎯 SMART GENERATION - Current + Next Week Only\n');
    console.log('='.repeat(60));
    
    const now = new Date();
    const year = now.getFullYear();
    const season = now.getMonth() >= 8 ? year : year - 1;
    
    const seasonStart = new Date(season, 8, 1);
    const weeksDiff = Math.floor((now - seasonStart) / (7 * 24 * 60 * 60 * 1000));
    const currentWeek = Math.min(Math.max(weeksDiff + 1, 1), 18);
    
    console.log(`📊 Season: ${season}`);
    console.log(`📍 Current Week: ${currentWeek}`);
    console.log(`🎯 Target Weeks: ${currentWeek} & ${currentWeek + 1}`);
    console.log('='.repeat(60) + '\n');
    
    // Current week
    console.log(`Generating Week ${currentWeek}...`);
    const week1 = await predictionEngine.generatePredictions(season, currentWeek);
    console.log(`✅ Week ${currentWeek}: ${week1.length} predictions\n`);
    
    // Next week
    if (currentWeek < 18) {
      console.log(`Generating Week ${currentWeek + 1}...`);
      const week2 = await predictionEngine.generatePredictions(season, currentWeek + 1);
      console.log(`✅ Week ${currentWeek + 1}: ${week2.length} predictions\n`);
    }
    
    console.log('='.repeat(60));
    console.log('🎉 Smart generation complete!');
    console.log(`💰 Cost: ~$${((week1.length + (currentWeek < 18 ? 16 : 0)) * 0.015).toFixed(2)}`);
    console.log('='.repeat(60));
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

generateSmart();
