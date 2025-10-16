// src/scripts/testPlayoffGames.js
import axios from 'axios';

async function testPlayoffWeeks() {
  console.log('🏈 Testing ESPN API for playoff weeks...\n');
  
  const season = 2025; // Test with current season's playoffs
  
  // Playoff weeks in ESPN API use seasontype=3
  const playoffWeeks = [
    { week: 19, espnWeek: 1, name: 'Wild Card' },
    { week: 20, espnWeek: 2, name: 'Divisional' },
    { week: 21, espnWeek: 3, name: 'Conference Championships' },
    { week: 22, espnWeek: 4, name: 'Super Bowl' }
  ];
  
  for (const playoff of playoffWeeks) {
    console.log(`\n📅 Week ${playoff.week} (${playoff.name}):`);
    
    try {
      // ESPN uses seasontype=3 for playoffs, with week 1-4
      const url = `https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard?seasontype=3&week=${playoff.espnWeek}&season=${season}`;
      const response = await axios.get(url);
      
      const games = response.data.events || [];
      console.log(`   ✅ Found ${games.length} playoff game(s)`);
      
      if (games.length > 0) {
        games.forEach((game, i) => {
          const awayTeam = game.competitions[0].competitors.find(t => t.homeAway === 'away').team.abbreviation;
          const homeTeam = game.competitions[0].competitors.find(t => t.homeAway === 'home').team.abbreviation;
          const awayScore = game.competitions[0].competitors.find(t => t.homeAway === 'away').score || '?';
          const homeScore = game.competitions[0].competitors.find(t => t.homeAway === 'home').score || '?';
          console.log(`   ${i + 1}. ${awayTeam} ${awayScore} @ ${homeTeam} ${homeScore}`);
        });
      }
      
    } catch (error) {
      console.error(`   ❌ Error fetching week ${playoff.week}:`, error.message);
    }
  }
  
  console.log('\n' + '='.repeat(70));
  console.log('✅ Playoff API test complete');
  console.log('='.repeat(70));
  console.log('If you see games listed above, ESPN API supports playoffs! ✅');
  console.log('='.repeat(70) + '\n');
}

testPlayoffWeeks();
