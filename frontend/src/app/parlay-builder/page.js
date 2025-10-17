'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../contexts/AuthContext';

export default function ParlayBuilderPage() {
  const router = useRouter();
  const { user } = useAuth();
  
  const [availableGames, setAvailableGames] = useState([]);
  const [selectedPicks, setSelectedPicks] = useState([]);
  const [parlayName, setParlayName] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [calculating, setCalculating] = useState(false);
  const [calculatedProb, setCalculatedProb] = useState(null);
  const [error, setError] = useState(null);
  const [currentWeek, setCurrentWeek] = useState(null);
  const [currentSeason, setCurrentSeason] = useState(2025);

  // Team logo mapping (using ESPN CDN)
  const getTeamLogo = (teamName) => {
    const teamAbbreviations = {
      'Kansas City Chiefs': 'KC',
      'Buffalo Bills': 'BUF',
      'Baltimore Ravens': 'BAL',
      'Cincinnati Bengals': 'CIN',
      'Cleveland Browns': 'CLE',
      'Pittsburgh Steelers': 'PIT',
      'Houston Texans': 'HOU',
      'Indianapolis Colts': 'IND',
      'Jacksonville Jaguars': 'JAX',
      'Tennessee Titans': 'TEN',
      'Denver Broncos': 'DEN',
      'Las Vegas Raiders': 'LV',
      'Los Angeles Chargers': 'LAC',
      'Miami Dolphins': 'MIA',
      'New England Patriots': 'NE',
      'New York Jets': 'NYJ',
      'Dallas Cowboys': 'DAL',
      'New York Giants': 'NYG',
      'Philadelphia Eagles': 'PHI',
      'Washington Commanders': 'WSH',
      'Chicago Bears': 'CHI',
      'Detroit Lions': 'DET',
      'Green Bay Packers': 'GB',
      'Minnesota Vikings': 'MIN',
      'Atlanta Falcons': 'ATL',
      'Carolina Panthers': 'CAR',
      'New Orleans Saints': 'NO',
      'Tampa Bay Buccaneers': 'TB',
      'Arizona Cardinals': 'ARI',
      'Los Angeles Rams': 'LAR',
      'San Francisco 49ers': 'SF',
      'Seattle Seahawks': 'SEA'
    };

    const abbr = teamAbbreviations[teamName];
    return abbr ? `https://a.espncdn.com/i/teamlogos/nfl/500/${abbr}.png` : null;
  };

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }
    fetchAvailableGames();
  }, [user]);

  const fetchAvailableGames = async () => {
    try {
      const token = localStorage.getItem('authToken');
      
      const response = await fetch('/api/parlay/available-games', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch games');
      }

      const data = await response.json();
      setAvailableGames(data.games || []);
      setCurrentWeek(data.week);
      setCurrentSeason(data.season);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching games:', err);
      setError('Failed to load games. Please refresh the page.');
      setLoading(false);
    }
  };

  const toggleGamePick = (game, pickedWinner) => {
    setSelectedPicks(prevPicks => {
      const existingIndex = prevPicks.findIndex(p => p.game_id === game.id);

      if (existingIndex >= 0) {
        const existingPick = prevPicks[existingIndex];

        if (existingPick.picked_winner === pickedWinner) {
          return prevPicks.filter(p => p.game_id !== game.id);
        } else {
          const newPicks = [...prevPicks];
          newPicks[existingIndex] = {
            game_id: game.id,
            picked_winner: pickedWinner,
            home_team: game.home_team,
            away_team: game.away_team
          };
          return newPicks;
        }
      } else {
        return [...prevPicks, {
          game_id: game.id,
          picked_winner: pickedWinner,
          home_team: game.home_team,
          away_team: game.away_team
        }];
      }
    });
  };

  useEffect(() => {
    if (selectedPicks.length >= 2) {
      calculateProbability();
    } else {
      setCalculatedProb(null);
    }
  }, [selectedPicks]);

  const calculateProbability = async () => {
    if (selectedPicks.length < 2) return;

    setCalculating(true);
    try {
      const token = localStorage.getItem('authToken');

      const gamesWithProb = selectedPicks.map(pick => {
        const gameData = availableGames.find(g => g.id === pick.game_id);
        const winProb = pick.picked_winner === gameData.home_team
          ? gameData.home_win_probability
          : gameData.away_win_probability;

        return {
          game_id: pick.game_id,
          picked_winner: pick.picked_winner,
          win_probability: winProb
        };
      });

      const response = await fetch('/api/parlay/calculate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ games: gamesWithProb })
      });

      if (!response.ok) {
        throw new Error('Failed to calculate probability');
      }

      const data = await response.json();
      setCalculatedProb(data);
      setCalculating(false);
    } catch (err) {
      console.error('Error calculating:', err);
      setCalculating(false);
    }
  };

  const handleSaveParlay = async () => {
    if (selectedPicks.length < 2) {
      alert('Please select at least 2 games');
      return;
    }

    if (!parlayName.trim()) {
      alert('Please enter a parlay name');
      return;
    }

    setSaving(true);
    try {
      const token = localStorage.getItem('authToken');

      const response = await fetch('/api/parlay/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          parlay_name: parlayName,
          season: currentSeason,
          week: currentWeek,
          games: selectedPicks
        })
      });

      if (!response.ok) {
        throw new Error('Failed to save parlay');
      }

      alert('Parlay saved successfully! 🎉');
      router.push('/my-parlays');
    } catch (err) {
      alert('Failed to save parlay. Please try again.');
      console.error('Save error:', err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-white text-xl">Loading available games...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-red-400 text-xl">{error}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 py-8">
      <div className="max-w-7xl mx-auto px-4">

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">🎲 Parlay Builder</h1>
          <p className="text-slate-400">
            Create your custom parlay for Week {currentWeek} • Select 2+ games
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Left Column: Available Games */}
          <div className="lg:col-span-2">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
              <h2 className="text-2xl font-bold text-white mb-6">
                Available Games ({availableGames.length})
              </h2>

              {availableGames.length === 0 ? (
                <p className="text-slate-400">No games available for this week yet.</p>
              ) : (
                <div className="space-y-4">
                  {availableGames.map((game) => {
                    const selectedPick = selectedPicks.find(p => p.game_id === game.id);
                    const isSelected = !!selectedPick;
                    const awayRecord = game.away_wins !== null ? `${game.away_wins}-${game.away_losses}` : '';
                    const homeRecord = game.home_wins !== null ? `${game.home_wins}-${game.home_losses}` : '';

                    return (
                      <div
                        key={game.id}
                        className={`bg-slate-800 rounded-xl p-5 border-2 transition-all ${
                          isSelected 
                            ? 'border-emerald-500 shadow-lg shadow-emerald-500/20' 
                            : 'border-slate-700 hover:border-slate-600'
                        }`}
                      >
                        {/* Game Header */}
                        <div className="flex items-center justify-between mb-4">
                          <div className="text-xs text-slate-400 font-semibold uppercase">
                            Week {game.week}
                          </div>
                          {game.confidence_level && (
                            <div className={`px-3 py-1 rounded-full text-xs font-bold ${
                              game.confidence_level === 'HC' 
                                ? 'bg-emerald-500/20 text-emerald-400' 
                                : game.confidence_level === 'MC'
                                ? 'bg-yellow-500/20 text-yellow-400'
                                : 'bg-slate-500/20 text-slate-400'
                            }`}>
                              {game.confidence_level} Pick
                            </div>
                          )}
                        </div>

                        {/* Teams Grid */}
                        <div className="grid grid-cols-2 gap-4">
                          
                          {/* Away Team */}
                          <button
                            onClick={() => toggleGamePick(game, game.away_team)}
                            className={`relative p-4 rounded-lg transition-all duration-200 ${
                              selectedPick?.picked_winner === game.away_team
                                ? 'bg-emerald-600 text-white ring-4 ring-emerald-400/50 scale-105'
                                : 'bg-slate-700 text-white hover:bg-slate-600 hover:scale-102'
                            }`}
                          >
                            {/* Selected Checkmark */}
                            {selectedPick?.picked_winner === game.away_team && (
                              <div className="absolute top-2 right-2 w-6 h-6 bg-white rounded-full flex items-center justify-center">
                                <span className="text-emerald-600 font-bold text-sm">✓</span>
                              </div>
                            )}

                            {/* Team Logo */}
                            <div className="flex justify-center mb-3">
                              <div className="w-16 h-16 bg-white rounded-lg p-2 flex items-center justify-center">
                                {getTeamLogo(game.away_team) ? (
                                  <img 
                                    src={getTeamLogo(game.away_team)} 
                                    alt={game.away_team}
                                    className="w-full h-full object-contain"
                                  />
                                ) : (
                                  <span className="text-2xl font-bold text-slate-800">
                                    {game.away_team.split(' ').pop().charAt(0)}
                                  </span>
                                )}
                              </div>
                            </div>

                            <div className="text-xs font-semibold opacity-75 mb-1">@ Away</div>
                            <div className="font-bold text-sm mb-1">{game.away_team}</div>
                            <div className="text-xs opacity-75">{awayRecord}</div>
                            
                            {game.away_win_probability && (
                              <div className="mt-2 text-xs font-semibold">
                                {(game.away_win_probability * 100).toFixed(1)}% to win
                              </div>
                            )}

                            {game.predicted_winner === game.away_team && (
                              <div className="mt-2">
                                <span className="text-xs bg-white/20 px-2 py-1 rounded">
                                  AI Pick ⭐
                                </span>
                              </div>
                            )}
                          </button>

                          {/* Home Team */}
                          <button
                            onClick={() => toggleGamePick(game, game.home_team)}
                            className={`relative p-4 rounded-lg transition-all duration-200 ${
                              selectedPick?.picked_winner === game.home_team
                                ? 'bg-emerald-600 text-white ring-4 ring-emerald-400/50 scale-105'
                                : 'bg-slate-700 text-white hover:bg-slate-600 hover:scale-102'
                            }`}
                          >
                            {/* Selected Checkmark */}
                            {selectedPick?.picked_winner === game.home_team && (
                              <div className="absolute top-2 right-2 w-6 h-6 bg-white rounded-full flex items-center justify-center">
                                <span className="text-emerald-600 font-bold text-sm">✓</span>
                              </div>
                            )}

                            {/* Team Logo */}
                            <div className="flex justify-center mb-3">
                              <div className="w-16 h-16 bg-white rounded-lg p-2 flex items-center justify-center">
                                {getTeamLogo(game.home_team) ? (
                                  <img 
                                    src={getTeamLogo(game.home_team)} 
                                    alt={game.home_team}
                                    className="w-full h-full object-contain"
                                  />
                                ) : (
                                  <span className="text-2xl font-bold text-slate-800">
                                    {game.home_team.split(' ').pop().charAt(0)}
                                  </span>
                                )}
                              </div>
                            </div>

                            <div className="text-xs font-semibold opacity-75 mb-1">Home</div>
                            <div className="font-bold text-sm mb-1">{game.home_team}</div>
                            <div className="text-xs opacity-75">{homeRecord}</div>
                            
                            {game.home_win_probability && (
                              <div className="mt-2 text-xs font-semibold">
                                {(game.home_win_probability * 100).toFixed(1)}% to win
                              </div>
                            )}

                            {game.predicted_winner === game.home_team && (
                              <div className="mt-2">
                                <span className="text-xs bg-white/20 px-2 py-1 rounded">
                                  AI Pick ⭐
                                </span>
                              </div>
                            )}
                          </button>

                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Selected Picks & Calculator */}
          <div className="lg:col-span-1">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 sticky top-4">
              <h2 className="text-2xl font-bold text-white mb-4">
                Your Parlay ({selectedPicks.length})
              </h2>

              {selectedPicks.length === 0 ? (
                <p className="text-slate-400 text-sm">
                  Select games from the left to build your parlay
                </p>
              ) : (
                <>
                  {/* Selected Picks List */}
                  <div className="space-y-2 mb-6">
                    {selectedPicks.map((pick, index) => (
                      <div
                        key={pick.game_id}
                        className="bg-slate-800 rounded-lg p-3 flex items-center justify-between"
                      >
                        <div>
                          <div className="text-white font-semibold">
                            {index + 1}. {pick.picked_winner}
                          </div>
                          <div className="text-xs text-slate-400">
                            {pick.away_team} @ {pick.home_team}
                          </div>
                        </div>
                        <button
                          onClick={() => toggleGamePick({ id: pick.game_id }, pick.picked_winner)}
                          className="text-red-400 hover:text-red-300 text-xl font-bold"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>

                  {/* Probability Calculator */}
                  {selectedPicks.length >= 2 && (
                    <div className="bg-gradient-to-br from-emerald-600 to-teal-600 rounded-lg p-4 mb-6">
                      <div className="text-white text-center">
                        <div className="text-sm opacity-90 mb-1">Combined Win Probability</div>
                        {calculating ? (
                          <div className="text-3xl font-bold">Calculating...</div>
                        ) : calculatedProb ? (
                          <>
                            <div className="text-4xl font-bold mb-2">
                              {(calculatedProb.combined_probability * 100).toFixed(1)}%
                            </div>
                            <div className="text-xs opacity-90">
                              Risk Level: <span className="font-bold">{calculatedProb.risk_level}</span>
                            </div>
                          </>
                        ) : (
                          <div className="text-3xl font-bold">--</div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Parlay Name Input */}
                  <div className="mb-4">
                    <label className="block text-slate-400 text-sm mb-2">
                      Parlay Name
                    </label>
                    <input
                      type="text"
                      value={parlayName}
                      onChange={(e) => setParlayName(e.target.value)}
                      placeholder="e.g., Week 7 Big Plays"
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  {/* Save Button */}
                  <button
                    onClick={handleSaveParlay}
                    disabled={saving || selectedPicks.length < 2 || !parlayName.trim()}
                    className={`w-full py-3 rounded-lg font-bold text-white transition-all ${
                      saving || selectedPicks.length < 2 || !parlayName.trim()
                        ? 'bg-slate-700 cursor-not-allowed'
                        : 'bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700'
                    }`}
                  >
                    {saving ? 'Saving...' : '💾 Save Parlay'}
                  </button>
                </>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}