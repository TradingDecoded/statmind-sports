'use client';
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';

export default function UserProfilePage() {
  const params = useParams();
  const username = params.username;
  
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchUserProfile();
  }, [username]);

  const fetchUserProfile = async () => {
    try {
      const response = await fetch(`/api/users/${username}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          setError('User not found');
        } else {
          setError('Failed to load profile');
        }
        setLoading(false);
        return;
      }

      const data = await response.json();
      setProfile(data);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching profile:', err);
      setError('Failed to load profile');
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      year: 'numeric' 
    });
  };

  const getStatusBadge = (isHit) => {
    if (isHit === null) {
      return <span className="px-3 py-1 rounded-full text-xs font-semibold bg-yellow-500/20 text-yellow-300 border border-yellow-500">PENDING</span>;
    }
    if (isHit) {
      return <span className="px-3 py-1 rounded-full text-xs font-semibold bg-green-500/20 text-green-300 border border-green-500">WON ✓</span>;
    }
    return <span className="px-3 py-1 rounded-full text-xs font-semibold bg-red-500/20 text-red-300 border border-red-500">LOST ✗</span>;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-white text-xl">Loading profile...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-400 text-2xl mb-4">{error}</div>
          <Link href="/" className="text-emerald-400 hover:text-emerald-300">
            ← Back to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 py-8">
      <div className="max-w-6xl mx-auto px-4">

        {/* Profile Header */}
        <div className="bg-gradient-to-br from-slate-900 to-slate-800 border border-slate-700 rounded-xl p-8 mb-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-6">
              {/* Avatar */}
              <div className="w-24 h-24 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-full flex items-center justify-center">
                <span className="text-white text-4xl font-bold">
                  {username.charAt(0).toUpperCase()}
                </span>
              </div>

              {/* User Info */}
              <div>
                <h1 className="text-4xl font-bold text-white mb-2">
                  {profile.user.displayName || username}
                </h1>
                <p className="text-slate-400 text-lg">@{username}</p>
                <p className="text-slate-500 text-sm mt-2">
                  Member since {formatDate(profile.user.joinedDate)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-6 text-center">
            <div className="text-3xl font-bold text-white mb-2">
              {profile.stats.total_parlays || 0}
            </div>
            <div className="text-slate-400 text-sm">Total Parlays</div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-lg p-6 text-center">
            <div className="text-3xl font-bold text-emerald-400 mb-2">
              {profile.stats.total_wins || 0}
            </div>
            <div className="text-slate-400 text-sm">Wins</div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-lg p-6 text-center">
            <div className="text-3xl font-bold text-white mb-2">
              {profile.stats.win_rate 
                ? `${(profile.stats.win_rate * 100).toFixed(1)}%` 
                : '0%'}
            </div>
            <div className="text-slate-400 text-sm">Win Rate</div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-lg p-6 text-center">
            <div className="text-3xl font-bold text-yellow-400 mb-2">
              {profile.stats.current_streak || 0} 🔥
            </div>
            <div className="text-slate-400 text-sm">Current Streak</div>
          </div>
        </div>

        {/* Additional Stats */}
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-bold text-white mb-4">Career Stats</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div>
              <div className="text-slate-400 text-sm mb-1">Losses</div>
              <div className="text-white text-2xl font-bold">
                {profile.stats.total_losses || 0}
              </div>
            </div>
            <div>
              <div className="text-slate-400 text-sm mb-1">Best Streak</div>
              <div className="text-white text-2xl font-bold">
                {profile.stats.best_streak || 0}
              </div>
            </div>
            <div>
              <div className="text-slate-400 text-sm mb-1">Pending</div>
              <div className="text-white text-2xl font-bold">
                {profile.stats.pending_parlays || 0}
              </div>
            </div>
          </div>
        </div>

        {/* Recent Parlays */}
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-6">
          <h2 className="text-2xl font-bold text-white mb-4">Recent Parlays</h2>
          
          {profile.recentParlays.length === 0 ? (
            <p className="text-slate-400 text-center py-8">
              No public parlays yet
            </p>
          ) : (
            <div className="space-y-3">
              {profile.recentParlays.map((parlay) => (
                <div
                  key={parlay.id}
                  className="bg-slate-800 border border-slate-700 rounded-lg p-4 hover:border-emerald-500 transition-all"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <h3 className="text-white font-semibold text-lg">
                        {parlay.parlay_name || 'Unnamed Parlay'}
                      </h3>
                      <p className="text-slate-400 text-sm">
                        Week {parlay.week}, {parlay.season} • {parlay.leg_count} legs
                      </p>
                    </div>
                    {getStatusBadge(parlay.is_hit)}
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-slate-400">
                      AI Probability: {' '}
                      <span className="text-emerald-400 font-semibold">
                        {parlay.combined_ai_probability 
                          ? `${(parlay.combined_ai_probability * 100).toFixed(1)}%`
                          : 'N/A'}
                      </span>
                    </div>
                    <div className="text-xs text-slate-500">
                      {formatDate(parlay.created_at)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}