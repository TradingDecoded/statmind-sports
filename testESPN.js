// Quick test: Can we fetch ESPN data?

async function testESPN() {
  try {
    // Fetch 2024 Week 1 games
    const url = 'https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard?dates=2024&seasontype=2&week=1';
    
    console.log('🔍 Testing ESPN API...');
    console.log('URL:', url);
    
    const response = await fetch(url);
    
    if (!response.ok) {
      console.log('❌ ESPN returned error:', response.status);
      return;
    }
    
    const data = await response.json();
    const games = data.events || [];
    
    console.log(`✅ Success! Found ${games.length} games for 2024 Week 1`);
    
    // Show first game as example
    if (games.length > 0) {
      const game = games[0];
      const comp = game.competitions[0];
      const home = comp.competitors.find(t => t.homeAway === 'home');
      const away = comp.competitors.find(t => t.homeAway === 'away');
      
      console.log('\n📋 Example game:');
      console.log(`   ${away.team.abbreviation} @ ${home.team.abbreviation}`);
      console.log(`   Score: ${away.score} - ${home.score}`);
      console.log(`   Status: ${game.status.type.description}`);
    }
    
  } catch (error) {
    console.log('❌ Error:', error.message);
  }
}

testESPN();