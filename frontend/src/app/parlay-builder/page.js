'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function ParlayBuilder() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [availableGames, setAvailableGames] = useState([]);
  const [selectedPicks, setSelectedPicks] = useState([]);
  const [parlayName, setParlayName] = useState('');
  const [calculatedProb, setCalculatedProb] = useState(null);
  const [calculating, setCalculating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [currentWeek, setCurrentWeek] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (!token) {
      router.push('/login?redirect=/parlay-builder');
      return;
    }
    fetchAvailableGames();
  }, []);

  const fetchAvailableGames = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch('http://localhost:4000/api/parlay/available-games', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) throw new Error('Failed to fetch games');

      const data = await response.json();
      setAvailableGames(data.games || []);
      setCurrentWeek(data.week || 7);
      setLoading(false);
    } catch (err) {
      setError('Failed to load games. Please refresh the page.');
      setLoading(false);
    }
  };

  const toggleGamePick = (game, pickedWinner) => {
    setSelectedPicks(prevPicks => {
      const existingIndex = prevPicks.findIndex(p => p.game_id === game.id);

      if (existingIndex >= 0) {
        // Game already selected
        const existingPick = prevPicks[existingIndex];

        if (existingPick.picked_winner === pickedWinner) {
          // Clicking same team - remove the pick
          return prevPicks.filter(p => p.game_id !== game.id);
        } else {
          // Clicking different team - update the pick
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
        // New game selection
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

      // Need to get the win probabilities for each pick from availableGames
      const gamesWithProb = selectedPicks.map(pick => {
        const gameData = availableGames.find(g => g.id === pick.game_id);
        const winProb = pick.picked_winner === gameData.home_team
          ? gameData.home_win_probability
          : gameData.away_win_probability;

        return {
          game_id: pick.game_id,
          picked_winner: pick.picked_winner,
          win_probability: winProb * 100 // Backend expects percentage (0.396 -> 39.6)
        };
      });

      const response = await fetch('http://localhost:4000/api/parlay/calculate', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ games: gamesWithProb })
      });

      if (!response.ok) throw new Error('Failed to calculate');

      const data = await response.json();

      // Convert combined probability back to decimal for display
      setCalculatedProb({
        combined_probability: parseFloat(data.combinedProbability) / 100,
        risk_level: data.riskLevel
      });
    } catch (err) {
      console.error('Calculate error:', err);
    } finally {
      setCalculating(false);
    }
  };

  const handleSaveParlay = async () => {
    if (selectedPicks.length < 2) {
      alert('Please select at least 2 games');
      return;
    }

    if (!parlayName.trim()) {
      alert('Please name your parlay');
      return;
    }

    setSaving(true);
    try {
      const token = localStorage.getItem('authToken');

      // Add win_probability to each game pick
      const gamesWithProb = selectedPicks.map(pick => {
        // Find the game data to get probabilities
        const gameData = availableGames.find(g => g.id === pick.game_id);

        // Get the probability for the team the user picked
        const winProb = pick.picked_winner === gameData.home_team
          ? gameData.home_win_probability
          : gameData.away_win_probability;

        return {
          ...pick,
          win_probability: winProb * 100 // Convert to percentage
        };
      });

      const response = await fetch('http://localhost:4000/api/parlay/create', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          parlayName: parlayName,
          season: 2025,
          week: currentWeek,
          games: gamesWithProb
        })
      });

      if (!response.ok) throw new Error('Failed to save parlay');

      alert(`✅ Parlay "${parlayName}" saved successfully!`);

      // Force full page reload to my-parlays
      window.location.href = '/my-parlays';

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
              <h2 className="text-2xl font-bold text-white mb-4">
                Available Games ({availableGames.length})
              </h2>

              {availableGames.length === 0 ? (
                <p className="text-slate-400">No games available for this week yet.</p>
              ) : (
                <div className="space-y-3">
                  {availableGames.map((game) => {
                    const selectedPick = selectedPicks.find(p => p.game_id === game.id);
                    const isSelected = !!selectedPick;

                    return (
                      <div
                        key={game.id}
                        className={`bg-slate-800 rounded-lg p-4 border-2 transition-all ${isSelected ? 'border-emerald-500' : 'border-transparent'
                          }`}
                      >
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-sm text-slate-400">
                            {new Date(game.game_date).toLocaleDateString('en-US', {
                              weekday: 'short',
                              month: 'short',
                              day: 'numeric'
                            })}
                          </span>
                          <span className="text-xs text-emerald-400">
                            AI Prediction: {game.predicted_winner || 'N/A'}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          {/* Away Team Button */}
                          <button
                            onClick={() => toggleGamePick(game, game.away_team)}
                            className={`p-3 rounded-lg text-center transition-all ${selectedPick?.picked_winner === game.away_team
                              ? 'bg-emerald-600 text-white font-bold ring-2 ring-emerald-400'
                              : 'bg-slate-700 text-white hover:bg-slate-600'
                              }`}
                          >
                            <div className="text-xs opacity-75 mb-1">Away</div>
                            <div className="text-lg font-bold">{game.away_team}</div>
                            {game.away_win_probability && (
                              <div className="text-xs mt-1 opacity-75">
                                {(game.away_win_probability * 100).toFixed(1)}%
                              </div>
                            )}
                          </button>

                          {/* Home Team Button */}
                          <button
                            onClick={() => toggleGamePick(game, game.home_team)}
                            className={`p-3 rounded-lg text-center transition-all ${selectedPick?.picked_winner === game.home_team
                              ? 'bg-emerald-600 text-white font-bold ring-2 ring-emerald-400'
                              : 'bg-slate-700 text-white hover:bg-slate-600'
                              }`}
                          >
                            <div className="text-xs opacity-75 mb-1">Home</div>
                            <div className="text-lg font-bold">{game.home_team}</div>
                            {game.home_win_probability && (
                              <div className="text-xs mt-1 opacity-75">
                                {(game.home_win_probability * 100).toFixed(1)}%
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
                          className="text-red-400 hover:text-red-300 text-xl"
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
                          <div className="text-2xl font-bold">Calculating...</div>
                        ) : calculatedProb ? (
                          <>
                            <div className="text-4xl font-bold mb-2">
                              {(calculatedProb.combined_probability * 100).toFixed(1)}%
                            </div>
                            <div className="text-sm">
                              Risk: <span className="font-semibold">{calculatedProb.risk_level}</span>
                            </div>
                          </>
                        ) : null}
                      </div>
                    </div>
                  )}

                  {/* Parlay Name Input */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Name Your Parlay
                    </label>
                    <input
                      type="text"
                      value={parlayName}
                      onChange={(e) => setParlayName(e.target.value)}
                      placeholder="e.g., Week 7 Safe Picks"
                      className="w-full px-4 py-2 bg-slate-800 text-white rounded-lg border border-slate-700 focus:border-emerald-500 focus:outline-none"
                    />
                  </div>

                  {/* Save Button */}
                  <button
                    onClick={handleSaveParlay}
                    disabled={saving || selectedPicks.length < 2 || !parlayName.trim()}
                    className={`w-full py-3 rounded-lg font-bold transition-all ${saving || selectedPicks.length < 2 || !parlayName.trim()
                      ? 'bg-slate-700 text-slate-500 cursor-not-allowed'
                      : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                      }`}
                  >
                    {saving ? 'Saving...' : '💾 Save Parlay'}
                  </button>
                </>
              )}

              {/* Instructions */}
              <div className="mt-6 pt-6 border-t border-slate-800">
                <h3 className="text-sm font-semibold text-white mb-2">How it works:</h3>
                <ul className="text-xs text-slate-400 space-y-1">
                  <li>• Select 2 or more games</li>
                  <li>• Click the team you think will win</li>
                  <li>• AI calculates combined probability</li>
                  <li>• Name and save your parlay</li>
                  <li>• Track results in "My Parlays"</li>
                </ul>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}