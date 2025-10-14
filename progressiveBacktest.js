import pool from './src/config/database.js';

// Store team stats at each week
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
    elo_rating: 1500, // Everyone starts at 1500
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
  
  // Win/Loss tracking
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
  
  // Update ratings
  if (stats.games_played > 0) {
    stats.offensive_rating = ((stats.points_for / stats.games_played) / 35) * 100;
    stats.defensive_rating = 100 - (((stats.points_against / stats.games_played) / 35) * 100);
  }
  
  return stats;
}

function updateEloRatings(homeStats, awayStats, game) {
  const K = 32;
  
  // Expected scores
  const homeExpected = 1 / (1 + Math.pow(10, (awayStats.elo_rating - homeStats.elo_rating) / 400));
  const awayExpected = 1 - homeExpected;
  
  // Actual scores
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
  
  // Margin of victory multiplier
  const scoreDiff = Math.abs(game.home_score - game.away_score);
  const movMultiplier = Math.log(Math.max(scoreDiff, 1) + 1);
  
  // Update Elos
  homeStats.elo_rating += K * movMultiplier * (homeActual - homeExpected);
  awayStats.elo_rating += K * movMultiplier * (awayActual - awayExpected);
}

function generatePrediction(homeStats, awayStats, game) {
  // If no games played yet, use neutral prediction
  if (homeStats.games_played === 0 && awayStats.games_played === 0) {
    return {
      game_id: game.game_id,
      predicted_winner: game.home_team, // Slight home advantage
      home_win_probability: '0.525',
      away_win_probability: '0.475',
      confidence: 'Low',
      elo_score: '0',
      power_score: '0',
      situational_score: '0',
      matchup_score: '0',
      recent_form_score: '0'
    };
  }
  
  // Component 1: Elo Score (25%)
  const eloDiff = homeStats.elo_rating - awayStats.elo_rating;
  const eloScore = Math.max(-50, Math.min(50, eloDiff / 20));
  
  // Component 2: Power Score (25%)
  const homeOff = homeStats.offensive_rating;
  const homeDef = homeStats.defensive_rating;
  const awayOff = awayStats.offensive_rating;
  const awayDef = awayStats.defensive_rating;
  
  const homePower = (homeOff + (100 - awayDef)) / 2;
  const awayPower = (awayOff + (100 - homeDef)) / 2;
  const powerScore = Math.max(-50, Math.min(50, ((homePower - awayPower) / 100) * 50));
  
  // Component 3: Situational Score (20%)
  const homeWinPct = homeStats.home_wins / (homeStats.home_wins + homeStats.home_losses || 1);
  const awayWinPct = awayStats.away_wins / (awayStats.away_wins + awayStats.away_losses || 1);
  const situationalScore = Math.max(-25, Math.min(25, (homeWinPct - awayWinPct) * 30));
  
  // Component 4: Matchup Score (15%)
  const homeAvgFor = homeStats.points_for / (homeStats.games_played || 1);
  const homeAvgAgainst = homeStats.points_against / (homeStats.games_played || 1);
  const awayAvgFor = awayStats.points_for / (awayStats.games_played || 1);
  const awayAvgAgainst = awayStats.points_against / (awayStats.games_played || 1);
  
  const matchupDiff = (homeAvgFor - awayAvgAgainst) - (awayAvgFor - homeAvgAgainst);
  const matchupScore = Math.max(-20, Math.min(20, matchupDiff));
  
  // Component 5: Recent Form Score (15%)
  const homeWinRate = homeStats.wins / (homeStats.games_played || 1);
  const awayWinRate = awayStats.wins / (awayStats.games_played || 1);
  const recentFormScore = (homeWinRate - awayWinRate) * 50;
  
  // Combine
  const totalScore = (
    eloScore * 0.25 +
    powerScore * 0.25 +
    situationalScore * 0.20 +
    matchupScore * 0.15 +
    recentFormScore * 0.15
  );
  
  const homeWinProb = ((totalScore + 100) / 200);
  const awayWinProb = 1 - homeWinProb;
  
  const predictedWinner = totalScore > 0 ? game.home_team : game.away_team;
  const scoreDiff = Math.abs(totalScore);
  
  let confidence;
  if (scoreDiff > 40) confidence = 'High';
  else if (scoreDiff > 20) confidence = 'Medium';
  else confidence = 'Low';
  
  return {
    game_id: game.game_id,
    predicted_winner: predictedWinner,
    home_win_probability: homeWinProb.toFixed(3),
    away_win_probability: awayWinProb.toFixed(3),
    confidence,
    elo_score: eloScore.toFixed(2),
    power_score: powerScore.toFixed(2),
    situational_score: situationalScore.toFixed(2),
    matchup_score: matchupScore.toFixed(2),
    recent_form_score: recentFormScore.toFixed(2)
  };
}

