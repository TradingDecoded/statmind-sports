import pool from './src/config/database.js';

async function predictAllGames(season) {
  console.log(`🎯 Generating predictions for ${season} season...\n`);
  
  // Get all completed games
  const gamesQuery = `
    SELECT game_id, home_team, away_team, home_score, away_score
    FROM games 
    WHERE season = $1 AND is_final = true
    ORDER BY week, game_date
  `;
  
  const gamesResult = await pool.query(gamesQuery, [season]);
  const games = gamesResult.rows;
  
  console.log(`Found ${games.length} completed games\n`);
  
  let correct = 0;
  let total = 0;
  
  for (const game of games) {
    const prediction = await generatePrediction(game);
    
    if (prediction) {
      await storePrediction(prediction);
      await verifyPrediction(game.game_id, prediction.predicted_winner);
      
      const actualWinner = game.home_score > game.away_score ? game.home_team : game.away_team;
      const isCorrect = actualWinner === prediction.predicted_winner;
      
      if (isCorrect) correct++;
      total++;
      
      const symbol = isCorrect ? '✅' : '❌';
      console.log(`${symbol} Game ${total}: ${game.away_team} @ ${game.home_team} - Predicted: ${prediction.predicted_winner}, Actual: ${actualWinner}`);
    }
  }
  
  const accuracy = ((correct / total) * 100).toFixed(1);
  
  console.log(`\n${'='.repeat(60)}`);
  console.log(`📊 FINAL RESULTS`);
  console.log(`${'='.repeat(60)}`);
  console.log(`Total Games: ${total}`);
  console.log(`Correct Predictions: ${correct}`);
  console.log(`Wrong Predictions: ${total - correct}`);
  console.log(`Accuracy: ${accuracy}%`);
  console.log(`${'='.repeat(60)}\n`);
  
  process.exit(0);
}

async function generatePrediction(game) {
  try {
    // Get team stats
    const statsQuery = `SELECT * FROM team_statistics WHERE team_key IN ($1, $2)`;
    const stats = await pool.query(statsQuery, [game.home_team, game.away_team]);
    const homeStats = stats.rows.find(t => t.team_key === game.home_team);
    const awayStats = stats.rows.find(t => t.team_key === game.away_team);
    
    if (!homeStats || !awayStats) return null;
    
    // Component 1: Elo Score (25%)
    const eloDiff = parseFloat(homeStats.elo_rating) - parseFloat(awayStats.elo_rating);
    const eloScore = Math.max(-50, Math.min(50, eloDiff / 20));
    
    // Component 2: Power Score (25%)
    const homeOff = parseFloat(homeStats.offensive_rating);
    const homeDef = parseFloat(homeStats.defensive_rating);
    const awayOff = parseFloat(awayStats.offensive_rating);
    const awayDef = parseFloat(awayStats.defensive_rating);
    
    const homePower = (homeOff + (100 - awayDef)) / 2;
    const awayPower = (awayOff + (100 - homeDef)) / 2;
    const powerScore = Math.max(-50, Math.min(50, ((homePower - awayPower) / 100) * 50));
    
    // Component 3: Situational Score (20%)
    const homeWinPct = homeStats.home_wins / (homeStats.home_wins + homeStats.home_losses || 1);
    const awayWinPct = awayStats.away_wins / (awayStats.away_wins + awayStats.away_losses || 1);
    const situationalScore = Math.max(-25, Math.min(25, (homeWinPct - awayWinPct) * 30));
    
    // Component 4: Matchup Score (15%)
    const gamesPlayed = homeStats.wins + homeStats.losses || 1;
    const awayGamesPlayed = awayStats.wins + awayStats.losses || 1;
    
    const homeAvgFor = homeStats.points_for / gamesPlayed;
    const homeAvgAgainst = homeStats.points_against / gamesPlayed;
    const awayAvgFor = awayStats.points_for / awayGamesPlayed;
    const awayAvgAgainst = awayStats.points_against / awayGamesPlayed;
    
    const matchupDiff = (homeAvgFor - awayAvgAgainst) - (awayAvgFor - homeAvgAgainst);
    const matchupScore = Math.max(-20, Math.min(20, matchupDiff));
    
    // Component 5: Recent Form Score (15%)
    const homeWinRate = homeStats.wins / (homeStats.wins + homeStats.losses || 1);
    const awayWinRate = awayStats.wins / (awayStats.wins + awayStats.losses || 1);
    const recentFormScore = (homeWinRate - awayWinRate) * 50;
    
    // Combine with weights
    const totalScore = (
      eloScore * 0.25 +
      powerScore * 0.25 +
      situationalScore * 0.20 +
      matchupScore * 0.15 +
      recentFormScore * 0.15
    );
    
    // Win probability
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
    
  } catch (error) {
    console.error(`Error predicting game ${game.game_id}:`, error.message);
    return null;
  }
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
      away_win_probability = EXCLUDED.away_win_probability,
      confidence = EXCLUDED.confidence,
      elo_score = EXCLUDED.elo_score,
      power_score = EXCLUDED.power_score,
      situational_score = EXCLUDED.situational_score,
      matchup_score = EXCLUDED.matchup_score,
      recent_form_score = EXCLUDED.recent_form_score
  `;
  
  await pool.query(query, [
    prediction.game_id,
    prediction.predicted_winner,
    prediction.home_win_probability,
    prediction.away_win_probability,
    prediction.confidence,
    prediction.elo_score,
    prediction.power_score,
    prediction.situational_score,
    prediction.matchup_score,
    prediction.recent_form_score
  ]);
}

async function verifyPrediction(gameId, predictedWinner) {
  const gameQuery = `SELECT home_team, away_team, home_score, away_score FROM games WHERE game_id = $1`;
  const game = (await pool.query(gameQuery, [gameId])).rows[0];
  
  const actualWinner = game.home_score > game.away_score ? game.home_team : game.away_team;
  const isCorrect = actualWinner === predictedWinner;
  
  const resultQuery = `
    INSERT INTO prediction_results (game_id, predicted_winner, actual_winner, is_correct)
    VALUES ($1, $2, $3, $4)
    ON CONFLICT (game_id) DO UPDATE SET
      predicted_winner = EXCLUDED.predicted_winner,
      actual_winner = EXCLUDED.actual_winner,
      is_correct = EXCLUDED.is_correct,
      verified_at = CURRENT_TIMESTAMP
  `;
  
  await pool.query(resultQuery, [gameId, predictedWinner, actualWinner, isCorrect]);
}

predictAllGames(2024);
