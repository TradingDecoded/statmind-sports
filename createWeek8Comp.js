import pool from './src/config/database.js';

   async function createCompetition() {
     try {
       // Week 8 2025 Competition
       // Competition window: Tuesday Oct 22 at 2:00 AM ET to Sunday Oct 26 at 3:50 PM ET
       
       // Convert ET to UTC (ET is UTC-4 in October)
       const startDateTime = new Date('2025-10-22T06:00:00.000Z'); // 2:00 AM ET = 6:00 AM UTC
       const endDateTime = new Date('2025-10-26T19:50:00.000Z');   // 3:50 PM ET = 7:50 PM UTC
       
       console.log('Creating Week 8 Competition...');
       console.log('Start:', startDateTime.toISOString());
       console.log('End:', endDateTime.toISOString());
       
       const result = await pool.query(`
         INSERT INTO weekly_competitions 
         (year, week_number, season, nfl_week, start_datetime, end_datetime, 
          prize_amount, is_rollover, status, total_participants, total_parlays)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
         ON CONFLICT (year, week_number) 
         DO UPDATE SET
           start_datetime = EXCLUDED.start_datetime,
           end_datetime = EXCLUDED.end_datetime,
           status = EXCLUDED.status,
           nfl_week = EXCLUDED.nfl_week,
           season = EXCLUDED.season
         RETURNING *
       `, [
         2025,                // year
         43,                  // week_number (43rd week of 2025)
         2025,                // season
         8,                   // nfl_week
         startDateTime,       // start_datetime
         endDateTime,         // end_datetime
         50.00,               // prize_amount
         false,               // is_rollover
         'active',            // status
         0,                   // total_participants
         0                    // total_parlays
       ]);
       
       console.log('\n✅ Week 8 Competition Created!');
       console.log(result.rows[0]);
       
       // Verify it's there
       const check = await pool.query(
         "SELECT * FROM weekly_competitions WHERE status = 'active'"
       );
       
       console.log('\n=== ACTIVE COMPETITIONS ===');
       console.log(check.rows);
       
       process.exit(0);
     } catch (error) {
       console.error('❌ Error:', error);
       process.exit(1);
     }
   }

   createCompetition();
