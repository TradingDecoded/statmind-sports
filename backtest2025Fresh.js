// backtest2025Fresh.js
// Test 2025 season with FRESH Elo (all teams start at 1500)
import pool from './src/config/database.js';

const teamStatsHistory = new Map();

const weights = {
  elo: 0.25,
  power: 0.30,
  situational: 0.25,
  matchup: 0.20,
  recentForm: 0.05
};

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
    elo_rating: 1500, // FRESH START
    offensive_rating: 0,
    defensive_rating: 0,
    last_5_results: []
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
    stats.last_5_results.push('W');
  } else if (teamScore < oppScore) {
    stats.losses++;
    if (isHome) stats.home_losses++;
    else stats.away_losses++;
    stats.last_5_results.push('L');
  } else {
    stats.ties++;
    stats.last_5_results.push('T');
  }

  if (stats.last_5_results.length > 5) {
    stats.last_5_results.shift();
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

function generatePrediction(homeStats, awayStats, game) {
  if (homeStats.games_played === 0 && awayStats.games_played === 0) {
    return {
      predicted_winner: game.home_team,
      confidence: 'low',
      home_win_probability: 0.52
    };
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
  const homeAdvantage = 5;
  const situationalScore = Math.max(-50, Math.min(50, ((homeWinPct - awayWinPct) * 50) + homeAdvantage));

  // Component 4: Matchup Score
  const offMatchup = (homeOff - awayDef) / 2;
  const defMatchup = (homeDef - awayOff) / 2;
  const matchupScore = Math.max(-50, Math.min(50, (offMatchup + defMatchup) / 2));

  // Component 5: Recent Form
  const homeRecentWins = homeStats.last_5_results.filter(r => r === 'W').length;
  const awayRecentWins = awayStats.last_5_results.filter(r => r === 'W').length;
  const recentFormScore = Math.max(-50, Math.min(50, ((homeRecentWins - awayRecentWins) / 5) * 50));

  // Calculate weighted total
  const totalScore =
    (eloScore * weights.elo) +
    (powerScore * weights.power) +
    (situationalScore * weights.situational) +
    (matchupScore * weights.matchup) +
    (recentFormScore * weights.recentForm);

  // Convert to probability
  const homeWinProb = 0.5 + (totalScore / 100) * 0.5;

  // Determine confidence
  let confidence;
  const probDiff = Math.abs(homeWinProb - 0.5);
  if (probDiff >= 0.15) confidence = 'high';
  else if (probDiff >= 0.08) confidence = 'medium';
  else confidence = 'low';

  return {
    predicted_winner: homeWinProb > 0.5 ? game.home_team : game.away_team,
    confidence,
    home_win_probability: homeWinProb
  };
}

async function backtest2025Fresh() {
  console.log('\n' + '='.repeat(80));
  console.log('🔬 2025 SEASON BACKTEST - Fresh Elo (Starting at 1500)');
  console.log('='.repeat(80) + '\n');

  // Fetch all completed 2025 games
  const gamesQuery = `
    SELECT game_id, season, week, game_date, home_team, away_team, home_score, away_score
    FROM games
    WHERE season = 2025 
      AND home_score IS NOT NULL 
      AND away_score IS NOT NULL
    ORDER BY game_date ASC, game_id ASC
  `;

  const gamesResult = await pool.query(gamesQuery);
  const games = gamesResult.rows;

  console.log(`📊 Found ${games.length} completed games for 2025 season\n`);
  console.log(`🎯 All teams starting at Elo 1500 (FRESH START)\n`);

  // Initialize teams
  for (const game of games) {
    if (!teamStatsHistory.has(game.home_team)) {
      teamStatsHistory.set(game.home_team, initializeTeam(game.home_team));
    }
    if (!teamStatsHistory.has(game.away_team)) {
      teamStatsHistory.set(game.away_team, initializeTeam(game.away_team));
    }
  }

  let correct = 0;
  let total = 0;
  const confidenceBreakdown = {
    high: { correct: 0, total: 0 },
    medium: { correct: 0, total: 0 },
    low: { correct: 0, total: 0 }
  };

  let currentWeek = 0;

  // Process each game
  for (const game of games) {
    if (game.week !== currentWeek) {
      currentWeek = game.week;
      if (correct > 0 || total > 0) {
        const weekAcc = ((correct / total) * 100).toFixed(1);
        console.log(`   Week ${currentWeek - 1} accuracy: ${weekAcc}% (${correct}/${total})\n`);
      }
      console.log(`📅 Week ${currentWeek}`);
    }

    const homeStats = teamStatsHistory.get(game.home_team);
    const awayStats = teamStatsHistory.get(game.away_team);

    // Generate prediction BEFORE updating stats
    const prediction = generatePrediction(homeStats, awayStats, game);

    // Determine actual winner
    const actualWinner = game.home_score > game.away_score ? game.home_team : game.away_team;
    const isCorrect = actualWinner === prediction.predicted_winner;

    if (isCorrect) {
      correct++;
      confidenceBreakdown[prediction.confidence].correct++;
    }
    total++;
    confidenceBreakdown[prediction.confidence].total++;

    const symbol = isCorrect ? '✅' : '❌';
    console.log(`   ${symbol} ${game.away_team} @ ${game.home_team}: Predicted ${prediction.predicted_winner} (${prediction.confidence})`);

    // Update stats AFTER prediction
    updateTeamStats(homeStats, game, true);
    updateTeamStats(awayStats, game, false);
    updateEloRatings(homeStats, awayStats, game);
  }

  const accuracy = ((correct / total) * 100).toFixed(1);

  console.log(`\n${'='.repeat(80)}`);
  console.log(`📊 2025 SEASON RESULTS (Fresh Elo)`);
  console.log(`${'='.repeat(80)}`);
  console.log(`Total Games: ${total}`);
  console.log(`Correct: ${correct}`);
  console.log(`Wrong: ${total - correct}`);
  console.log(`Accuracy: ${accuracy}%`);
  console.log(`\n📈 By Confidence Level:`);
  for (const [level, stats] of Object.entries(confidenceBreakdown)) {
    if (stats.total > 0) {
      const confAcc = ((stats.correct / stats.total) * 100).toFixed(1);
      console.log(`   ${level.toUpperCase()}: ${stats.correct}/${stats.total} (${confAcc}%)`);
    }
  }

  console.log(`\n🏆 Final Elo Ratings (Top 10):`);
  const sortedTeams = Array.from(teamStatsHistory.values())
    .sort((a, b) => b.elo_rating - a.elo_rating)
    .slice(0, 10);
  sortedTeams.forEach((team, i) => {
    console.log(`   ${i + 1}. ${team.team_key}: ${team.elo_rating.toFixed(0)} Elo (${team.wins}-${team.losses})`);
  });

  console.log(`\n${'='.repeat(80)}`);
  console.log(`🆚 COMPARISON:`);
  console.log(`   Fresh Elo (2025): ${accuracy}%`);
  console.log(`   Live System (2025): 76.1%`);
  console.log(`   Difference: ${(76.1 - parseFloat(accuracy)).toFixed(1)} percentage points`);
  console.log(`${'='.repeat(80)}\n`);

  process.exit(0);
}

backtest2025Fresh();
