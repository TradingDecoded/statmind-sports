import pool from './src/config/database.js';

async function fetchAndStoreWeek(season, week) {
  try {
    const url = `https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard?dates=${season}&seasontype=2&week=${week}`;
    
    console.log(`📥 Fetching ${season} Week ${week}...`);
    
    const response = await fetch(url);
    const data = await response.json();
    const games = data.events || [];
    
    console.log(`   Found ${games.length} games`);
    
    let stored = 0;
    
    for (const event of games) {
      const comp = event.competitions[0];
      const home = comp.competitors.find(t => t.homeAway === 'home');
      const away = comp.competitors.find(t => t.homeAway === 'away');
      
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
    
    console.log(`✅ Stored ${stored} games`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

// Load all 18 weeks of 2024
async function loadFullSeason() {
  for (let week = 1; week <= 18; week++) {
    await fetchAndStoreWeek(2024, week);
    // Small delay to be nice to ESPN's API
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  console.log('\n🎉 All 2024 weeks loaded!');
  process.exit(0);
}

loadFullSeason();