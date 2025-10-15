import pool from './src/config/database.js';

async function loadSeason(season) {
  console.log(`\n📥 Loading ${season} season...`);
  
  // Determine number of weeks (2021+ has 18 weeks, 2020 and earlier has 17)
  const maxWeek = season >= 2021 ? 18 : 17;
  
  let totalGames = 0;
  
  for (let week = 1; week <= maxWeek; week++) {
    try {
      const url = `https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard?dates=${season}&seasontype=2&week=${week}`;
      
      const response = await fetch(url);
      
      if (!response.ok) {
        console.log(`⚠️  Week ${week}: ESPN returned ${response.status}`);
        continue;
      }
      
      const data = await response.json();
      const games = data.events || [];
      
      let stored = 0;
      
      for (const event of games) {
        const comp = event.competitions[0];
        const home = comp.competitors.find(t => t.homeAway === 'home');
        const away = comp.competitors.find(t => t.homeAway === 'away');
        
        if (!home || !away) continue;
        
        const gameData = {
          game_id: event.id,
          season: season,
          week: week,
          game_date: new Date(event.date),
          home_team: home.team.abbreviation,
          away_team: away.team.abbreviation,
          home_score: event.status.type.completed ? parseInt(home.score) : null,
          away_score: event.status.type.completed ? parseInt(away.score) : null,
          status: event.status.type.name,
          is_final: event.status.type.completed
        };
        
        const query = `
          INSERT INTO games (game_id, season, week, game_date, home_team, away_team, home_score, away_score, status, is_final)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
          ON CONFLICT (game_id) DO UPDATE SET
            home_score = EXCLUDED.home_score,
            away_score = EXCLUDED.away_score,
            status = EXCLUDED.status,
            is_final = EXCLUDED.is_final
        `;
        
        await pool.query(query, [
          gameData.game_id, gameData.season, gameData.week, gameData.game_date,
          gameData.home_team, gameData.away_team, gameData.home_score,
          gameData.away_score, gameData.status, gameData.is_final
        ]);
        
        stored++;
      }
      
      totalGames += stored;
      console.log(`  Week ${week}: ${stored} games`);
      
      // Rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));
      
    } catch (error) {
      console.error(`  Week ${week} error:`, error.message);
    }
  }
  
  console.log(`✅ ${season} complete: ${totalGames} games loaded`);
  return totalGames;
}

async function loadAllHistoricalSeasons() {
  console.log('🏈 Loading Historical NFL Seasons (2020-2023)\n');
  console.log('This will take about 5 minutes due to API rate limiting...\n');
  
  const seasons = [2020, 2021, 2022, 2023];
  const results = {};
  
  for (const season of seasons) {
    results[season] = await loadSeason(season);
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('📊 Loading Summary:');
  console.log('='.repeat(60));
  
  Object.entries(results).forEach(([season, count]) => {
    console.log(`  ${season}: ${count} games`);
  });
  
  const total = Object.values(results).reduce((sum, count) => sum + count, 0);
  console.log('='.repeat(60));
  console.log(`  Total: ${total} historical games loaded`);
  console.log('='.repeat(60));
  
  process.exit(0);
}

loadAllHistoricalSeasons();
