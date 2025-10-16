// cascadingBacktest.js
// TRUE backtest that carries Elo ratings forward across seasons
import pool from './src/config/database.js';

const teamStatsHistory = new Map();

// Weights (same as your current system)
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
    elo_rating: 1500,
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
  
  // Keep only last 5 games
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
      game_id: game.game_id,
      predicted_winner: game.home_team,
      confidence: 'low',
      home_win_probability: 0.52,
      away_win_probability: 0.48
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
  const homeAdvantage = 5; // 5-point home advantage
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
  const awayWinProb = 1 - homeWinProb;
  
  // Determine confidence
  let confidence;
  const probDiff = Math.abs(homeWinProb - 0.5);
  if (probDiff >= 0.15) confidence = 'high';
  else if (probDiff >= 0.08) confidence = 'medium';
  else confidence = 'low';
  
  return {
    game_id: game.game_id,
    predicted_winner: homeWinProb > 0.5 ? game.home_team : game.away_team,
    confidence,
    home_win_probability: homeWinProb,
    away_win_probability: awayWinProb,
    elo_score: eloScore,
    power_score: powerScore,
    situational_score: situationalScore,
    matchup_score: matchupScore,
    recent_form_score: recentFormScore
  };
}

async function cascadingBacktest() {
  console.log('\n' + '='.repeat(80));
  console.log('🔬 CASCADING BACKTEST - Elo Ratings Carried Forward Across Seasons');
  console.log('='.repeat(80) + '\n');
  
  const seasons = [2020, 2021, 2022, 2023, 2024];
  const seasonResults = [];
  
  for (const season of seasons) {
    console.log(`\n${'─'.repeat(80)}`);
    console.log(`📅 Processing ${season} Season (Elo carries forward from previous season)`);
    console.log(`${'─'.repeat(80)}\n`);
    
    // Fetch all games for this season
    const gamesQuery = `
      SELECT game_id, season, week, game_date, home_team, away_team, home_score, away_score
      FROM games
      WHERE season = $1 AND is_final = true 
        AND home_score IS NOT NULL AND away_score IS NOT NULL
      ORDER BY game_date ASC, game_id ASC
    `;
    
    const gamesResult = await pool.query(gamesQuery, [season]);
    const games = gamesResult.rows;
    
    console.log(`📊 Found ${games.length} completed games for ${season} season\n`);
    
    // Initialize teams for this season if they don't exist
    for (const game of games) {
      if (!teamStatsHistory.has(game.home_team)) {
        teamStatsHistory.set(game.home_team, initializeTeam(game.home_team));
      }
      if (!teamStatsHistory.has(game.away_team)) {
        teamStatsHistory.set(game.away_team, initializeTeam(game.away_team));
      }
    }
    
    // Show starting Elo ratings for this season
    if (season === 2020) {
      console.log(`🎯 Starting Elo Ratings (All teams at 1500 - first season)\n`);
    } else {
      console.log(`🎯 Starting Elo Ratings (Carried forward from ${season - 1}):`);
      const topTeams = Array.from(teamStatsHistory.values())
        .sort((a, b) => b.elo_rating - a.elo_rating)
        .slice(0, 5);
      topTeams.forEach((team, i) => {
        console.log(`   ${i + 1}. ${team.team_key}: ${team.elo_rating.toFixed(0)} Elo`);
      });
      console.log();
    }
    
    let correct = 0;
    let total = 0;
    const confidenceBreakdown = { high: { correct: 0, total: 0 }, medium: { correct: 0, total: 0 }, low: { correct: 0, total: 0 } };
    
    // Process each game
    for (const game of games) {
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
      
      // Update stats AFTER prediction
      updateTeamStats(homeStats, game, true);
      updateTeamStats(awayStats, game, false);
      updateEloRatings(homeStats, awayStats, game);
    }
    
    const accuracy = ((correct / total) * 100).toFixed(1);
    
    console.log(`\n${'─'.repeat(80)}`);
    console.log(`📊 ${season} SEASON RESULTS`);
    console.log(`${'─'.repeat(80)}`);
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
    
    // Show ending Elo ratings
    console.log(`\n🏆 Ending Elo Ratings (Top 10):`);
    const sortedTeams = Array.from(teamStatsHistory.values())
      .sort((a, b) => b.elo_rating - a.elo_rating)
      .slice(0, 10);
    sortedTeams.forEach((team, i) => {
      console.log(`   ${i + 1}. ${team.team_key}: ${team.elo_rating.toFixed(0)} Elo (${team.wins}-${team.losses})`);
    });
    
    seasonResults.push({
      season,
      total,
      correct,
      accuracy: parseFloat(accuracy),
      confidenceBreakdown
    });
    
    // Reset seasonal stats but KEEP Elo ratings
    console.log(`\n🔄 Resetting seasonal stats but carrying Elo forward to ${season + 1}...\n`);
    for (const [key, stats] of teamStatsHistory.entries()) {
      teamStatsHistory.set(key, {
        ...initializeTeam(key),
        elo_rating: stats.elo_rating // KEEP THE ELO!
      });
    }
  }
  
  // Final summary
  console.log('\n' + '='.repeat(80));
  console.log('🎯 CASCADING BACKTEST SUMMARY - All Seasons');
  console.log('='.repeat(80) + '\n');
  
  seasonResults.forEach(result => {
    console.log(`${result.season}: ${result.accuracy}% (${result.correct}/${result.total})`);
  });
  
  const totalGames = seasonResults.reduce((sum, r) => sum + r.total, 0);
  const totalCorrect = seasonResults.reduce((sum, r) => sum + r.correct, 0);
  const overallAccuracy = ((totalCorrect / totalGames) * 100).toFixed(1);
  
  console.log(`\n${'─'.repeat(80)}`);
  console.log(`📊 OVERALL: ${overallAccuracy}% (${totalCorrect}/${totalGames})`);
  console.log(`${'─'.repeat(80)}\n`);
  
  console.log('✅ Cascading backtest complete! Elo ratings were carried forward across all seasons.\n');
  
  process.exit(0);
}

cascadingBacktest();
