import pool from './src/config/database.js';

async function testEloComponent() {
  console.log('🧪 Testing Elo Score Component\n');
  
  // Get one game to test with
  const gameQuery = `
    SELECT game_id, home_team, away_team, home_score, away_score
    FROM games 
    WHERE season = 2024 AND is_final = true 
    LIMIT 1
  `;
  
  const gameResult = await pool.query(gameQuery);
  const game = gameResult.rows[0];
  
  console.log(`Testing game: ${game.away_team} @ ${game.home_team}`);
  console.log(`Actual score: ${game.away_score} - ${game.home_score}\n`);
  
  // Get team stats
  const statsQuery = `
    SELECT team_key, elo_rating, offensive_rating, defensive_rating, wins, losses
    FROM team_statistics 
    WHERE team_key IN ($1, $2)
  `;
  
  const statsResult = await pool.query(statsQuery, [game.home_team, game.away_team]);
  const homeStats = statsResult.rows.find(t => t.team_key === game.home_team);
  const awayStats = statsResult.rows.find(t => t.team_key === game.away_team);
  
  console.log(`${game.home_team} stats: ${homeStats.wins}-${homeStats.losses}, Elo: ${homeStats.elo_rating}`);
  console.log(`${game.away_team} stats: ${awayStats.wins}-${awayStats.losses}, Elo: ${awayStats.elo_rating}\n`);
  
  // Calculate Elo Score (Component 1)
  const eloDifference = parseFloat(homeStats.elo_rating) - parseFloat(awayStats.elo_rating);
  const eloScore = Math.max(-50, Math.min(50, eloDifference / 20));
  
  console.log('--- Component 1: Elo Score ---');
  console.log(`Elo Difference: ${eloDifference.toFixed(1)}`);
  console.log(`Elo Score: ${eloScore.toFixed(2)} (range: -50 to +50)`);
  console.log(`Favors: ${eloScore > 0 ? game.home_team : game.away_team}\n`);
  
  // Show who actually won
  const actualWinner = game.home_score > game.away_score ? game.home_team : game.away_team;
  const eloPickedWinner = eloScore > 0 ? game.home_team : game.away_team;
  const correct = actualWinner === eloPickedWinner ? '✅' : '❌';
  
  console.log(`Actual winner: ${actualWinner}`);
  console.log(`Elo predicted: ${eloPickedWinner} ${correct}`);
  
  process.exit(0);
}

testEloComponent();
