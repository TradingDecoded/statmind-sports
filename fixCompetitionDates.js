import pool from './src/config/database.js';

   async function fixDates() {
     try {
       // Week 8 Competition should have STARTED this morning (Oct 21 at 2 AM ET)
       // and ENDS this Sunday (Oct 26 at 3:50 PM ET)
       
       const startDateTime = new Date('2025-10-21T06:00:00.000Z'); // Oct 21, 2:00 AM ET = 6:00 AM UTC
       const endDateTime = new Date('2025-10-26T19:50:00.000Z');   // Oct 26, 3:50 PM ET = 7:50 PM UTC
       
       console.log('Updating Week 8 Competition dates...');
       console.log('New Start:', startDateTime.toISOString(), '(Oct 21, 2 AM ET)');
       console.log('New End:', endDateTime.toISOString(), '(Oct 26, 3:50 PM ET)');
       
       const result = await pool.query(`
         UPDATE weekly_competitions 
         SET start_datetime = $1,
             end_datetime = $2
         WHERE status = 'active' 
         AND nfl_week = 8
         RETURNING *
       `, [startDateTime, endDateTime]);
       
       console.log('\n✅ Competition dates updated!');
       console.log(result.rows[0]);
       
       // Check if window is now open
       const now = new Date();
       const isOpen = now >= startDateTime && now <= endDateTime;
       console.log('\n=== VERIFICATION ===');
       console.log('Current Time:', now.toISOString());
       console.log('Is Window Open?', isOpen);
       
       process.exit(0);
     } catch (error) {
       console.error('❌ Error:', error);
       process.exit(1);
     }
   }

   fixDates();