async function progressiveBacktest(season) {
  console.log(`🔬 Progressive Backtesting for ${season} Season`);
  console.log(`Starting all teams at 1500 Elo\n`);
  
  // Get all games ordered by week
  const gamesQuery = `
    SELECT * FROM games 
    WHERE season = $1 AND is_final = true
    ORDER BY week, game_date
  `;
  
  const gamesResult = await pool.query(gamesQuery, [season]);
  const games = gamesResult.rows;
  
  console.log(`Processing ${games.length} games chronologically...\n`);
  
  let correct = 0;
  let total = 0;
  let currentWeek = 0;
  
  for (const game of games) {
    // New week notification
    if (game.week !== currentWeek) {
      currentWeek = game.week;
      console.log(`\n📅 Week ${currentWeek}`);
    }
    
    // Get or initialize team stats
    if (!teamStatsHistory.has(game.home_team)) {
      teamStatsHistory.set(game.home_team, initializeTeam(game.home_team));
    }
    if (!teamStatsHistory.has(game.away_team)) {
      teamStatsHistory.set(game.away_team, initializeTeam(game.away_team));
    }
    
    const homeStats = teamStatsHistory.get(game.home_team);
    const awayStats = teamStatsHistory.get(game.away_team);
    
    // Generate prediction using ONLY data from before this game
    const prediction = generatePrediction(homeStats, awayStats, game);
    
    // Store prediction
    await storePrediction(prediction);
    
    // Check if correct
    const actualWinner = game.home_score > game.away_score ? game.home_team : game.away_team;
    const isCorrect = actualWinner === prediction.predicted_winner;
    
    // Store result
    await storeResult(game.game_id, prediction.predicted_winner, actualWinner, isCorrect);
    
    if (isCorrect) correct++;
    total++;
    
    const symbol = isCorrect ? '✅' : '❌';
    console.log(`  ${symbol} ${game.away_team} @ ${game.home_team}: Predicted ${prediction.predicted_winner} (${prediction.confidence})`);
    
    // NOW update stats with this game's result (for next predictions)
    updateTeamStats(homeStats, game, true);
    updateTeamStats(awayStats, game, false);
    updateEloRatings(homeStats, awayStats, game);
  }
  
  const accuracy = ((correct / total) * 100).toFixed(1);
  
  console.log(`\n${'='.repeat(70)}`);
  console.log(`📊 PROGRESSIVE BACKTEST RESULTS - ${season} Season`);
  console.log(`${'='.repeat(70)}`);
  console.log(`Total Games: ${total}`);
  console.log(`Correct: ${correct}`);
  console.log(`Wrong: ${total - correct}`);
  console.log(`Accuracy: ${accuracy}%`);
  console.log(`${'='.repeat(70)}\n`);
  
  // Show final Elo ratings
  console.log(`Final Elo Ratings (Top 10):`);
  const sortedTeams = Array.from(teamStatsHistory.values())
    .sort((a, b) => b.elo_rating - a.elo_rating)
    .slice(0, 10);
  
  sortedTeams.forEach((team, i) => {
    console.log(`  ${i + 1}. ${team.team_key}: ${team.elo_rating.toFixed(0)} Elo (${team.wins}-${team.losses})`);
  });
  
  process.exit(0);
}

async function storePrediction(prediction) {
  const query = `
    INSERT INTO predictions (
      game_id, predicted_winner, home_win_probability, away_win_probability,
      confidence, elo_score, power_score, situational_score,
      matchup_score, recent_form_score
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
    ON CONFLICT (game_id) DO UPDATE SET
      predicted_winner = EXCLUDED.predicted_winner,
      home_win_probability = EXCLUDED.home_win_probability,
      confidence = EXCLUDED.confidence
  `;
  
  await pool.query(query, [
    prediction.game_id, prediction.predicted_winner,
    prediction.home_win_probability, prediction.away_win_probability,
    prediction.confidence, prediction.elo_score, prediction.power_score,
    prediction.situational_score, prediction.matchup_score, prediction.recent_form_score
  ]);
}

async function storeResult(gameId, predictedWinner, actualWinner, isCorrect) {
  const query = `
    INSERT INTO prediction_results (game_id, predicted_winner, actual_winner, is_correct)
    VALUES ($1, $2, $3, $4)
    ON CONFLICT (game_id) DO UPDATE SET
      actual_winner = EXCLUDED.actual_winner,
      is_correct = EXCLUDED.is_correct
  `;
  
  await pool.query(query, [gameId, predictedWinner, actualWinner, isCorrect]);
}

progressiveBacktest(2024);
