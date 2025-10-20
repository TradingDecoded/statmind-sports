'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getTeamLogo, getTeamName } from '@/utils/teamLogos';

export default function MyParlaysPage() {
  const router = useRouter();
  const [parlays, setParlays] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [userStats, setUserStats] = useState(null);
  const [expandedParlays, setExpandedParlays] = useState(new Set());
  const [error, setError] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (!token) {
      router.push('/login?redirect=/my-parlays');
      return;
    }
    fetchMyParlays();
    fetchUserStats();
  }, []);

  const fetchMyParlays = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`/api/parlay/mine?t=${Date.now()}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache'
        },
        cache: 'no-store'
      });

      if (!response.ok) throw new Error('Failed to fetch');

      const data = await response.json();
      console.log('🔍 Fetched parlays data:', data.parlays);
      if (data.parlays && data.parlays.length > 0) {
        console.log('🔍 First parlay games:', data.parlays[0].games);
        if (data.parlays[0].games && data.parlays[0].games.length > 0) {
          console.log('🔍 First game in first parlay:', data.parlays[0].games[0]);
        }
      }
      setParlays(data.parlays || []);
    } catch (err) {
      setError('Failed to load parlays');
    } finally {
      setLoading(false);
    }
  };

  const fetchUserStats = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch('/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) throw new Error('Failed to fetch stats');

      const data = await response.json();
      setUserStats(data.user);
    } catch (err) {
      console.error('Stats error:', err);
    }
  };

  const deleteParlay = async (parlayId) => {
    if (!confirm('Are you sure you want to delete this parlay? This action cannot be undone.'))
      return;

    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`/api/parlay/${parlayId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      // Check if parlay is locked
      if (!response.ok) {
        if (data.locked) {
          // Show specific message about parlay being locked
          alert(`🔒 Parlay Locked\n\n${data.message}`);
        } else {
          alert(`Failed to delete parlay: ${data.error || 'Unknown error'}`);
        }
        return;
      }

      // Successfully deleted
      setParlays(prevParlays => prevParlays.filter(p => p.id !== parlayId));
      router.refresh();
      await fetchMyParlays();
      await fetchUserStats();

      alert('✅ Parlay deleted successfully');
    } catch (err) {
      console.error('Delete error:', err);
      alert('Failed to delete parlay. Please try again.');
      fetchMyParlays();
    }
  };

  const toggleExpanded = (parlayId) => {
    setExpandedParlays(prev => {
      const newSet = new Set(prev);
      if (newSet.has(parlayId)) {
        newSet.delete(parlayId);
      } else {
        newSet.add(parlayId);
      }
      return newSet;
    });
  };

  // Check if parlay is locked (any game has started or is in progress)
  const isParlayLocked = (parlay) => {
    if (!parlay.games || parlay.games.length === 0) return false;

    const now = new Date();

    // Check if ANY game has started (either by date or by status)
    return parlay.games.some(game => {
      const gameDate = new Date(game.game_date);

      // Check status if available
      if (game.status && (game.status === 'in_progress' || game.status === 'final')) {
        return true;
      }

      // Also check if game date has passed
      return gameDate <= now;
    });
  };

  // Fix probability display - handle both decimal and percentage formats
  const formatProbability = (prob) => {
    // Handle null, undefined, or non-numeric values
    if (prob === null || prob === undefined || isNaN(prob)) {
      return 'N/A';
    }

    // Convert to number if it's a string
    const numProb = typeof prob === 'string' ? parseFloat(prob) : prob;

    // Check again after conversion
    if (isNaN(numProb)) {
      return 'N/A';
    }

    // If it's already a large number (like 1460), it's stored incorrectly
    // We'll divide by 100 to get the correct percentage
    if (numProb > 100) {
      return (numProb / 100).toFixed(1) + '%';
    }

    // If it's between 0 and 1 (decimal format like 0.146)
    if (numProb <= 1) {
      return (numProb * 100).toFixed(1) + '%';
    }

    // If it's already a percentage between 1-100
    return numProb.toFixed(1) + '%';
  };

  const filteredParlays = parlays.filter(parlay => {
    if (filter === 'all') return true;
    return parlay.status === filter;
  });

  const getStatusBadge = (status) => {
    const styles = {
      pending: 'bg-yellow-500/20 text-yellow-300 border-yellow-500',
      won: 'bg-green-500/20 text-green-300 border-green-500',
      lost: 'bg-red-500/20 text-red-300 border-red-500'
    };
    return `${styles[status] || styles.pending} px-3 py-1 rounded-full text-xs border font-semibold uppercase`;
  };

  const getRiskBadge = (risk) => {
    const styles = {
      Low: 'bg-emerald-500/20 text-emerald-300 border-emerald-500',
      Medium: 'bg-amber-500/20 text-amber-300 border-amber-500',
      High: 'bg-red-500/20 text-red-300 border-red-500'
    };
    return `${styles[risk] || styles.Medium} px-2 py-1 rounded text-xs border`;
  };

  // Render individual pick details with team logos - COMPACT VERSION
  // Render individual pick details with team logos and GAME RESULTS
  const renderPickDetails = (parlay) => {
    if (!parlay.games || parlay.games.length === 0) {
      return (
        <div className="text-slate-400 text-sm italic">
          No pick details available
        </div>
      );
    }

    const isResolved = parlay.is_hit !== null;

    return (
      <div className="space-y-2 mt-3">
        <div className="text-xs font-semibold text-slate-400 mb-2">
          Your Picks ({parlay.games.length} legs):
        </div>
        {parlay.games.map((game, index) => {
          const matchup = `${game.away_team} @ ${game.home_team}`;
          const pickedTeam = game.picked_winner;
          const aiPick = game.ai_winner;

          // Game result data
          const gameData = game.gameData;
          const isFinal = gameData?.is_final || false;
          const isCorrect = gameData?.is_correct;
          const homeScore = gameData?.home_score;
          const awayScore = gameData?.away_score;

          // Safely format AI probability
          let aiProb = 'N/A';
          if (game.ai_probability !== null && game.ai_probability !== undefined) {
            const probNum = typeof game.ai_probability === 'string'
              ? parseFloat(game.ai_probability)
              : game.ai_probability;

            if (!isNaN(probNum)) {
              if (probNum > 100) {
                aiProb = (probNum / 100).toFixed(1);
              } else if (probNum <= 1) {
                aiProb = (probNum * 100).toFixed(1);
              } else {
                aiProb = probNum.toFixed(1);
              }
            }
          }

          const matchedAI = pickedTeam === aiPick;

          // Determine background color based on result
          let bgColor = 'bg-slate-800/30'; // Default: pending
          if (isFinal && isCorrect !== null) {
            bgColor = isCorrect ? 'bg-green-900/20' : 'bg-red-900/20';
          }

          // Determine border color
          let borderColor = 'border-slate-700'; // Default: pending
          if (isFinal && isCorrect !== null) {
            borderColor = isCorrect ? 'border-green-600/50' : 'border-red-600/50';
          }

          return (
            <div
              key={index}
              className={`${bgColor} ${borderColor} border rounded-lg p-3`}
            >
              {/* Matchup Header with Team Logos */}
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  {/* Away Team */}
                  <img
                    src={getTeamLogo(game.away_team)}
                    alt={game.away_team}
                    className="w-6 h-6 object-contain"
                  />
                  <span className="text-slate-300 text-sm font-semibold">
                    {game.away_team}
                  </span>

                  <span className="text-slate-600">@</span>

                  {/* Home Team */}
                  <img
                    src={getTeamLogo(game.home_team)}
                    alt={game.home_team}
                    className="w-6 h-6 object-contain"
                  />
                  <span className="text-slate-300 text-sm font-semibold">
                    {game.home_team}
                  </span>
                </div>

                {/* Result Indicator */}
                {isFinal && isCorrect !== null && (
                  <div className="flex items-center gap-1">
                    {isCorrect ? (
                      <>
                        <span className="text-green-400 text-lg font-bold">✓</span>
                        <span className="text-green-400 text-xs font-semibold">WIN</span>
                      </>
                    ) : (
                      <>
                        <span className="text-red-400 text-lg font-bold">✗</span>
                        <span className="text-red-400 text-xs font-semibold">LOSS</span>
                      </>
                    )}
                  </div>
                )}

                {!isFinal && (
                  <span className="text-slate-500 text-xs italic">Pending</span>
                )}
              </div>

              {/* Final Score Display */}
              {isFinal && homeScore !== null && awayScore !== null && (
                <div className="mb-2 py-1 px-2 bg-slate-900/50 rounded text-center">
                  <span className="text-slate-400 text-xs font-semibold">FINAL: </span>
                  <span className={`font-bold text-sm ${awayScore > homeScore ? 'text-white' : 'text-slate-500'
                    }`}>
                    {game.away_team} {awayScore}
                  </span>
                  <span className="text-slate-600 mx-1">-</span>
                  <span className={`font-bold text-sm ${homeScore > awayScore ? 'text-white' : 'text-slate-500'
                    }`}>
                    {game.home_team} {homeScore}
                  </span>
                </div>
              )}

              {/* Your Pick */}
              <div className="mb-1">
                <span className="text-slate-500 text-xs">YOUR PICK: </span>
                <span className={`font-bold text-sm ${isFinal && isCorrect
                  ? 'text-green-400'
                  : isFinal && isCorrect === false
                    ? 'text-red-400'
                    : 'text-blue-400'
                  }`}>
                  {getTeamName(pickedTeam)}
                </span>
                {matchedAI && (
                  <span className="ml-2 px-2 py-0.5 bg-purple-500/20 text-purple-300 text-xs rounded border border-purple-500/50">
                    Matched AI
                  </span>
                )}
              </div>

              {/* AI Pick Comparison */}
              <div className="flex items-center gap-2 text-xs">
                <span className="text-slate-500">AI Pick:</span>
                <span className={matchedAI ? 'text-emerald-400 font-semibold' : 'text-amber-400 font-semibold'}>
                  {aiPick}
                </span>
                <span className="text-slate-600">•</span>
                <span className="text-slate-400">{aiProb}% confidence</span>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 py-8">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center text-slate-400">Loading your parlays...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 py-6">
      <div className="max-w-6xl mx-auto px-4">
        {/* Compact Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-white mb-1">My Parlays</h1>
          <p className="text-slate-400 text-sm">Track your predictions and performance</p>
        </div>

        {/* Compact User Stats */}
        {userStats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-3">
              <div className="text-slate-400 text-xs mb-1">Total Parlays</div>
              <div className="text-xl font-bold text-white">
                {userStats.total_parlays || 0}
              </div>
            </div>
            <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-3">
              <div className="text-slate-400 text-xs mb-1">Wins</div>
              <div className="text-xl font-bold text-green-400">
                {userStats.total_wins || 0}
              </div>
            </div>
            <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-3">
              <div className="text-slate-400 text-xs mb-1">Win Rate</div>
              <div className="text-xl font-bold text-blue-400">
                {userStats.win_rate ? `${userStats.win_rate}%` : '0%'}
              </div>
            </div>
            <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-3">
              <div className="text-slate-400 text-xs mb-1">Avg Legs</div>
              <div className="text-xl font-bold text-purple-400">
                {userStats.avg_leg_count || '0'}
              </div>
            </div>
          </div>
        )}

        {/* Compact Filter Tabs and Create Button - SAME ROW */}
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <div className="flex gap-2 flex-wrap">
            {['all', 'pending', 'won', 'lost'].map(status => (
              <button
                key={status}
                onClick={() => setFilter(status)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium capitalize transition-colors ${filter === status
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                  }`}
              >
                {status}
              </button>
            ))}
          </div>

          <Link
            href="/parlay-builder"
            className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-5 py-2 rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity"
          >
            + Create New Parlay
          </Link>
        </div>

        {/* Parlays Grid - NARROW CARDS WITH MAX WIDTH */}
        {filteredParlays.length === 0 ? (
          <div className="bg-slate-800/30 border border-slate-700 rounded-lg p-8 text-center max-w-2xl mx-auto">
            <div className="text-slate-400 mb-3 text-sm">
              {filter === 'all'
                ? "You haven't created any parlays yet"
                : `No ${filter} parlays found`}
            </div>
            <Link
              href="/parlay-builder"
              className="inline-block bg-blue-600 text-white px-5 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors"
            >
              Create Your First Parlay
            </Link>
          </div>
        ) : (
          <div className="flex flex-wrap gap-4 justify-start">
            {filteredParlays.map(parlay => {
              const isExpanded = expandedParlays.has(parlay.id);

              return (
                <div
                  key={parlay.id}
                  className="bg-slate-800/50 border border-slate-700 rounded-lg p-4 hover:border-slate-600 transition-colors w-full sm:w-[calc(50%-0.5rem)] lg:w-[calc(33.333%-0.67rem)] max-w-md"
                >
                  {/* Compact Parlay Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="text-lg font-semibold text-white mb-1">
                        {parlay.parlay_name}
                      </h3>
                      <div className="flex items-center gap-2 text-xs text-slate-400">
                        <span>Season {parlay.season}</span>
                        <span>•</span>
                        <span>Week {parlay.week}</span>
                        <span>•</span>
                        <span>{parlay.leg_count} Legs</span>
                      </div>
                      {/* Legs Hit Progress */}
                      {parlay.games && parlay.games.length > 0 && (() => {
                        const totalLegs = parlay.games.length;
                        const gamesWithResults = parlay.games.filter(g => g.gameData?.is_final);
                        const legsWithResults = gamesWithResults.length;
                        const legsHit = gamesWithResults.filter(g => g.gameData?.is_correct === true).length;

                        if (legsWithResults > 0) {
                          return (
                            <div className="mt-2">
                              <div className="flex items-center gap-2 mb-1">
                                <div className="text-xs text-slate-400">
                                  Legs: <span className={`font-bold ${parlay.is_hit === true ? 'text-green-400' :
                                    parlay.is_hit === false ? 'text-red-400' :
                                      'text-blue-400'
                                    }`}>
                                    {legsHit}/{totalLegs}
                                  </span> hit
                                </div>
                                {legsWithResults < totalLegs && (
                                  <span className="text-xs text-slate-500 italic">
                                    ({totalLegs - legsWithResults} pending)
                                  </span>
                                )}
                              </div>
                              <div className="w-full bg-slate-700 rounded-full h-1.5">
                                <div
                                  className={`h-1.5 rounded-full transition-all ${parlay.is_hit === true ? 'bg-green-500' :
                                    parlay.is_hit === false ? 'bg-red-500' :
                                      'bg-blue-500'
                                    }`}
                                  style={{ width: `${(legsHit / totalLegs) * 100}%` }}
                                ></div>
                              </div>
                            </div>
                          );
                        }
                        return null;
                      })()}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={getStatusBadge(parlay.status)}>
                        {parlay.status}
                      </span>
                    </div>
                  </div>

                  {/* Improved Stats Row - Risk Left, Probability Center, Cost Right */}
                  <div className="grid grid-cols-3 gap-3 mb-3">
                    <div>
                      <div className="text-slate-500 text-xs mb-0.5">Risk Level</div>
                      <span className={getRiskBadge(parlay.risk_level)}>
                        {parlay.risk_level}
                      </span>
                    </div>
                    <div className="text-center">
                      <div className="text-slate-500 text-xs mb-0.5">Combined Probability</div>
                      <div className="text-white font-semibold text-sm">
                        {formatProbability(parlay.combined_ai_probability)}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-slate-500 text-xs mb-0.5">Cost</div>
                      <div className="text-white font-semibold text-sm">
                        {parlay.is_hit !== null
                          ? `${parlay.legs_hit || 0}/${parlay.leg_count}`
                          : `${parlay.sms_bucks_cost || 0} SMS`}
                      </div>
                    </div>
                  </div>

                  {/* Compact Expand/Collapse Button */}
                  <button
                    onClick={() => toggleExpanded(parlay.id)}
                    className="w-full bg-slate-900/50 hover:bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs font-medium text-slate-300 transition-colors mb-3 flex items-center justify-center gap-1.5"
                  >
                    {isExpanded ? (
                      <>
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                        Hide Pick Details
                      </>
                    ) : (
                      <>
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                        Show Pick Details
                      </>
                    )}
                  </button>

                  {/* Expandable Pick Details */}
                  {isExpanded && renderPickDetails(parlay)}

                  {/* Compact Actions */}
                  <div className="flex gap-2 pt-3 border-t border-slate-700 items-center">
                    {parlay.is_hit === null && (
                      isParlayLocked(parlay) ? (
                        <div className="flex items-center gap-1.5 text-slate-500 text-xs">
                          <span>🔒</span>
                          <span>Locked</span>
                        </div>
                      ) : (
                        <button
                          onClick={() => deleteParlay(parlay.id)}
                          className="px-3 py-1.5 bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded-lg text-xs font-medium transition-colors"
                        >
                          Delete
                        </button>
                      )
                    )}
                    <div className="text-xs text-slate-500 flex items-center">
                      Created {new Date(parlay.created_at).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}