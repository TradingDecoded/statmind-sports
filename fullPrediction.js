import pool from './src/config/database.js';

async function predictGame(gameId) {
  // Get game details
  const gameQuery = `SELECT * FROM games WHERE game_id = $1`;
  const game = (await pool.query(gameQuery, [gameId])).rows[0];
  
  // Get team stats
  const statsQuery = `SELECT * FROM team_statistics WHERE team_key IN ($1, $2)`;
  const stats = await pool.query(statsQuery, [game.home_team, game.away_team]);
  const homeStats = stats.rows.find(t => t.team_key === game.home_team);
  const awayStats = stats.rows.find(t => t.team_key === game.away_team);
  
  console.log(`\n🏈 ${game.away_team} @ ${game.home_team}\n`);
  
  // Component 1: Elo Score (25%)
  const eloDiff = parseFloat(homeStats.elo_rating) - parseFloat(awayStats.elo_rating);
  const eloScore = Math.max(-50, Math.min(50, eloDiff / 20));
  console.log(`1️⃣  Elo Score: ${eloScore.toFixed(2)}`);
  
  // Component 2: Power Score (25%)
  const homeOff = parseFloat(homeStats.offensive_rating);
  const homeDef = parseFloat(homeStats.defensive_rating);
  const awayOff = parseFloat(awayStats.offensive_rating);
  const awayDef = parseFloat(awayStats.defensive_rating);
  
  const homePower = (homeOff + (100 - awayDef)) / 2;
  const awayPower = (awayOff + (100 - homeDef)) / 2;
  const powerScore = Math.max(-50, Math.min(50, ((homePower - awayPower) / 100) * 50));
  console.log(`2️⃣  Power Score: ${powerScore.toFixed(2)}`);
  
  // Component 3: Situational Score (20%)
  const homeWinPct = homeStats.home_wins / (homeStats.home_wins + homeStats.home_losses || 1);
  const awayWinPct = awayStats.away_wins / (awayStats.away_wins + awayStats.away_losses || 1);
  const situationalScore = Math.max(-25, Math.min(25, (homeWinPct - awayWinPct) * 30));
  console.log(`3️⃣  Situational Score: ${situationalScore.toFixed(2)}`);
  
  // Component 4: Matchup Score (15%)
  const gamesPlayed = homeStats.wins + homeStats.losses || 1;
  const awayGamesPlayed = awayStats.wins + awayStats.losses || 1;
  
  const homeAvgFor = homeStats.points_for / gamesPlayed;
  const homeAvgAgainst = homeStats.points_against / gamesPlayed;
  const awayAvgFor = awayStats.points_for / awayGamesPlayed;
  const awayAvgAgainst = awayStats.points_against / awayGamesPlayed;
  
  const matchupDiff = (homeAvgFor - awayAvgAgainst) - (awayAvgFor - homeAvgAgainst);
  const matchupScore = Math.max(-20, Math.min(20, matchupDiff));
  console.log(`4️⃣  Matchup Score: ${matchupScore.toFixed(2)}`);
  
  // Component 5: Recent Form Score (15%)
  const homeWinRate = homeStats.wins / (homeStats.wins + homeStats.losses || 1);
  const awayWinRate = awayStats.wins / (awayStats.wins + awayStats.losses || 1);
  const recentFormScore = (homeWinRate - awayWinRate) * 50;
  console.log(`5️⃣  Recent Form Score: ${recentFormScore.toFixed(2)}`);
  
  // Combine with weights
  const totalScore = (
    eloScore * 0.25 +
    powerScore * 0.25 +
    situationalScore * 0.20 +
    matchupScore * 0.15 +
    recentFormScore * 0.15
  );
  
  console.log(`\n📊 Total Score: ${totalScore.toFixed(2)}`);
  
  // Win probability
  const homeWinProb = ((totalScore + 100) / 200);
  const awayWinProb = 1 - homeWinProb;
  
  console.log(`\n🎯 Prediction:`);
  console.log(`   ${game.home_team}: ${(homeWinProb * 100).toFixed(1)}%`);
  console.log(`   ${game.away_team}: ${(awayWinProb * 100).toFixed(1)}%`);
  
  const predictedWinner = totalScore > 0 ? game.home_team : game.away_team;
  const scoreDiff = Math.abs(totalScore);
  let confidence;
  if (scoreDiff > 40) confidence = 'High';
  else if (scoreDiff > 20) confidence = 'Medium';
  else confidence = 'Low';
  
  console.log(`\n✅ Predicted Winner: ${predictedWinner} (${confidence} confidence)`);
  
  // Show actual result
  if (game.is_final) {
    const actualWinner = game.home_score > game.away_score ? game.home_team : game.away_team;
    const correct = actualWinner === predictedWinner ? '✅ CORRECT' : '❌ WRONG';
    console.log(`📋 Actual Winner: ${actualWinner} ${correct}`);
    console.log(`   Final: ${game.away_team} ${game.away_score} - ${game.home_score} ${game.home_team}`);
  }
  
  process.exit(0);
}

// Test with first game
const testGameQuery = `SELECT game_id FROM games WHERE season = 2024 AND is_final = true LIMIT 1`;
pool.query(testGameQuery).then(result => {
  predictGame(result.rows[0].game_id);
});
