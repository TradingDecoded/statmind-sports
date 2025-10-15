import pool from './src/config/database.js';

const teamStatsHistory = new Map();

function initializeTeam(teamKey) {
  return {
    team_key: teamKey,
    wins: 0,
    losses: 0,
    ties: 0,
    points_for: 0,
    points_against: 0,
    home_wins: 0,
    home_losses: 0,
    away_wins: 0,
    away_losses: 0,
    games_played: 0,
    elo_rating: 1500,
    offensive_rating: 0,
    defensive_rating: 0
  };
}

function updateTeamStats(stats, game, isHome) {
  const teamScore = isHome ? game.home_score : game.away_score;
  const oppScore = isHome ? game.away_score : game.home_score;
  
  stats.games_played++;
  stats.points_for += teamScore;
  stats.points_against += oppScore;
  
  if (teamScore > oppScore) {
    stats.wins++;
    if (isHome) stats.home_wins++;
    else stats.away_wins++;
  } else if (teamScore < oppScore) {
    stats.losses++;
    if (isHome) stats.home_losses++;
    else stats.away_losses++;
  } else {
    stats.ties++;
  }
  
  if (stats.games_played > 0) {
    stats.offensive_rating = ((stats.points_for / stats.games_played) / 35) * 100;
    stats.defensive_rating = 100 - (((stats.points_against / stats.games_played) / 35) * 100);
  }
  
  return stats;
}

function updateEloRatings(homeStats, awayStats, game) {
  const K = 32;
  const homeExpected = 1 / (1 + Math.pow(10, (awayStats.elo_rating - homeStats.elo_rating) / 400));
  const awayExpected = 1 - homeExpected;
  
  let homeActual, awayActual;
  if (game.home_score > game.away_score) {
    homeActual = 1;
    awayActual = 0;
  } else if (game.home_score < game.away_score) {
    homeActual = 0;
    awayActual = 1;
  } else {
    homeActual = 0.5;
    awayActual = 0.5;
  }
  
  const scoreDiff = Math.abs(game.home_score - game.away_score);
  const movMultiplier = Math.log(Math.max(scoreDiff, 1) + 1);
  
  homeStats.elo_rating += K * movMultiplier * (homeActual - homeExpected);
  awayStats.elo_rating += K * movMultiplier * (awayActual - awayExpected);
}

function generatePrediction(homeStats, awayStats, game, weights) {
  if (homeStats.games_played === 0 && awayStats.games_played === 0) {
    return game.home_team;
  }
  
  const eloDiff = homeStats.elo_rating - awayStats.elo_rating;
  const eloScore = Math.max(-50, Math.min(50, eloDiff / 20));
  
  const homeOff = homeStats.offensive_rating;
  const homeDef = homeStats.defensive_rating;
  const awayOff = awayStats.offensive_rating;
  const awayDef = awayStats.defensive_rating;
  
  const homePower = (homeOff + (100 - awayDef)) / 2;
  const awayPower = (awayOff + (100 - homeDef)) / 2;
  const powerScore = Math.max(-50, Math.min(50, ((homePower - awayPower) / 100) * 50));
  
  const homeWinPct = homeStats.home_wins / (homeStats.home_wins + homeStats.home_losses || 1);
  const awayWinPct = awayStats.away_wins / (awayStats.away_wins + awayStats.away_losses || 1);
  const situationalScore = Math.max(-25, Math.min(25, (homeWinPct - awayWinPct) * 30));
  
  const homeAvgFor = homeStats.points_for / (homeStats.games_played || 1);
  const homeAvgAgainst = homeStats.points_against / (homeStats.games_played || 1);
  const awayAvgFor = awayStats.points_for / (awayStats.games_played || 1);
  const awayAvgAgainst = awayStats.points_against / (awayStats.games_played || 1);
  
  const matchupDiff = (homeAvgFor - awayAvgAgainst) - (awayAvgFor - homeAvgAgainst);
  const matchupScore = Math.max(-20, Math.min(20, matchupDiff));
  
  const homeWinRate = homeStats.wins / (homeStats.games_played || 1);
  const awayWinRate = awayStats.wins / (awayStats.games_played || 1);
  const recentFormScore = (homeWinRate - awayWinRate) * 50;
  
  const totalScore = (
    eloScore * weights.elo +
    powerScore * weights.power +
    situationalScore * weights.situational +
    matchupScore * weights.matchup +
    recentFormScore * weights.recentForm
  );
  
  return totalScore > 0 ? game.home_team : game.away_team;
}

