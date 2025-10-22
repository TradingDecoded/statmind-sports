'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../contexts/AuthContext';

export default function CompetitionHero() {
  const [competition, setCompetition] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timeRemaining, setTimeRemaining] = useState('');
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    fetchCompetition();
  }, []);

  useEffect(() => {
    if (!competition) return;

    const updateTime = () => {
      const now = new Date();
      const end = new Date(competition.end_datetime);
      const diff = end - now;

      if (diff <= 0) {
        setTimeRemaining('Ended');
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

      if (days > 0) {
        setTimeRemaining(`${days}d ${hours}h left`);
      } else if (hours > 0) {
        setTimeRemaining(`${hours}h left`);
      } else {
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        setTimeRemaining(`${minutes}m left`);
      }
    };

    updateTime();
    const interval = setInterval(updateTime, 60000);
    return () => clearInterval(interval);
  }, [competition]);

  const fetchCompetition = async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://statmindsports.com/api';
      const response = await fetch(`${apiUrl}/competition/current`);
      const data = await response.json();

      if (data.success) {
        setCompetition(data.competition);
      }
    } catch (error) {
      console.error('Error fetching competition:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClick = () => {
    if (!user) {
      router.push('/login');
    } else if (user.membership_tier === 'free') {
      router.push('/upgrade');
    } else {
      // Premium/VIP users - go straight to parlay builder with toggle
      router.push('/parlay-builder');
    }
  };

  if (loading || !competition) return null;

  const isPremium = user && user.membership_tier !== 'free';

  return (
    <div className="flex justify-center px-4 pt-4 pb-4 relative z-10">
      <div
        onClick={handleClick}
        className="bg-gradient-to-r from-amber-600 via-yellow-500 to-amber-600 cursor-pointer hover:from-amber-500 hover:via-yellow-400 hover:to-amber-500 transition-all duration-300 rounded-xl shadow-lg"
      >
        <div className="px-6 py-3">
          <div className="flex items-center justify-between gap-6 text-white">

            {/* Left: Prize Info */}
            <div className="flex items-center gap-3">
              <span className="text-2xl">🏆</span>
              <div>
                <div className="text-xs font-semibold uppercase tracking-wider opacity-90">
                  Weekly Competition
                </div>
                <div className="text-xl font-bold">
                  ${competition.prize_amount} Prize
                  {competition.is_rollover && (
                    <span className="text-sm ml-2 bg-white/20 px-2 py-0.5 rounded">JACKPOT</span>
                  )}
                </div>
              </div>
            </div>

            {/* Middle: Stats */}
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-1.5">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                </svg>
                <span className="font-semibold">{competition.total_participants || 0} Entries</span>
              </div>

              <div className="flex items-center gap-1.5">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                </svg>
                <span className="font-semibold">{timeRemaining}</span>
              </div>
            </div>

            {/* Right: CTA */}
            <button
              onClick={handleClick}
              className="bg-white text-amber-600 px-6 py-2 rounded-lg font-bold text-sm hover:bg-amber-50 transition-all shadow-lg hover:scale-105 whitespace-nowrap"
            >
              {!user ? 'Join Now' : isPremium ? 'Build Parlay' : 'Upgrade to Enter'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}