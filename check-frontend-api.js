async function checkAPI() {
  try {
    const response = await fetch('http://localhost:4000/api/predictions/week/2025/7');
    const data = await response.json();
    
    const liveGame = data.predictions.find(p => p.gameId === '401772826');
    
    if (liveGame) {
      console.log('\n=== LIVE GAME FROM API ===');
      console.log('Game ID:', liveGame.gameId);
      console.log('Home Team:', liveGame.homeTeamKey);
      console.log('Away Team:', liveGame.awayTeamKey);
      console.log('Home Score:', liveGame.homeScore);
      console.log('Away Score:', liveGame.awayScore);
      console.log('Is Final:', liveGame.isFinal);
      console.log('Status:', liveGame.status);
    } else {
      console.log('Game not found in API response');
    }
  } catch (error) {
    console.error('Error:', error.message);
  }
}

checkAPI();
