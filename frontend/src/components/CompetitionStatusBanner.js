'use client';
import { useRouter } from 'next/navigation';
import { useAuth } from '../contexts/AuthContext';
import { useState, useEffect } from 'react';

export default function CompetitionStatusBanner({ status }) {
  const router = useRouter();
  const { user } = useAuth();
  const [timeRemaining, setTimeRemaining] = useState('');

  // Update time remaining
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

      if (days > 0) {
        setTimeRemaining(`${days}d ${hours}h`);
      } else if (hours > 0) {
        setTimeRemaining(`${hours}h`);
      } else {
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        setTimeRemaining(`${minutes}m`);
      }
    };

    updateTime();
    const interval = setInterval(updateTime, 60000);
    return () => clearInterval(interval);
  }, [status]);

  if (!status) return null;

  const { parlayCount, competition, accountTier } = status;
  const prizeAmount = competition?.prizeAmount || 50;

  // Free user banner - encourage upgrade
  if (accountTier === 'free' || user?.membership_tier === 'free') {
    return (
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl shadow-lg px-6 py-4 border-2 border-purple-400/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-3xl">🏆</span>
            <div>
              <div className="text-white font-bold text-lg">
                Compete for ${prizeAmount} Weekly Prize
              </div>
              <div className="text-purple-100 text-sm">
                {parlayCount} practice {parlayCount === 1 ? 'parlay' : 'parlays'} created • Upgrade to compete!
              </div>
            </div>
          </div>
          <button
            onClick={() => router.push('/upgrade')}
            className="bg-white text-purple-600 px-5 py-2 rounded-lg text-sm font-semibold hover:bg-purple-50 transition-all whitespace-nowrap"
          >
            Upgrade Now
          </button>
        </div>
      </div>
    );
  }

  // Premium/VIP user banner - show competition status
  const competitionParlays = parlayCount || 0;
  const hasCompetitionParlays = competitionParlays > 0;

  return (
    <div className={`rounded-xl shadow-lg px-6 py-4 border-2 ${
      hasCompetitionParlays 
        ? 'bg-gradient-to-r from-emerald-600 to-teal-600 border-emerald-400/50' 
        : 'bg-gradient-to-r from-blue-600 to-indigo-600 border-blue-400/50'
    }`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-3xl">{hasCompetitionParlays ? '🎯' : '🏈'}</span>
          <div>
            <div className="text-white font-bold text-lg">
              {hasCompetitionParlays 
                ? `You're Competing! (${competitionParlays} ${competitionParlays === 1 ? 'Entry' : 'Entries'})` 
                : 'Weekly Competition Open'}
            </div>
            <div className="text-white/90 text-sm">
              {hasCompetitionParlays 
                ? `Competing for $${prizeAmount} • ${timeRemaining} remaining` 
                : `Build parlays to compete for $${prizeAmount} • ${timeRemaining} remaining`}
            </div>
          </div>
        </div>
        <button
          onClick={() => router.push('/leaderboard?tab=weekly')}
          className="bg-white/20 hover:bg-white/30 border border-white/30 text-white px-5 py-2 rounded-lg text-sm font-semibold whitespace-nowrap transition-all"
        >
          View Leaderboard →
        </button>
      </div>
    </div>
  );
}