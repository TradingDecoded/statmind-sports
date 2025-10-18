// ============================================
// Monthly SMS Bucks Allocation Job
// Runs on 1st of every month at 12:00 AM ET
// ============================================

import membershipService from '../services/membershipService.js';

async function runMonthlyAllocation() {
  console.log('🗓️  Starting monthly SMS Bucks allocation...');
  
  try {
    const result = await membershipService.allocateMonthlyBucks();
    
    console.log('✅ Monthly allocation complete!');
    console.log(`   Premium users: ${result.premiumUsers}`);
    console.log(`   VIP users: ${result.vipUsers}`);
    
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Monthly allocation failed:', error);
    process.exit(1);
  }
}

runMonthlyAllocation();
