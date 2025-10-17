// frontend/src/app/leaderboard/page.js
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function LeaderboardPage() {
  const [activeTab, setActiveTab] = useState('overall');
  const [leaderboardData, setLeaderboardData] = useState([]);
  const [myRank, setMyRank] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const router = useRouter();

  useEffect(() => {
    fetchLeaderboard();
    fetchStats();
  }, [activeTab]);

  const fetchLeaderboard = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      const endpoint = activeTab === 'overall' 
        ? '/api/leaderboard/overall'
        : '/api/leaderboard/weekly';
      
      const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
      
      const response = await fetch(endpoint, { headers });
      const data = await response.json();
      
      if (data.success) {
        setLeaderboardData(data.leaderboard);
        setMyRank(data.my_rank);
      } else {
        setError(data.error);
      }
    } catch (err) {
      console.error('Error fetching leaderboard:', err);
      setError('Failed to load leaderboard');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/leaderboard/stats');
      const data = await response.json();
      
      if (data.success) {
        setStats(data.stats);
      }
    } catch (err) {
      console.error('Error fetching stats:', err);
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

        {/* Platform Stats */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-gray-800 rounded-lg p-4 text-center">
              <div className="text-3xl font-bold text-blue-400">{stats.total_users}</div>
              <div className="text-sm text-gray-400">Total Players</div>
            </div>
            <div className="bg-gray-800 rounded-lg p-4 text-center">
              <div className="text-3xl font-bold text-green-400">{stats.total_parlays}</div>
              <div className="text-sm text-gray-400">Total Parlays</div>
            </div>
            <div className="bg-gray-800 rounded-lg p-4 text-center">
              <div className="text-3xl font-bold text-yellow-400">{stats.avg_win_rate}%</div>
              <div className="text-sm text-gray-400">Avg Win Rate</div>
            </div>
            <div className="bg-gray-800 rounded-lg p-4 text-center">
              <div className="text-3xl font-bold text-orange-400">🔥 {stats.best_streak_ever}</div>
              <div className="text-sm text-gray-400">Best Streak Ever</div>
            </div>
          </div>
        )}

        {/* My Rank Card */}
        {myRank && (
          <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg p-6 mb-8 text-center">
            <div className="text-lg mb-2">Your Current Rank</div>
            <div className="text-5xl font-bold">{getRankBadge(myRank)}</div>
            <div className="text-sm mt-2 text-gray-200">
              {activeTab === 'overall' ? 'Overall Rankings' : 'This Week'}
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex justify-center mb-8 space-x-4">
          <button
            onClick={() => setActiveTab('overall')}
            className={`px-6 py-3 rounded-lg font-semibold transition-all ${
              activeTab === 'overall'
                ? 'bg-blue-600 text-white shadow-lg'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
          >
            🏆 Overall
          </button>
          <button
            onClick={() => setActiveTab('weekly')}
            className={`px-6 py-3 rounded-lg font-semibold transition-all ${
              activeTab === 'weekly'
                ? 'bg-blue-600 text-white shadow-lg'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
          >
            📅 This Week
          </button>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">⏳</div>
            <div className="text-xl text-gray-400">Loading leaderboard...</div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-900 text-white rounded-lg p-6 text-center">
            <div className="text-2xl mb-2">❌</div>
            <div>{error}</div>
          </div>
        )}

        {/* Leaderboard Table */}
        {!loading && !error && leaderboardData.length > 0 && (
          <div className="bg-gray-800 rounded-lg overflow-hidden shadow-2xl">
            <table className="w-full">
              <thead className="bg-gray-900">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-400">Rank</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-400">Player</th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-gray-400">Parlays</th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-gray-400">Win Rate</th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-gray-400">Record</th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-gray-400">Streak</th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-gray-400">Accuracy</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {leaderboardData.map((user, index) => {
                  const rank = parseInt(user.rank);
                  const isTopThree = rank <= 3;
                  const totalParlays = activeTab === 'overall' 
                    ? user.total_parlays 
                    : user.weekly_parlays;
                  const wins = activeTab === 'overall'
                    ? user.total_wins
                    : user.weekly_wins;
                  const losses = activeTab === 'overall'
                    ? user.total_losses
                    : user.weekly_losses;
                  const winRate = activeTab === 'overall'
                    ? user.win_rate
                    : user.weekly_win_rate;
                  
                  return (
                    <tr 
                      key={user.id}
                      className={`hover:bg-gray-700 transition-colors cursor-pointer ${
                        isTopThree ? 'bg-gradient-to-r from-yellow-900/20 to-transparent' : ''
                      }`}
                      onClick={() => router.push(`/profile/${user.username}`)}
                    >
                      <td className="px-6 py-4">
                        <div className="text-2xl font-bold">
                          {getRankBadge(rank)}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold">
                            {user.username.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-semibold text-white">
                              {user.display_name || user.username}
                            </div>
                            <div className="text-sm text-gray-400">@{user.username}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="text-lg font-semibold">{totalParlays}</div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className={`text-lg font-bold ${
                          winRate >= 60 ? 'text-green-400' :
                          winRate >= 50 ? 'text-yellow-400' :
                          'text-red-400'
                        }`}>
                          {winRate}%
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="text-sm">
                          <span className="text-green-400">{wins}W</span>
                          {' - '}
                          <span className="text-red-400">{losses}L</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className={`text-lg font-semibold ${
                          user.current_streak > 0 ? 'text-green-400' :
                          user.current_streak < 0 ? 'text-red-400' :
                          'text-gray-400'
                        }`}>
                          {getStreakEmoji(user.current_streak)} {user.current_streak}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="text-sm text-gray-300">
                          {user.leg_accuracy ? `${user.leg_accuracy}%` : '-'}
                        </div>
                      </td>
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
            <p className="text-gray-500">
              Create at least 3 parlays to appear on the leaderboard!
            </p>
          </div>
        )}

        {/* Back Button */}
        <div className="mt-8 text-center">
          <button
            onClick={() => router.push('/parlay-builder')}
            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-semibold transition-all"
          >
            Create Parlay
          </button>
        </div>
      </div>
    </div>
  );
}
