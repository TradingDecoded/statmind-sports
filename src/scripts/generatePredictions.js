// src/scripts/generatePredictions.js
import predictionEngine from '../services/predictionEngine.js';

async function generatePredictions() {
  console.log('='.repeat(60));
  console.log('🔮 Starting Prediction Generation Process');
  console.log(`📅 ${new Date().toISOString()}`);
  console.log('='.repeat(60));

  try {
    const now = new Date();
    const year = now.getFullYear();
    const season = now.getMonth() >= 8 ? year : year - 1;
    
    const seasonStart = new Date(season, 8, 1);
    const weeksDiff = Math.floor((now - seasonStart) / (7 * 24 * 60 * 60 * 1000));
    const currentWeek = Math.min(Math.max(weeksDiff + 1, 1), 18);
    const targetWeek = Math.min(currentWeek + 1, 18);

    console.log(`📊 Season: ${season}`);
    console.log(`📍 Current Week: ${currentWeek}`);
    console.log(`🎯 Generating predictions for Week: ${targetWeek}`);

    await predictionEngine.generatePredictions(season, targetWeek);

    console.log('\n' + '='.repeat(60));
    console.log('✅ Prediction Generation Complete!');
    console.log('='.repeat(60));

  } catch (error) {
    console.error('\n❌ Error generating predictions:', error);
    throw error;
  }
}

generatePredictions()
  .then(() => {
    console.log('\n✨ Process completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Process failed:', error);
    process.exit(1);
  });