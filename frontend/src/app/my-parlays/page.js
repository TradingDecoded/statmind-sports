'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function MyParlaysPage() {
  const router = useRouter();
  const [parlays, setParlays] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [userStats, setUserStats] = useState(null);

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
    if (!confirm('Are you sure you want to delete this parlay?')) return;

    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`/api/parlay/${parlayId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) throw new Error('Failed to delete');

      // Optimistically remove from state
      setParlays(prevParlays => prevParlays.filter(p => p.id !== parlayId));

      // Force Next.js to refresh
      router.refresh();

      // Also fetch fresh data
      await fetchMyParlays();
      await fetchUserStats();

      alert('Parlay deleted successfully');
    } catch (err) {
      console.error('Delete error:', err);
      alert('Failed to delete parlay');
      fetchMyParlays();
    }
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

    return (
      <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${styles[status] || styles.pending}`}>
        {status?.toUpperCase() || 'PENDING'}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-white text-xl">Loading your parlays...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 py-8">
      <div className="max-w-6xl mx-auto px-4">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">🏆 My Parlays</h1>
            <p className="text-slate-400">Track your parlay performance</p>
          </div>
          <Link
            href="/parlay-builder"
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-lg font-semibold transition-all"
          >
            ➕ Create New Parlay
          </Link>
        </div>

        {/* User Stats */}
        {userStats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-slate-900 border border-slate-800 rounded-lg p-4">
              <div className="text-slate-400 text-sm mb-1">Total Parlays</div>
              <div className="text-white text-3xl font-bold">
                {userStats.total_parlays || 0}
              </div>
            </div>
            <div className="bg-slate-900 border border-slate-800 rounded-lg p-4">
              <div className="text-slate-400 text-sm mb-1">Wins</div>
              <div className="text-emerald-400 text-3xl font-bold">
                {userStats.total_wins || 0}
              </div>
            </div>
            <div className="bg-slate-900 border border-slate-800 rounded-lg p-4">
              <div className="text-slate-400 text-sm mb-1">Win Rate</div>
              <div className="text-white text-3xl font-bold">
                {userStats.win_rate ? `${(userStats.win_rate * 100).toFixed(1)}%` : '0%'}
              </div>
            </div>
            <div className="bg-slate-900 border border-slate-800 rounded-lg p-4">
              <div className="text-slate-400 text-sm mb-1">Current Streak</div>
              <div className="text-yellow-400 text-3xl font-bold">
                {userStats.current_streak || 0} 🔥
              </div>
            </div>
          </div>
        )}

        {/* Filter Buttons */}
        <div className="flex space-x-2 mb-6">
          {['all', 'pending', 'won', 'lost'].map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-4 py-2 rounded-lg font-semibold transition-all ${filter === status
                ? 'bg-emerald-600 text-white'
                : 'bg-slate-900 border border-slate-800 text-slate-300 hover:bg-slate-800'
                }`}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
        </div>

        {/* Parlays List */}
        {filteredParlays.length === 0 ? (
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-12 text-center">
            <div className="text-6xl mb-4">🎲</div>
            <h2 className="text-2xl font-bold text-white mb-2">
              {filter === 'all' ? 'No parlays yet' : `No ${filter} parlays`}
            </h2>
            <p className="text-slate-400 mb-6">
              {filter === 'all'
                ? 'Create your first parlay to get started!'
                : `You don't have any ${filter} parlays.`}
            </p>
            <Link
              href="/parlay-builder"
              className="inline-block bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-3 rounded-lg font-semibold transition-all"
            >
              Create Your First Parlay
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredParlays.map((parlay) => (
              <div
                key={parlay.id}
                className="bg-slate-900 border border-slate-800 rounded-lg p-6"
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-white mb-1">
                      {parlay.parlay_name}
                    </h3>
                    <p className="text-sm text-slate-400">
                      Week {parlay.week} • {parlay.season} • {parlay.leg_count} legs
                    </p>
                  </div>
                  <div className="flex items-center space-x-3">
                    {getStatusBadge(parlay.status)}
                    <button
                      onClick={() => deleteParlay(parlay.id)}
                      className="text-red-400 hover:text-red-300"
                    >
                      🗑️
                    </button>
                  </div>
                </div>

                {/* Probability & Results */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div className="bg-slate-800 rounded p-3">
                    <div className="text-xs text-slate-400 mb-1">AI Probability</div>
                    <div className="text-white font-bold">
                      {parlay.combined_ai_probability ? `${parseFloat(parlay.combined_ai_probability).toFixed(1)}%` : 'N/A'}
                    </div>
                  </div>
                  <div className="bg-slate-800 rounded p-3">
                    <div className="text-xs text-slate-400 mb-1">Risk Level</div>
                    <div className="text-white font-bold">{parlay.risk_level || 'N/A'}</div>
                  </div>
                  <div className="bg-slate-800 rounded p-3">
                    <div className="text-xs text-slate-400 mb-1">Correct Picks</div>
                    <div className="text-white font-bold">
                      {parlay.correct_legs || 0} / {parlay.leg_count}
                    </div>
                  </div>
                  <div className="bg-slate-800 rounded p-3">
                    <div className="text-xs text-slate-400 mb-1">Created</div>
                    <div className="text-white font-bold text-sm">
                      {new Date(parlay.created_at).toLocaleDateString()}
                    </div>
                  </div>
                </div>

                {/* Picks */}
                <div className="space-y-2">
                  {parlay.games && typeof parlay.games === 'string' && JSON.parse(parlay.games).map((game, index) => (
                    <div
                      key={index}
                      className="bg-slate-800/50 rounded p-3 flex items-center justify-between"
                    >
                      <div className="text-white">
                        <span className="font-semibold">{game.picked_winner}</span>
                        <span className="text-slate-400 text-sm ml-2">
                          ({game.away_team} @ {game.home_team})
                        </span>
                      </div>
                      {game.result && (
                        <span className={`text-sm font-semibold ${game.result === 'correct' ? 'text-emerald-400' : 'text-red-400'
                          }`}>
                          {game.result === 'correct' ? '✓ Correct' : '✗ Wrong'}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}