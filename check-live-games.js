async function checkLiveGames() {
  try {
    const now = new Date();
    const year = now.getFullYear();
    const season = now.getMonth() >= 8 ? year : year - 1;
    
    // Calculate current week
    const seasonStart = new Date(season, 8, 4);
    const weeksDiff = Math.floor((now - seasonStart) / (7 * 24 * 60 * 60 * 1000));
    const currentWeek = Math.min(Math.max(weeksDiff + 1, 1), 18);
    
    console.log(`\n📅 Checking Season ${season}, Week ${currentWeek}`);
    console.log(`🕐 Current Time: ${now.toISOString()}\n`);
    
    const url = `https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard?dates=${season}&seasontype=2&week=${currentWeek}`;
    console.log(`🔗 ESPN API URL: ${url}\n`);
    
    const response = await fetch(url);
    const data = await response.json();
    
    const events = data.events || [];
    console.log(`📊 Total games found: ${events.length}\n`);
    
    if (events.length === 0) {
      console.log('❌ No games found for this week!');
      process.exit(0);
    }
    
    events.forEach((event, index) => {
      const competition = event.competitions[0];
      const status = competition.status.type;
      const homeTeam = competition.competitors.find(c => c.homeAway === 'home');
      const awayTeam = competition.competitors.find(c => c.homeAway === 'away');
      
      console.log(`\n🏈 Game ${index + 1}: ${event.name}`);
      console.log(`   ID: ${event.id}`);
      console.log(`   Status: ${status.name} (${status.state})`);
      console.log(`   Completed: ${status.completed}`);
      console.log(`   Score: ${awayTeam.team.abbreviation} ${awayTeam.score} - ${homeTeam.score} ${homeTeam.team.abbreviation}`);
      console.log(`   Detail: ${status.detail}`);
      
      if (status.state === 'in') {
        console.log(`   🔴 LIVE GAME IN PROGRESS!`);
      } else if (status.completed) {
        console.log(`   ✅ Game finished`);
      } else {
        console.log(`   ⏰ Game not started yet`);
      }
    });
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkLiveGames();
