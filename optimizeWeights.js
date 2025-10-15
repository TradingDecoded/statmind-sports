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
    return game.home_team; // Predict home team for early games
  }
  
  // Component 1: Elo Score
  const eloDiff = homeStats.elo_rating - awayStats.elo_rating;
  const eloScore = Math.max(-50, Math.min(50, eloDiff / 20));
  
  // Component 2: Power Score
  const homeOff = homeStats.offensive_rating;
  const homeDef = homeStats.defensive_rating;
  const awayOff = awayStats.offensive_rating;
  const awayDef = awayStats.defensive_rating;
  
  const homePower = (homeOff + (100 - awayDef)) / 2;
  const awayPower = (awayOff + (100 - homeDef)) / 2;
  const powerScore = Math.max(-50, Math.min(50, ((homePower - awayPower) / 100) * 50));
  
  // Component 3: Situational Score
  const homeWinPct = homeStats.home_wins / (homeStats.home_wins + homeStats.home_losses || 1);
  const awayWinPct = awayStats.away_wins / (awayStats.away_wins + awayStats.away_losses || 1);
  const situationalScore = Math.max(-25, Math.min(25, (homeWinPct - awayWinPct) * 30));
  
  // Component 4: Matchup Score
  const homeAvgFor = homeStats.points_for / (homeStats.games_played || 1);
  const homeAvgAgainst = homeStats.points_against / (homeStats.games_played || 1);
  const awayAvgFor = awayStats.points_for / (awayStats.games_played || 1);
  const awayAvgAgainst = awayStats.points_against / (awayStats.games_played || 1);
  
  const matchupDiff = (homeAvgFor - awayAvgAgainst) - (awayAvgFor - homeAvgAgainst);
  const matchupScore = Math.max(-20, Math.min(20, matchupDiff));
  
  // Component 5: Recent Form Score
  const homeWinRate = homeStats.wins / (homeStats.games_played || 1);
  const awayWinRate = awayStats.wins / (awayStats.games_played || 1);
  const recentFormScore = (homeWinRate - awayWinRate) * 50;
  
  // Apply weights
  const totalScore = (
    eloScore * weights.elo +
    powerScore * weights.power +
    situationalScore * weights.situational +
    matchupScore * weights.matchup +
    recentFormScore * weights.recentForm
  );
  
  return totalScore > 0 ? game.home_team : game.away_team;
}

async function testWeights(weights, games) {
  // Reset team stats
  teamStatsHistory.clear();
  
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
  
  return (correct / total) * 100;
}

async function optimizeWeights() {
  console.log('🔧 Weight Optimization Starting...\n');
  console.log('Testing different weight combinations to maximize accuracy\n');
  
  // Load all games
  const gamesQuery = `
    SELECT * FROM games 
    WHERE season = 2024 AND is_final = true
    ORDER BY week, game_date
  `;
  
  const gamesResult = await pool.query(gamesQuery);
  const games = gamesResult.rows;
  
  console.log(`Loaded ${games.length} games\n`);
  
  let bestAccuracy = 0;
  let bestWeights = null;
  let testCount = 0;
  
  // Test various weight combinations
  // We'll test in increments of 0.05 (5%)
  console.log('Testing weight combinations...\n');
  
  for (let elo = 0.15; elo <= 0.35; elo += 0.05) {
    for (let power = 0.15; power <= 0.35; power += 0.05) {
      for (let situational = 0.10; situational <= 0.30; situational += 0.05) {
        for (let matchup = 0.05; matchup <= 0.25; matchup += 0.05) {
          for (let recentForm = 0.05; recentForm <= 0.25; recentForm += 0.05) {
            
            // Ensure weights sum to 1.0 (with small tolerance for floating point)
            const sum = elo + power + situational + matchup + recentForm;
            if (Math.abs(sum - 1.0) < 0.001) {
              
              const weights = { elo, power, situational, matchup, recentForm };
              const accuracy = await testWeights(weights, games);
              
              testCount++;
              
              if (accuracy > bestAccuracy) {
                bestAccuracy = accuracy;
                bestWeights = weights;
                console.log(`✨ New best: ${accuracy.toFixed(2)}% with weights:`);
                console.log(`   Elo: ${(elo * 100).toFixed(0)}%, Power: ${(power * 100).toFixed(0)}%, Situational: ${(situational * 100).toFixed(0)}%, Matchup: ${(matchup * 100).toFixed(0)}%, Form: ${(recentForm * 100).toFixed(0)}%\n`);
              }
              
              if (testCount % 100 === 0) {
                process.stdout.write(`\rTested ${testCount} combinations... Current best: ${bestAccuracy.toFixed(2)}%`);
              }
            }
          }
        }
      }
    }
  }
  
  console.log(`\n\n${'='.repeat(70)}`);
  console.log('🏆 OPTIMIZATION COMPLETE');
  console.log(`${'='.repeat(70)}`);
  console.log(`Tested: ${testCount} weight combinations`);
  console.log(`Best Accuracy: ${bestAccuracy.toFixed(2)}%`);
  console.log(`\nOptimal Weights:`);
  console.log(`  Elo Score:        ${(bestWeights.elo * 100).toFixed(1)}%`);
  console.log(`  Power Score:      ${(bestWeights.power * 100).toFixed(1)}%`);
  console.log(`  Situational:      ${(bestWeights.situational * 100).toFixed(1)}%`);
  console.log(`  Matchup:          ${(bestWeights.matchup * 100).toFixed(1)}%`);
  console.log(`  Recent Form:      ${(bestWeights.recentForm * 100).toFixed(1)}%`);
  console.log(`${'='.repeat(70)}\n`);
  
  console.log('💡 Comparison:');
  console.log(`  Original weights: 69.1% accuracy`);
  console.log(`  Optimized weights: ${bestAccuracy.toFixed(1)}% accuracy`);
  console.log(`  Improvement: +${(bestAccuracy - 69.1).toFixed(1)}%\n`);
  
  process.exit(0);
}

optimizeWeights();
