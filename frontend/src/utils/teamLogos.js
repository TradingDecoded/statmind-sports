// frontend/src/utils/teamLogos.js

/**
 * NFL Team information and logo URLs
 * Using ESPN's CDN for team logos
 */
export const NFL_TEAMS = {
  'ARI': { name: 'Arizona Cardinals', colors: ['#97233F', '#FFB612'] },
  'ATL': { name: 'Atlanta Falcons', colors: ['#A71930', '#000000'] },
  'BAL': { name: 'Baltimore Ravens', colors: ['#241773', '#000000'] },
  'BUF': { name: 'Buffalo Bills', colors: ['#00338D', '#C60C30'] },
  'CAR': { name: 'Carolina Panthers', colors: ['#0085CA', '#101820'] },
  'CHI': { name: 'Chicago Bears', colors: ['#0B162A', '#C83803'] },
  'CIN': { name: 'Cincinnati Bengals', colors: ['#FB4F14', '#000000'] },
  'CLE': { name: 'Cleveland Browns', colors: ['#311D00', '#FF3C00'] },
  'DAL': { name: 'Dallas Cowboys', colors: ['#003594', '#869397'] },
  'DEN': { name: 'Denver Broncos', colors: ['#FB4F14', '#002244'] },
  'DET': { name: 'Detroit Lions', colors: ['#0076B6', '#B0B7BC'] },
  'GB': { name: 'Green Bay Packers', colors: ['#203731', '#FFB612'] },
  'HOU': { name: 'Houston Texans', colors: ['#03202F', '#A71930'] },
  'IND': { name: 'Indianapolis Colts', colors: ['#002C5F', '#A2AAAD'] },
  'JAX': { name: 'Jacksonville Jaguars', colors: ['#006778', '#D7A22A'] },
  'KC': { name: 'Kansas City Chiefs', colors: ['#E31837', '#FFB81C'] },
  'LAC': { name: 'LA Chargers', colors: ['#0080C6', '#FFC20E'] },
  'LAR': { name: 'LA Rams', colors: ['#003594', '#FFA300'] },
  'LV': { name: 'Las Vegas Raiders', colors: ['#000000', '#A5ACAF'] },
  'MIA': { name: 'Miami Dolphins', colors: ['#008E97', '#FC4C02'] },
  'MIN': { name: 'Minnesota Vikings', colors: ['#4F2683', '#FFC62F'] },
  'NE': { name: 'New England Patriots', colors: ['#002244', '#C60C30'] },
  'NO': { name: 'New Orleans Saints', colors: ['#D3BC8D', '#101820'] },
  'NYG': { name: 'New York Giants', colors: ['#0B2265', '#A71930'] },
  'NYJ': { name: 'New York Jets', colors: ['#125740', '#000000'] },
  'PHI': { name: 'Philadelphia Eagles', colors: ['#004C54', '#A5ACAF'] },
  'PIT': { name: 'Pittsburgh Steelers', colors: ['#FFB612', '#101820'] },
  'SEA': { name: 'Seattle Seahawks', colors: ['#002244', '#69BE28'] },
  'SF': { name: 'San Francisco 49ers', colors: ['#AA0000', '#B3995D'] },
  'TB': { name: 'Tampa Bay Buccaneers', colors: ['#D50A0A', '#FF7900'] },
  'TEN': { name: 'Tennessee Titans', colors: ['#0C2340', '#4B92DB'] },
  'WAS': { name: 'Washington Commanders', colors: ['#5A1414', '#FFB612'] },
};

/**
 * Get team logo URL from ESPN
 */
export function getTeamLogo(teamKey) {
  const espnTeamIds = {
    'ARI': '22', 'ATL': '1', 'BAL': '33', 'BUF': '2',
    'CAR': '29', 'CHI': '3', 'CIN': '4', 'CLE': '5',
    'DAL': '6', 'DEN': '7', 'DET': '8', 'GB': '9',
    'HOU': '34', 'IND': '11', 'JAX': '30', 'KC': '12',
    'LAC': '24', 'LAR': '14', 'LV': '13', 'MIA': '15',
    'MIN': '16', 'NE': '17', 'NO': '18', 'NYG': '19',
    'NYJ': '20', 'PHI': '21', 'PIT': '23', 'SEA': '26',
    'SF': '25', 'TB': '27', 'TEN': '10', 'WAS': '28'
  };
  
  const espnId = espnTeamIds[teamKey];
  return espnId 
    ? `https://a.espncdn.com/i/teamlogos/nfl/500/${espnId}.png`
    : '/placeholder-team-logo.png';
}

/**
 * Get team full name
 */
export function getTeamName(teamKey) {
  return NFL_TEAMS[teamKey]?.name || teamKey;
}

/**
 * Get team primary color
 */
export function getTeamColor(teamKey) {
  return NFL_TEAMS[teamKey]?.colors[0] || '#000000';
}