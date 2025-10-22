// frontend/src/app/leaderboard/page.js
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function LeaderboardPage() {
  const [activeTab, setActiveTab] = useState('overall');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('tab') === 'weekly') {
      setActiveTab('weekly');
    }
  }, []);

  const [leaderboardData, setLeaderboardData] = useState([]);
  const [myRank, setMyRank] = useState(null);
  const [stats, setStats] = useState({
    total_users: 0,
    total_parlays: 0,
    avg_win_rate: 0,
    best_streak_ever: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const router = useRouter();
  const [competitionInfo, setCompetitionInfo] = useState(null);
  const [champion, setChampion] = useState(null);

  useEffect(() => {
    fetchLeaderboard();
    fetchChampion();
  }, [activeTab]); // Re-fetch when tab changes

  const fetchLeaderboard = async () => {
    setLoading(true);
    setError(null);

    try {
      const endpoint = activeTab === 'overall'
        ? '/leaderboard/overall'
        : '/leaderboard/competition';

      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://statmindsports.com/api';
      const response = await fetch(`${API_URL}${endpoint}`, {
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to fetch leaderboard');
      }

      const data = await response.json();

      if (data.success) {
        // Set leaderboard data
        setLeaderboardData(data.leaderboard || []);

        // ==========================================
        // CRITICAL FIX: Handle summary stats from backend
        // ==========================================
        if (activeTab === 'overall' && data.summary) {
          // For overall tab: use summary stats from backend
          setStats({
            total_users: data.summary.totalPlayers || 0,
            total_parlays: data.summary.totalParlays || 0,
            avg_win_rate: data.summary.avgWinRate || 0,
            best_streak_ever: data.summary.bestStreak || 0
          });
        } else if (activeTab === 'weekly') {
          // For weekly tab: fetch competition stats separately
          await fetchCompetitionStats();
        }

        // Store my rank if available
        if (data.my_rank) {
          setMyRank(data.my_rank);
        }

        // Store competition info if it exists
        if (activeTab === 'weekly' && data.competition) {
          setCompetitionInfo(data.competition);
        }
      } else {
        throw new Error(data.error || 'Failed to load leaderboard');
      }
    } catch (err) {
      console.error('Leaderboard fetch error:', err);
      setError(err.message);
      // Set empty stats on error
      setStats({
        total_users: 0,
        total_parlays: 0,
        avg_win_rate: 0,
        best_streak_ever: 0
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchCompetitionStats = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://statmindsports.com/api';

      const response = await fetch(`${API_URL}/leaderboard/competition-stats`, {
        headers: token ? {
          'Authorization': `Bearer ${token}`
        } : {}
      });

      if (!response.ok) throw new Error('Failed to fetch stats');

      const data = await response.json();
      if (data.success && data.stats) {
        setStats(data.stats);
      }
    } catch (err) {
      console.error('Competition stats error:', err);
    }
  };

  const fetchChampion = async () => {
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://statmindsports.com/api';
      const response = await fetch(`${API_URL}/leaderboard/champion`);
      const data = await response.json();

      if (data.success && data.champion) {
        setChampion(data.champion);
      }
    } catch (err) {
      console.error('Champion fetch error:', err);
    }
  };

  const getRankBadge = (rank) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return `#${rank}`;
  };

  const getStreakEmoji = (streak) => {
    if (streak >= 5) return '🔥';
    if (streak >= 3) return '⚡';
    if (streak <= -3) return '❄️';
    return '';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 text-white">
      <div className="container mx-auto px-4 py-8">

        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold mb-2 bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">
            🏆 Leaderboard
          </h1>
          <p className="text-gray-400">Top Parlay Builders on StatMind Sports</p>
        </div>

        {/* Tab Switcher */}
        <div className="flex justify-center gap-4 mb-8">
          <button
            onClick={() => setActiveTab('overall')}
            className={`px-8 py-3 rounded-lg font-semibold transition-all ${activeTab === 'overall'
              ? 'bg-blue-600 text-white shadow-lg'
              : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
              }`}
          >
            🏆 Overall
          </button>
          <button
            onClick={() => setActiveTab('weekly')}
            className={`px-8 py-3 rounded-lg font-semibold transition-all ${activeTab === 'weekly'
              ? 'bg-green-600 text-white shadow-lg'
              : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
              }`}
          >
            📅 This Week
          </button>
        </div>

        {/* Platform Stats - ALWAYS SHOW WITH ZEROS WHEN EMPTY */}
        <div className={`grid grid-cols-1 ${activeTab === 'weekly' ? 'md:grid-cols-3' : 'md:grid-cols-4'} gap-4 mb-8`}>
          <div className="bg-gray-800 rounded-lg p-4 text-center">
            <div className="text-3xl font-bold text-blue-400">{stats.total_users || 0}</div>
            <div className="text-sm text-gray-400">Total Players</div>
          </div>
          <div className="bg-gray-800 rounded-lg p-4 text-center">
            <div className="text-3xl font-bold text-green-400">{stats.total_parlays || 0}</div>
            <div className="text-sm text-gray-400">Total Parlays</div>
          </div>
          <div className="bg-gray-800 rounded-lg p-4 text-center">
            <div className="text-3xl font-bold text-yellow-400">{parseFloat(stats.avg_win_rate || 0).toFixed(2)}%</div>
            <div className="text-sm text-gray-400">Avg Win Rate</div>
          </div>
          {activeTab === 'overall' && (
            <div className="bg-gray-800 rounded-lg p-4 text-center">
              <div className="text-3xl font-bold text-orange-400">🔥 {stats.best_streak_ever || 0}</div>
              <div className="text-sm text-gray-400">Best Streak Ever</div>
            </div>
          )}
        </div>

        {/* My Rank Card */}
        {myRank && (
          <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg p-6 mb-8 text-center">
            <div className="text-lg mb-2">Your Current Rank</div>
            <div className="text-5xl font-bold">{getRankBadge(myRank)}</div>
            <div className="text-sm mt-2 text-gray-200">
              {activeTab === 'overall' ? 'Overall Leaderboard' : 'This Week\'s Competition'}
            </div>
          </div>
        )}

        {/* Competition Info Banner (Weekly Tab Only) */}
        {activeTab === 'weekly' && competitionInfo ? (
          <div className="mb-6">
            <div className="bg-gradient-to-r from-amber-600 to-orange-600 rounded-lg p-6 mb-4 shadow-xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <span className="text-5xl">🏈</span>
                  <div>
                    <div className="text-2xl font-bold text-white mb-2">
                      🏆 NFL Week {competitionInfo.nfl_week} Competition
                    </div>
                    <div className="text-amber-100 text-lg">
                      Prize Pool: <span className="text-3xl font-bold text-white">${competitionInfo.prize_amount.toFixed(2)}</span>
                      {competitionInfo.is_rollover && (
                        <span className="ml-3 bg-yellow-400 text-gray-900 px-3 py-1 rounded-full text-sm font-bold">
                          🎰 ROLLOVER!
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-amber-100 text-sm">Competition Status</div>
                  <div className="text-white font-bold text-xl capitalize">{competitionInfo.status}</div>
                </div>
              </div>
            </div>
            <div className="text-center">
              <a href="/competition/rules" className="text-yellow-400 hover:text-yellow-300 underline text-sm font-semibold">
                📋 View Weekly Competition Rules & Prize Info
              </a>
            </div>
          </div>
        ) : null}

        {/* Reigning Champion Banner - Shows on Weekly tab if there's a champion */}
        {activeTab === 'weekly' && champion && (
          <div className="bg-gradient-to-r from-purple-900 via-pink-900 to-purple-900 border-2 border-yellow-400 rounded-xl p-6 mb-6 shadow-2xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <span className="text-6xl animate-pulse">👑</span>
                <div>
                  <div className="text-yellow-400 text-sm font-bold uppercase tracking-wider mb-1">
                    Reigning Champion
                  </div>
                  <div className="text-3xl font-bold text-white mb-2">
                    {champion.display_name || champion.username}
                  </div>
                  <div className="text-purple-200 text-sm">
                    Week {champion.nfl_week} Winner • {champion.winner_points} Points • ${champion.prize_amount} Prize
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-yellow-400 text-sm font-semibold mb-1">Lifetime Wins</div>
                <div className="text-5xl font-bold text-yellow-400">
                  {champion.competitions_won}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="text-center py-20">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            <p className="text-gray-400 mt-4">Loading leaderboard...</p>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="bg-red-900/50 border border-red-700 rounded-lg p-6 text-center">
            <div className="text-red-400 text-lg mb-2">⚠️ Error Loading Leaderboard</div>
            <p className="text-gray-300">{error}</p>
            <button
              onClick={fetchLeaderboard}
              className="mt-4 px-6 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Leaderboard Table */}
        {!loading && !error && leaderboardData.length > 0 && (
          <div className="bg-gray-800 rounded-lg overflow-hidden shadow-xl">
            <table className="w-full">
              <thead className="bg-gray-900">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-400">Rank</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-400">Player</th>

                  {activeTab === 'overall' ? (
                    <>
                      <th className="px-6 py-4 text-center text-sm font-semibold text-gray-400">Parlays</th>
                      <th className="px-6 py-4 text-center text-sm font-semibold text-gray-400">Win Rate</th>
                      <th className="px-6 py-4 text-center text-sm font-semibold text-gray-400">Record</th>
                      <th className="px-6 py-4 text-center text-sm font-semibold text-gray-400">Streak</th>
                      <th className="px-6 py-4 text-center text-sm font-semibold text-gray-400">Accuracy</th>
                      <th className="px-6 py-4 text-center text-sm font-semibold text-gray-400">Titles</th>
                    </>
                  ) : (
                    <>
                      <th className="px-6 py-4 text-center text-sm font-semibold text-gray-400">Points</th>
                      <th className="px-6 py-4 text-center text-sm font-semibold text-gray-400">Parlays Entered</th>
                      <th className="px-6 py-4 text-center text-sm font-semibold text-gray-400">Parlays Won</th>
                      <th className="px-6 py-4 text-center text-sm font-semibold text-gray-400">Tier</th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {leaderboardData.map((user, index) => {
                  const rank = parseInt(user.rank);
                  const isTopThree = rank <= 3;

                  return (
                    <tr key={user.id} className={`hover:bg-gray-750 transition-colors ${isTopThree ? 'bg-gray-800' : ''}`}>
                      {/* Rank */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          {rank === 1 && <span className="text-2xl">🥇</span>}
                          {rank === 2 && <span className="text-2xl">🥈</span>}
                          {rank === 3 && <span className="text-2xl">🥉</span>}
                          <span className={`text-lg font-bold ${isTopThree ? 'text-amber-400' : 'text-gray-400'}`}>
                            #{rank}
                          </span>
                        </div>
                      </td>

                      {/* Player */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          {user.avatar_url ? (
                            <img src={user.avatar_url} alt={user.username} className="w-10 h-10 rounded-full" />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                              <span className="text-white font-bold">{user.username?.[0]?.toUpperCase() || 'U'}</span>
                            </div>
                          )}
                          <div>
                            <div className="text-white font-semibold flex items-center gap-2">
                              {user.display_name || user.username}
                              {user.competitions_won > 0 && (
                                <span className="text-yellow-400 text-sm">
                                  🏆 x{user.competitions_won}
                                </span>
                              )}
                            </div>
                            <div className="text-gray-400 text-sm">@{user.username}</div>
                          </div>
                        </div>
                      </td>

                      {activeTab === 'overall' ? (
                        <>
                          {/* Parlays */}
                          <td className="px-6 py-4 text-center">
                            <span className="text-white font-semibold">{user.total_parlays || 0}</span>
                          </td>

                          {/* Win Rate */}
                          <td className="px-6 py-4 text-center">
                            <span className={`text-lg font-bold ${parseFloat(user.win_rate) >= 70 ? 'text-green-400' :
                              parseFloat(user.win_rate) >= 50 ? 'text-yellow-400' :
                                'text-red-400'
                              }`}>
                              {parseFloat(user.win_rate || 0).toFixed(1)}%
                            </span>
                          </td>

                          {/* Record */}
                          <td className="px-6 py-4 text-center">
                            <span className="text-gray-300">
                              <span className="text-green-400">{user.total_wins || 0}W</span>
                              {' - '}
                              <span className="text-red-400">{user.total_losses || 0}L</span>
                            </span>
                          </td>

                          {/* Streak */}
                          <td className="px-6 py-4 text-center">
                            <span className={`font-semibold ${user.current_streak > 0 ? 'text-green-400' :
                              user.current_streak < 0 ? 'text-red-400' :
                                'text-gray-400'
                              }`}>
                              {user.current_streak > 0 ? `🔥 ${user.current_streak}` :
                                user.current_streak < 0 ? `❄️ ${Math.abs(user.current_streak)}` :
                                  '-'}
                            </span>
                          </td>

                          {/* Leg Accuracy */}
                          <td className="px-6 py-4 text-center">
                            <span className="text-gray-300">{parseFloat(user.leg_accuracy || 0).toFixed(1)}%</span>
                          </td>
                        </>
                      ) : (
                        <>
                          {/* Competition Points */}
                          <td className="px-6 py-4 text-center">
                            <span className="text-xl font-bold text-amber-400">{user.total_points || 0}</span>
                          </td>

                          {/* Parlays Entered */}
                          <td className="px-6 py-4 text-center">
                            <span className="text-white font-semibold">{user.parlays_entered || 0}</span>
                          </td>

                          {/* Parlays Won */}
                          <td className="px-6 py-4 text-center">
                            <span className="text-green-400 font-semibold">{user.parlays_won || 0}</span>
                          </td>

                          {/* Competitions Won */}
                          <td className="px-6 py-4 text-center">
                            <span className="text-yellow-400 font-bold text-lg">
                              {user.competitions_won > 0 ? `🏆 ${user.competitions_won}` : '-'}
                            </span>
                          </td>

                          {/* Membership Tier */}
                          <td className="px-6 py-4 text-center">
                            <span className={`px-3 py-1 rounded-full text-xs font-bold ${user.membership_tier === 'vip' ? 'bg-purple-600 text-white' :
                              user.membership_tier === 'premium' ? 'bg-blue-600 text-white' :
                                'bg-gray-600 text-gray-300'
                              }`}>
                              {user.membership_tier?.toUpperCase() || 'FREE'}
                            </span>
                          </td>
                        </>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && leaderboardData.length === 0 && (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">📊</div>
            <div className="text-xl text-gray-400 mb-4">
              No rankings yet for {activeTab === 'overall' ? 'overall' : 'this week'}
            </div>
            <p className="text-gray-500 mb-6">
              Create at least 3 parlays to appear on the leaderboard!
            </p>
            <button
              onClick={() => router.push('/parlay-builder')}
              className="px-8 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold transition-colors"
            >
              Create Parlay
            </button>
          </div>
        )}
      </div>
    </div>
  );
}