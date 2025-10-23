'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function PracticeModeBanner({ status }) {
  const router = useRouter();
  const [isCollapsed, setIsCollapsed] = useState(true);
  const [timeRemaining, setTimeRemaining] = useState('');

  // Calculate time remaining
  useEffect(() => {
    if (!status?.competition) return;

    const updateTime = () => {
      const now = new Date();
      const end = new Date(status.competition.endsAt || '2025-10-27T19:50:00.000Z');
      const diff = end - now;

      if (diff <= 0) {
        setTimeRemaining('Ended');
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      setTimeRemaining(`${days}d ${hours}h remaining`);
    };

    updateTime();
    const interval = setInterval(updateTime, 60000);
    return () => clearInterval(interval);
  }, [status]);

  if (!status) return null;

  const { parlayCount = 0, activePlayersCount = 0, competition } = status;
  const prizeAmount = competition?.prizeAmount || 50;
  // Calculate points based on correct formula
  const calculatePoints = (legCount) => {
    if (legCount === 2) return 2;
    if (legCount === 3) return 6;
    if (legCount === 4) return 12;
    if (legCount === 5) return 25;
    if (legCount >= 6) return 50;
    return 0;
  };

  // For the banner, show potential points assuming the user's current parlay distribution
  // Default to showing 4-leg average if we don't have detailed data
  const hypotheticalPoints = status.hypotheticalPoints || 0;

  return (
    <div className="bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 rounded-xl shadow-2xl border-2 border-purple-500/50 overflow-hidden">
      {/* Compact Header */}
      <div className="px-5 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="text-3xl">🎯</div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xl font-bold text-white">Practice Mode</h3>
              <span className="bg-white/20 text-white px-2.5 py-0.5 rounded-full text-xs font-semibold">
                {parlayCount} Free {parlayCount === 1 ? 'Parlay' : 'Parlays'}
              </span>
            </div>
            <p className="text-purple-200 text-xs">Your parlays are for practice only</p>
          </div>
        </div>
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="text-white/80 hover:text-white transition-colors text-sm"
        >
          <span className="mr-1">{isCollapsed ? 'Expand' : 'Collapse'}</span>
          <span className={`inline-block transition-transform text-xs ${isCollapsed ? 'rotate-180' : ''}`}>▼</span>
        </button>
      </div>

      {/* Compact Expandable Content */}
      {!isCollapsed && (
        <div className="px-5 pb-4 space-y-4">
          {/* Tighter Stats Grid */}
          <div className="grid grid-cols-3 gap-3">
            {/* Weekly Prize */}
            <div className="bg-black/20 backdrop-blur rounded-lg p-3 border border-white/10">
              <div className="flex items-center gap-1.5 mb-1.5">
                <span className="text-lg">💰</span>
                <span className="text-purple-200 text-xs font-semibold uppercase tracking-wide">Weekly Prize</span>
              </div>
              <div className="text-2xl font-bold text-white">${prizeAmount}</div>
              <div className="text-purple-300 text-xs mt-0.5">{timeRemaining}</div>
            </div>

            {/* Your Potential */}
            <div className="bg-black/20 backdrop-blur rounded-lg p-3 border border-white/10">
              <div className="flex items-center gap-1.5 mb-1.5">
                <span className="text-lg">🎯</span>
                <span className="text-purple-200 text-xs font-semibold uppercase tracking-wide">Your Potential</span>
              </div>
              <div className="text-2xl font-bold text-white">{hypotheticalPoints} Points</div>
              <div className="text-purple-300 text-xs mt-0.5">If this was competitive</div>
            </div>

            {/* Active Players */}
            <div className="bg-black/20 backdrop-blur rounded-lg p-3 border border-white/10">
              <div className="flex items-center gap-1.5 mb-1.5">
                <span className="text-lg">👥</span>
                <span className="text-purple-200 text-xs font-semibold uppercase tracking-wide">Active Players</span>
              </div>
              <div className="text-2xl font-bold text-white">{activePlayersCount}</div>
              <div className="text-purple-300 text-xs mt-0.5">Competing this week</div>
            </div>
          </div>

          {/* Compact What You're Missing */}
          <div className="bg-black/20 backdrop-blur rounded-lg p-3 border border-red-500/30">
            <div className="flex items-center gap-1.5 mb-2">
              <span className="text-lg">💡</span>
              <h4 className="text-emerald-400 font-bold text-sm">What You're Missing:</h4>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="flex items-center gap-1.5">
                <span className="text-red-400">✗</span>
                <span className="text-white text-xs">Can't win weekly cash prizes</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-red-400">✗</span>
                <span className="text-white text-xs">No leaderboard ranking</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-red-400">✗</span>
                <span className="text-white text-xs">Missing bragging rights</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-red-400">✗</span>
                <span className="text-white text-xs">No competition stats</span>
              </div>
            </div>
          </div>

          {/* Compact CTA Button */}
          <button
            onClick={() => router.push('/upgrade')}
            className="w-full bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 hover:from-pink-600 hover:via-purple-600 hover:to-indigo-600 text-white font-bold text-base py-3 rounded-lg shadow-lg hover:shadow-xl transition-all transform hover:scale-[1.02] flex items-center justify-center gap-2"
          >
            <span className="text-xl">🏆</span>
            Upgrade to Premium
          </button>
          <p className="text-center text-purple-200 text-xs -mt-2">
            Only $9.99/mo • Cancel anytime • Join today!
          </p>
        </div>
      )}
    </div>
  );
}