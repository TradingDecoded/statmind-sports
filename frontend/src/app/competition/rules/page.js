'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../contexts/AuthContext';

export default function CompetitionRulesPage() {
  const [competition, setCompetition] = useState(null);
  const [dontShowAgain, setDontShowAgain] = useState(false);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Check if user has opted out of seeing this page
    const hasOptedOut = localStorage.getItem('competition_rules_opted_out');
    if (hasOptedOut === 'true') {
      // Skip directly to parlay builder
      router.push('/parlay-builder');
      return;
    }

    fetchCompetition();
  }, []);

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

  const handleProceed = () => {
    if (dontShowAgain) {
      localStorage.setItem('competition_rules_opted_out', 'true');
    }
    router.push('/parlay-builder');
  };

  const handleViewLeaderboard = () => {
    router.push('/leaderboard?tab=weekly');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 flex items-center justify-center">
        <div className="text-white text-xl">Loading competition details...</div>
      </div>
    );
  }

  if (!competition) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-white mb-4">No Active Competition</h1>
          <p className="text-slate-300 mb-6">Check back soon for the next weekly competition!</p>
          <button
            onClick={() => router.push('/')}
            className="bg-emerald-500 text-white px-6 py-3 rounded-lg font-semibold hover:bg-emerald-600"
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 py-12 px-4">
      <div className="max-w-4xl mx-auto">

        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-block bg-gradient-to-r from-amber-600 via-yellow-500 to-amber-600 rounded-full px-6 py-2 mb-6">
            <span className="text-white font-bold text-lg uppercase tracking-wider">
              🏆 Weekly Competition
            </span>
          </div>

          <h1 className="text-5xl font-extrabold text-white mb-4">
            Win ${competition.prize_amount}
            {competition.is_rollover && (
              <span className="text-amber-400 ml-3 text-3xl animate-pulse">JACKPOT!</span>
            )}
          </h1>

          <p className="text-xl text-slate-300">
            Create winning parlays to compete for cash prizes every week
          </p>
        </div>

        {/* Rules Grid */}
        <div className="space-y-6 mb-12">

          {/* How to Enter */}
          <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
            <div className="flex items-start gap-4">
              <div className="text-4xl">🎯</div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-white mb-3">How to Enter</h2>
                <ul className="space-y-2 text-slate-300">
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-400 mt-1">✓</span>
                    <span>Must be a <span className="text-amber-400 font-semibold">Premium or VIP member</span></span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-400 mt-1">✓</span>
                    <span>Create at least <span className="font-semibold text-white">3 parlays</span> during the week (Sunday-Saturday)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-400 mt-1">✓</span>
                    <span>Each parlay requires <span className="font-semibold text-white">SMS Bucks</span> to enter</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-400 mt-1">✓</span>
                    <span>You're automatically entered once you meet the minimum requirements</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Entry Costs */}
          <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
            <div className="flex items-start gap-4">
              <div className="text-4xl">💰</div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-white mb-3">SMS Bucks Entry Costs</h2>
                <div className="grid grid-cols-2 gap-3 text-slate-300">
                  <div className="bg-slate-900 rounded-lg p-3">
                    <div className="text-lg font-bold text-white">2-leg parlay</div>
                    <div className="text-amber-400 font-semibold">50 SMS Bucks</div>
                  </div>
                  <div className="bg-slate-900 rounded-lg p-3">
                    <div className="text-lg font-bold text-white">3-leg parlay</div>
                    <div className="text-amber-400 font-semibold">75 SMS Bucks</div>
                  </div>
                  <div className="bg-slate-900 rounded-lg p-3">
                    <div className="text-lg font-bold text-white">4-leg parlay</div>
                    <div className="text-amber-400 font-semibold">100 SMS Bucks</div>
                  </div>
                  <div className="bg-slate-900 rounded-lg p-3">
                    <div className="text-lg font-bold text-white">5-leg parlay</div>
                    <div className="text-amber-400 font-semibold">125 SMS Bucks</div>
                  </div>
                  <div className="bg-slate-900 rounded-lg p-3 col-span-2">
                    <div className="text-lg font-bold text-white">6+ leg parlay</div>
                    <div className="text-amber-400 font-semibold">150 SMS Bucks</div>
                  </div>
                </div>
                <p className="mt-3 text-sm text-slate-400">
                  💡 Premium members get <span className="text-white font-semibold">300 SMS Bucks monthly</span> • VIP members get <span className="text-white font-semibold">750 SMS Bucks monthly</span>
                </p>
              </div>
            </div>
          </div>

          {/* Points System */}
          <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
            <div className="flex items-start gap-4">
              <div className="text-4xl">📊</div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-white mb-3">Points System</h2>
                <p className="text-slate-300 mb-4">
                  Points are only awarded for <span className="text-emerald-400 font-semibold">winning parlays</span>. The more legs, the more points you earn!
                </p>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                  <div className="text-center bg-slate-900 rounded-lg p-3">
                    <div className="text-2xl font-bold text-white">2</div>
                    <div className="text-xs text-slate-400">2-leg win</div>
                  </div>
                  <div className="text-center bg-slate-900 rounded-lg p-3">
                    <div className="text-2xl font-bold text-white">5</div>
                    <div className="text-xs text-slate-400">3-leg win</div>
                  </div>
                  <div className="text-center bg-slate-900 rounded-lg p-3">
                    <div className="text-2xl font-bold text-white">10</div>
                    <div className="text-xs text-slate-400">4-leg win</div>
                  </div>
                  <div className="text-center bg-slate-900 rounded-lg p-3">
                    <div className="text-2xl font-bold text-white">20</div>
                    <div className="text-xs text-slate-400">5-leg win</div>
                  </div>
                  <div className="text-center bg-slate-900 rounded-lg p-3">
                    <div className="text-2xl font-bold text-white">40</div>
                    <div className="text-xs text-slate-400">6+ leg win</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Prize Rules */}
          <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
            <div className="flex items-start gap-4">
              <div className="text-4xl">🏅</div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-white mb-3">Prize & Winner</h2>
                <ul className="space-y-2 text-slate-300">
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-400 mt-1">•</span>
                    <span>Winner is the user with the <span className="font-semibold text-white">most points</span> at the end of the week</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-400 mt-1">•</span>
                    <span>Winner determined automatically every <span className="font-semibold text-white">Tuesday at 2 AM ET</span></span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-400 mt-1">•</span>
                    <span>Minimum requirement: <span className="font-semibold text-white">2 Premium members</span> with <span className="font-semibold text-white">3+ parlays each</span></span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-amber-400 text-lg">★</span>
                    <span className="text-amber-400 font-semibold">If minimums not met, prize rolls over to next week creating bigger jackpots!</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

        </div>

        {/* View Current Leaderboard Link */}
        <div className="text-center mb-8">
          <button
            onClick={handleViewLeaderboard}
            className="text-amber-400 hover:text-amber-300 underline text-sm"
          >
            View Current Week Leaderboard →
          </button>
        </div>

        {/* Don't Show Again Checkbox */}
        <div className="bg-slate-800 rounded-lg p-4 mb-6 border border-slate-700">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={dontShowAgain}
              onChange={(e) => setDontShowAgain(e.target.checked)}
              className="w-5 h-5 rounded border-slate-600 bg-slate-700 text-emerald-500 focus:ring-emerald-500 focus:ring-offset-0"
            />
            <span className="text-slate-300 text-sm">
              Don't show this page again (you can view rules anytime from the leaderboard)
            </span>
          </label>
        </div>

        {/* Proceed Button */}
        <div className="text-center">
          <button
            onClick={handleProceed}
            className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white px-12 py-4 rounded-xl font-bold text-xl shadow-2xl hover:scale-105 transition-all"
          >
            Create My Parlay →
          </button>
          <p className="text-slate-400 text-sm mt-4">
            You have <span className="text-white font-semibold">{user?.sms_bucks || 0} SMS Bucks</span> available
          </p>
        </div>

      </div>
    </div>
  );
}
