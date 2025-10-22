'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../contexts/AuthContext';
import { useSMSBucks } from '../../contexts/SMSBucksContext';
import { formatShortGameDateTime } from '@/utils/dateTimeUtils';
import { getTeamLogo } from '@/utils/teamLogos';
import CompetitionStatusBanner from '../../components/CompetitionStatusBanner';

export default function ParlayBuilderPage() {
  const router = useRouter();
  const { user, isLoading } = useAuth();

  const [availableGames, setAvailableGames] = useState([]);
  const [selectedPicks, setSelectedPicks] = useState([]);
  const [parlayName, setParlayName] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [calculating, setCalculating] = useState(false);
  const [calculation, setCalculation] = useState(null);
  const [error, setError] = useState(null);
  const [currentWeek, setCurrentWeek] = useState(null);
  const [currentSeason, setCurrentSeason] = useState(2025);
  const { refreshBalance } = useSMSBucks();
  const [competitionStatus, setCompetitionStatus] = useState(null);
  const [userParlays, setUserParlays] = useState([]);

  useEffect(() => {
    // Don't redirect while still checking auth
    if (isLoading) {
      return;
    }

    if (!user) {
      router.push('/login');
      return;
    }

    fetchAvailableGames();
  }, [user, isLoading]);

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

  const fetchCompetitionStatus = async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://statmindsports.com/api';
      const response = await fetch(`${apiUrl}/competition/status`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });
      const data = await response.json();
      if (data.success) {
        setCompetitionStatus(data.status);
      }
    } catch (error) {
      console.error('Error fetching competition status:', error);
    }
  };

  const fetchUserParlays = async () => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) return;

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://statmindsports.com/api';
      const response = await fetch(`${apiUrl}/parlay/mine?season=${currentSeason}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      if (data.success) {
        // Filter to only show parlays for the current week
        const currentWeekParlays = data.parlays.filter(p => p.week === currentWeek);
        setUserParlays(currentWeekParlays);
      }
    } catch (error) {
      console.error('Error fetching user parlays:', error);
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
      setCalculation(null);
    }
  }, [selectedPicks]);

  useEffect(() => {
    fetchAvailableGames();
    fetchCompetitionStatus();
    fetchUserParlays();
  }, [currentWeek]);

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
      console.log('🔍 Probability response:', data);
      console.log('🔍 combinedProbability value:', data.combinedProbability);
      console.log('🔍 Type:', typeof data.combinedProbability);
      setCalculation(data);
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

      // Enrich selectedPicks with complete game data
      const completeGamesData = selectedPicks.map(pick => {
        const gameData = availableGames.find(g => g.id === pick.game_id);

        return {
          game_id: pick.game_id,
          home_team: gameData.home_team,
          away_team: gameData.away_team,
          picked_winner: pick.picked_winner,
          ai_winner: gameData.predicted_winner,
          ai_probability: pick.picked_winner === gameData.home_team
            ? gameData.home_win_probability
            : gameData.away_win_probability
        };
      });

      console.log('💾 Saving parlay with data:', {
        parlayName,
        season: currentSeason,
        week: currentWeek,
        games: completeGamesData
      });

      const response = await fetch('/api/parlay/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          parlayName: parlayName,
          season: currentSeason,
          week: currentWeek,
          games: completeGamesData
        })
      });

      const responseData = await response.json();
      refreshBalance();
      console.log('💾 Response:', responseData);

      if (!response.ok) {
        console.error('❌ Save failed:', responseData);
        throw new Error(responseData.error || 'Failed to save parlay');
      }

      alert('Parlay saved successfully! 🎉');
      // Reset form to build another parlay
      setSelectedPicks([]);
      setParlayName('');
      setCalculation(null);
      // Refresh the games and user parlays
      fetchAvailableGames();
      fetchCompetitionStatus();
      fetchUserParlays();
    } catch (err) {
      // Show the actual error message from the backend
      const errorMessage = err.message || 'Failed to save parlay. Please try again.';
      alert(errorMessage);
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

        {/* Header with Competition Status */}
        <div className="flex items-start justify-between gap-6 mb-8">
          {/* Left: Header */}
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">🎲 Parlay Builder</h1>
            <p className="text-slate-400">
              Create your custom parlay for Week {currentWeek} • Select 2+ games
            </p>
          </div>

          {/* Right: Competition Status Banner */}
          {competitionStatus && (
            <div className="flex-shrink-0 w-[700px]">
              <CompetitionStatusBanner
                status={competitionStatus}
              />
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">

          {/* Left Column: Available Games */}
          <div className="lg:col-span-3">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
              <h2 className="text-2xl font-bold text-white mb-6">
                Available Games ({availableGames.length})
              </h2>

              {availableGames.length === 0 ? (
                <p className="text-slate-400">No games available for this week yet.</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {availableGames.map((game) => {
                    const selectedPick = selectedPicks.find(p => p.game_id === game.id);
                    const isSelected = !!selectedPick;
                    const awayRecord = game.away_wins !== null ? `${game.away_wins}-${game.away_losses}` : '';
                    const homeRecord = game.home_wins !== null ? `${game.home_wins}-${game.home_losses}` : '';

                    // Calculate probabilities
                    const awayProb = parseFloat(game.away_win_probability) || 0;
                    const homeProb = parseFloat(game.home_win_probability) || 0;

                    return (
                      <div
                        key={game.id}
                        className={`bg-slate-800/50 rounded-lg overflow-hidden border-2 transition-all ${isSelected
                          ? 'border-emerald-500 shadow-lg shadow-emerald-500/30'
                          : 'border-slate-700/50'
                          }`}
                      >
                        {/* Header - Date */}
                        <div className="bg-slate-800/80 px-3 py-1.5 border-b border-slate-700/50">
                          <div className="text-xs text-slate-300 font-medium">
                            {formatShortGameDateTime(game.game_date)}
                          </div>
                        </div>

                        {/* Teams Container */}
                        <div className="p-3 flex items-center justify-between">

                          {/* Away Team - Clickable */}
                          <button
                            onClick={() => toggleGamePick(game, game.away_team)}
                            className={`flex items-center space-x-2.5 flex-1 transition-all ${selectedPick?.picked_winner === game.away_team
                              ? 'opacity-100'
                              : 'opacity-70 hover:opacity-100'
                              }`}
                          >
                            {/* Away Team Logo */}
                            <div className="w-12 h-12 flex-shrink-0">
                              {getTeamLogo(game.away_team) ? (
                                <img
                                  src={getTeamLogo(game.away_team)}
                                  alt={game.away_team}
                                  className="w-full h-full object-contain drop-shadow-lg"
                                />
                              ) : (
                                <div className="w-full h-full bg-slate-700 rounded-lg flex items-center justify-center">
                                  <span className="text-lg font-bold text-white">
                                    {game.away_team.split(' ').pop().charAt(0)}
                                  </span>
                                </div>
                              )}
                            </div>

                            {/* Away Team Info */}
                            <div className="text-left">
                              <div className={`text-xl font-bold leading-tight ${selectedPick?.picked_winner === game.away_team
                                ? 'text-white'
                                : 'text-slate-300'
                                }`}>
                                {game.away_team.split(' ').pop().toUpperCase().substring(0, 3)}
                              </div>
                              <div className="text-slate-400 text-xs my-0.5">
                                {awayRecord}
                              </div>
                              <div className={`text-lg font-bold ${selectedPick?.picked_winner === game.away_team
                                ? 'text-blue-400'
                                : 'text-slate-400'
                                }`}>
                                {(awayProb * 100).toFixed(1)}%
                              </div>
                            </div>
                          </button>

                          {/* @ Symbol */}
                          <div className="px-3">
                            <div className="w-8 h-8 rounded-full bg-slate-700/50 flex items-center justify-center">
                              <span className="text-slate-400 text-sm font-bold">@</span>
                            </div>
                          </div>

                          {/* Home Team - Clickable */}
                          <button
                            onClick={() => toggleGamePick(game, game.home_team)}
                            className={`flex items-center space-x-2.5 flex-1 justify-end transition-all ${selectedPick?.picked_winner === game.home_team
                              ? 'opacity-100'
                              : 'opacity-70 hover:opacity-100'
                              }`}
                          >
                            {/* Home Team Info */}
                            <div className="text-right">
                              <div className={`text-xl font-bold leading-tight ${selectedPick?.picked_winner === game.home_team
                                ? 'text-white'
                                : 'text-slate-300'
                                }`}>
                                {game.home_team.split(' ').pop().toUpperCase().substring(0, 3)}
                              </div>
                              <div className="text-slate-400 text-xs my-0.5">
                                {homeRecord}
                              </div>
                              <div className={`text-lg font-bold ${selectedPick?.picked_winner === game.home_team
                                ? 'text-emerald-400'
                                : 'text-slate-400'
                                }`}>
                                {(homeProb * 100).toFixed(1)}%
                              </div>
                            </div>

                            {/* Home Team Logo */}
                            <div className="w-12 h-12 flex-shrink-0">
                              {getTeamLogo(game.home_team) ? (
                                <img
                                  src={getTeamLogo(game.home_team)}
                                  alt={game.home_team}
                                  className="w-full h-full object-contain drop-shadow-lg"
                                />
                              ) : (
                                <div className="w-full h-full bg-slate-700 rounded-lg flex items-center justify-center">
                                  <span className="text-lg font-bold text-white">
                                    {game.home_team.split(' ').pop().charAt(0)}
                                  </span>
                                </div>
                              )}
                            </div>
                          </button>
                        </div>

                        {/* Win Probability Bar */}
                        <div className="px-3 pb-2">
                          <div className="h-1.5 bg-slate-900 rounded-full overflow-hidden flex">
                            <div
                              className="bg-blue-500 transition-all"
                              style={{ width: `${awayProb * 100}%` }}
                            />
                            <div
                              className="bg-emerald-500 transition-all"
                              style={{ width: `${homeProb * 100}%` }}
                            />
                          </div>
                        </div>

                        {/* Selected Indicator */}
                        {isSelected && (
                          <div className="px-3 pb-2">
                            <div className="bg-emerald-500/20 border border-emerald-500/50 rounded py-1 text-center">
                              <span className="text-emerald-400 font-semibold text-xs">
                                ✓ {selectedPick.picked_winner} selected
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Your Parlay + Existing Parlays */}
          <div className="lg:col-span-1 space-y-6">

            {/* Current Parlay Being Built */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 sticky top-6">
              <h2 className="text-2xl font-bold text-white mb-6">
                Your Parlay ({selectedPicks.length})
              </h2>

              {selectedPicks.length === 0 ? (
                <p className="text-slate-400 text-sm">
                  Select games from the left to build your parlay
                </p>
              ) : (
                <div className="space-y-4">
                  {/* Selected picks display - keep existing code */}
                  {selectedPicks.map((pick, index) => (
                    <div key={index} className="bg-slate-800/50 rounded-lg p-3 border border-slate-700">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-white font-semibold text-sm">{pick.picked_winner}</span>
                        <button
                          onClick={() => handleRemovePick(pick.game_id)}
                          className="text-red-400 hover:text-red-300 text-xs"
                        >
                          Remove
                        </button>
                      </div>
                      <p className="text-slate-400 text-xs">
                        vs {pick.opponent} • {pick.ai_probability}% AI confidence
                      </p>
                    </div>
                  ))}

                  {/* Parlay Name Input */}
                  <div className="mt-4">
                    <label className="block text-slate-400 text-sm font-medium mb-2">
                      Parlay Name
                    </label>
                    <input
                      type="text"
                      value={parlayName}
                      onChange={(e) => setParlayName(e.target.value)}
                      placeholder="Enter parlay name..."
                      maxLength={100}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition"
                    />
                  </div>

                  {/* Parlay Stats - keep existing code */}
                  {calculation && (
                    <div className="bg-slate-800/30 rounded-lg p-4 mt-4 space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-400">Combined Probability:</span>
                        <span className="text-white font-semibold">{calculation.combinedProbability}%</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-400">Risk Level:</span>
                        <span className={`font-semibold ${calculation.riskLevel === 'Low' ? 'text-green-400' :
                          calculation.riskLevel === 'Medium' ? 'text-yellow-400' : 'text-red-400'
                          }`}>
                          {calculation.riskLevel}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Save Button - keep existing code */}
                  <button
                    onClick={handleSaveParlay}
                    disabled={saving || selectedPicks.length < 2 || !parlayName.trim()}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-700 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-lg transition mt-4"
                  >
                    {saving ? 'Saving...' : 'Save Parlay'}
                  </button>
                </div>
              )}
            </div>

            {/* Existing Parlays for This Week */}
            {userParlays.length > 0 && (
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                <h3 className="text-xl font-bold text-white mb-4">
                  Your Week {currentWeek} Parlays ({userParlays.length})
                </h3>

                <div className="space-y-3">
                  {userParlays.map(parlay => (
                    <div
                      key={parlay.id}
                      className="bg-slate-800/50 border border-slate-700 rounded-lg p-4 hover:border-slate-600 transition-colors cursor-pointer"
                      onClick={() => router.push('/my-parlays')}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h4 className="text-white font-semibold text-sm">{parlay.parlay_name}</h4>
                          <p className="text-slate-400 text-xs mt-1">
                            {parlay.leg_count} legs • {parlay.risk_level} risk
                          </p>
                        </div>

                        {/* Status Badge */}
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${parlay.is_hit === null
                          ? 'bg-yellow-900/30 text-yellow-400'
                          : parlay.is_hit === true
                            ? 'bg-green-900/30 text-green-400'
                            : 'bg-red-900/30 text-red-400'
                          }`}>
                          {parlay.is_hit === null ? 'Pending' : parlay.is_hit ? 'Won' : 'Lost'}
                        </span>
                      </div>

                      {/* Practice/Competition Badge */}
                      <div className="flex items-center gap-2 mt-2">
                        {parlay.is_practice_parlay ? (
                          <span className="text-xs bg-blue-900/30 text-blue-400 px-2 py-0.5 rounded">
                            🎯 Practice
                          </span>
                        ) : (
                          <span className="text-xs bg-amber-900/30 text-amber-400 px-2 py-0.5 rounded">
                            🏆 Competition
                          </span>
                        )}

                        <span className="text-xs text-slate-500">
                          {new Date(parlay.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                <button
                  onClick={() => router.push('/my-parlays')}
                  className="w-full mt-4 bg-slate-700 hover:bg-slate-600 text-white font-semibold py-2 px-4 rounded-lg transition text-sm"
                >
                  View All Parlays →
                </button>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}