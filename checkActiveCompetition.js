import pool from './src/config/database.js';

   async function checkCompetition() {
     try {
       const result = await pool.query(`
         SELECT id, year, week_number, nfl_week, 
                start_datetime, end_datetime, 
                prize_amount, status, created_at
         FROM weekly_competitions 
         WHERE status = 'active'
         ORDER BY created_at DESC
       `);
       
       console.log('\n=== ACTIVE COMPETITIONS ===');
       console.log(result.rows);
       
       if (result.rows.length > 0) {
         const comp = result.rows[0];
         const now = new Date();
         const start = new Date(comp.start_datetime);
         const end = new Date(comp.end_datetime);
         
         console.log('\n=== TIME CHECK ===');
         console.log('Current Time:', now.toISOString());
         console.log('Competition Start:', start.toISOString());
         console.log('Competition End:', end.toISOString());
         console.log('Is Window Open?', now >= start && now <= end);
       }
       
       process.exit(0);
     } catch (error) {
       console.error('Error:', error);
       process.exit(1);
     }
   }

   checkCompetition();
