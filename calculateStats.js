import pool from './src/config/database.js';

async function calculateTeamStats(season) {
  console.log(`📊 Calculating team statistics for ${season} season...\n`);
  
  // Get all teams from games
  const teamsQuery = `
    SELECT DISTINCT team_key FROM (
      SELECT home_team as team_key FROM games WHERE season = $1
      UNION
      SELECT away_team as team_key FROM games WHERE season = $1
    ) teams ORDER BY team_key
  `;
  
  const teamsResult = await pool.query(teamsQuery, [season]);
  const teams = teamsResult.rows.map(r => r.team_key);
  
  console.log(`Found ${teams.length} teams\n`);
  
  // Calculate stats for each team
  for (const teamKey of teams) {
    const stats = await calculateSingleTeamStats(teamKey, season);
    await saveTeamStats(teamKey, stats);
    console.log(`✅ ${teamKey}: ${stats.wins}-${stats.losses}, ${stats.elo_rating.toFixed(0)} Elo`);
  }
  
  console.log(`\n✅ Team statistics calculated!`);
}

async function calculateSingleTeamStats(teamKey, season) {
  const query = `
    SELECT 
      game_id, home_team, away_team, home_score, away_score
    FROM games
    WHERE season = $1 
      AND is_final = true
      AND (home_team = $2 OR away_team = $2)
    ORDER BY week, game_date
  `;
  
  const result = await pool.query(query, [season, teamKey]);
  const games = result.rows;
  
  let wins = 0, losses = 0, ties = 0;
  let homeWins = 0, homeLosses = 0;
  let awayWins = 0, awayLosses = 0;
  let pointsFor = 0, pointsAgainst = 0;
  let eloRating = 1500;
  
  for (const game of games) {
    const isHome = game.home_team === teamKey;
    const teamScore = isHome ? game.home_score : game.away_score;
    const oppScore = isHome ? game.away_score : game.home_score;
    
    pointsFor += teamScore;
    pointsAgainst += oppScore;
    
    if (teamScore > oppScore) {
      wins++;
      if (isHome) homeWins++;
      else awayWins++;
    } else if (teamScore < oppScore) {
      losses++;
      if (isHome) homeLosses++;
      else awayLosses++;
    } else {
      ties++;
    }
    
    const K = 32;
    const expectedScore = 0.5;
    const actualScore = teamScore > oppScore ? 1 : (teamScore < oppScore ? 0 : 0.5);
    const scoreDiff = Math.abs(teamScore - oppScore);
    const movMultiplier = Math.log(Math.max(scoreDiff, 1) + 1);
    
    eloRating += K * movMultiplier * (actualScore - expectedScore);
  }
  
  const gamesPlayed = wins + losses + ties;
  const offensiveRating = gamesPlayed > 0 ? ((pointsFor / gamesPlayed) / 35) * 100 : 0;
  const defensiveRating = gamesPlayed > 0 ? 100 - (((pointsAgainst / gamesPlayed) / 35) * 100) : 0;
  
  return {
    wins, losses, ties,
    points_for: pointsFor,
    points_against: pointsAgainst,
    home_wins: homeWins,
    home_losses: homeLosses,
    away_wins: awayWins,
    away_losses: awayLosses,
    offensive_rating: offensiveRating,
    defensive_rating: defensiveRating,
    elo_rating: eloRating
  };
}

async function saveTeamStats(teamKey, stats) {
  const query = `
    INSERT INTO team_statistics (
      team_key, wins, losses, ties, points_for, points_against,
      home_wins, home_losses, away_wins, away_losses,
      offensive_rating, defensive_rating, elo_rating
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
    ON CONFLICT (team_key) DO UPDATE SET
      wins = EXCLUDED.wins,
      losses = EXCLUDED.losses,
      ties = EXCLUDED.ties,
      points_for = EXCLUDED.points_for,
      points_against = EXCLUDED.points_against,
      home_wins = EXCLUDED.home_wins,
      home_losses = EXCLUDED.home_losses,
      away_wins = EXCLUDED.away_wins,
      away_losses = EXCLUDED.away_losses,
      offensive_rating = EXCLUDED.offensive_rating,
      defensive_rating = EXCLUDED.defensive_rating,
      elo_rating = EXCLUDED.elo_rating,
      last_updated = CURRENT_TIMESTAMP
  `;
  
  await pool.query(query, [
    teamKey, stats.wins, stats.losses, stats.ties,
    stats.points_for, stats.points_against,
    stats.home_wins, stats.home_losses,
    stats.away_wins, stats.away_losses,
    stats.offensive_rating, stats.defensive_rating,
    stats.elo_rating
  ]);
}

calculateTeamStats(2024).then(() => {
  console.log('\n✅ Done!');
  process.exit(0);
});
