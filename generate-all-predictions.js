// generate-all-predictions.js
import predictionEngine from './src/services/predictionEngine.js';

async function generateAll() {
  try {
    console.log('🎯 Generating predictions for all upcoming weeks...\n');
    
    // Generate predictions for weeks 7-18
    for (let week = 7; week <= 18; week++) {
      console.log(`\n📊 Generating Week ${week} predictions...`);
      const predictions = await predictionEngine.generatePredictions(2025, week);
      console.log(`✅ Week ${week}: ${predictions.length} predictions generated`);
    }
    
    console.log('\n🎉 All predictions generated successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

generateAll();