async function testWeightsOnSeason(weights, season) {
  teamStatsHistory.clear();
  
  const gamesQuery = `
    SELECT * FROM games 
    WHERE season = $1 AND is_final = true
    ORDER BY week, game_date
  `;
  
  const gamesResult = await pool.query(gamesQuery, [season]);
  const games = gamesResult.rows;
  
  let correct = 0;
  let total = 0;
  
  for (const game of games) {
    if (!teamStatsHistory.has(game.home_team)) {
      teamStatsHistory.set(game.home_team, initializeTeam(game.home_team));
    }
    if (!teamStatsHistory.has(game.away_team)) {
      teamStatsHistory.set(game.away_team, initializeTeam(game.away_team));
    }
    
    const homeStats = teamStatsHistory.get(game.home_team);
    const awayStats = teamStatsHistory.get(game.away_team);
    
    const prediction = generatePrediction(homeStats, awayStats, game, weights);
    const actualWinner = game.home_score > game.away_score ? game.home_team : game.away_team;
    
    if (prediction === actualWinner) correct++;
    total++;
    
    updateTeamStats(homeStats, game, true);
    updateTeamStats(awayStats, game, false);
    updateEloRatings(homeStats, awayStats, game);
  }
  
  return {
    season,
    total,
    correct,
    accuracy: (correct / total) * 100
  };
}

async function compareWeights() {
  console.log('⚖️  Comparing Weight Sets Across Multiple Seasons\n');
  
  const originalWeights = {
    elo: 0.25,
    power: 0.25,
    situational: 0.20,
    matchup: 0.15,
    recentForm: 0.15
  };
  
  const optimizedWeights = {
    elo: 0.35,
    power: 0.15,
    situational: 0.25,
    matchup: 0.20,
    recentForm: 0.05
  };
  
  const seasons = [2020, 2021, 2022, 2023, 2024];
  
  console.log('Testing ORIGINAL weights (25/25/20/15/15)...\n');
  const originalResults = [];
  for (const season of seasons) {
    const result = await testWeightsOnSeason(originalWeights, season);
    originalResults.push(result);
    console.log(`  ${season}: ${result.correct}/${result.total} = ${result.accuracy.toFixed(1)}%`);
  }
  
  console.log('\nTesting OPTIMIZED weights (35/15/25/20/5)...\n');
  const optimizedResults = [];
  for (const season of seasons) {
    const result = await testWeightsOnSeason(optimizedWeights, season);
    optimizedResults.push(result);
    console.log(`  ${season}: ${result.correct}/${result.total} = ${result.accuracy.toFixed(1)}%`);
  }
  
  // Calculate averages
  const originalAvg = originalResults.reduce((sum, r) => sum + r.accuracy, 0) / originalResults.length;
  const optimizedAvg = optimizedResults.reduce((sum, r) => sum + r.accuracy, 0) / optimizedResults.length;
  
  console.log('\n' + '='.repeat(70));
  console.log('📊 COMPARISON RESULTS');
  console.log('='.repeat(70));
  console.log('\nYear-by-Year Comparison:\n');
  console.log('Season | Original | Optimized | Difference');
  console.log('-------|----------|-----------|------------');
  
  for (let i = 0; i < seasons.length; i++) {
    const diff = optimizedResults[i].accuracy - originalResults[i].accuracy;
    const symbol = diff > 0 ? '+' : '';
    console.log(`${seasons[i]}  |  ${originalResults[i].accuracy.toFixed(1)}%  |   ${optimizedResults[i].accuracy.toFixed(1)}%   |  ${symbol}${diff.toFixed(1)}%`);
  }
  
  console.log('-------|----------|-----------|------------');
  const avgDiff = optimizedAvg - originalAvg;
  const avgSymbol = avgDiff > 0 ? '+' : '';
  console.log(`AVG    |  ${originalAvg.toFixed(1)}%  |   ${optimizedAvg.toFixed(1)}%   |  ${avgSymbol}${avgDiff.toFixed(1)}%`);
  console.log('='.repeat(70));
  
  console.log('\n💡 Conclusion:');
  if (optimizedAvg > originalAvg) {
    console.log(`✅ Optimized weights perform BETTER on average (+${avgDiff.toFixed(1)}%)`);
    console.log('   Recommendation: Use optimized weights (35/15/25/20/5)');
  } else {
    console.log(`⚠️  Optimized weights were overfitted to 2024 data`);
    console.log('   Recommendation: Stick with original weights (25/25/20/15/15)');
  }
  
  console.log('\n📈 Weight Distribution:');
  console.log('\nOriginal:  Elo 25%, Power 25%, Situational 20%, Matchup 15%, Form 15%');
  console.log('Optimized: Elo 35%, Power 15%, Situational 25%, Matchup 20%, Form 5%');
  console.log('');
  
  process.exit(0);
}

compareWeights();
