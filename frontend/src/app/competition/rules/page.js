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

  const [opting, setOpting] = useState(false);

  const handleProceed = async () => {
    if (dontShowAgain) {
      localStorage.setItem('competition_rules_opted_out', 'true');
    }

    // Opt user into competition
    setOpting(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://statmindsports.com/api';
      const token = localStorage.getItem('authToken');

      const response = await fetch(`${apiUrl}/competition/opt-in`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (data.success) {
        // Successfully opted in - go to parlay builder
        router.push('/parlay-builder');
      } else {
        alert(`Could not enter competition: ${data.message}`);
        setOpting(false);
      }
    } catch (error) {
      console.error('Error opting in:', error);
      alert('Error entering competition. Please try again.');
      setOpting(false);
    }
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

          {/* Competition Window */}
          <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
            <div className="flex items-start gap-4">
              <div className="text-4xl">📅</div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-white mb-3">Competition Window</h2>
                <ul className="space-y-2 text-slate-300">
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-400 mt-1">✓</span>
                    <span><span className="font-semibold text-white">Opens:</span> Tuesday 2:00 AM ET (after Monday Night Football ends)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-400 mt-1">✓</span>
                    <span><span className="font-semibold text-white">Closes:</span> Sunday 3:50 PM ET (hard cutoff)</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

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
                    <span>Create <span className="font-semibold text-white">1+ parlay</span> during the competition window</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-400 mt-1">✓</span>
                    <span>Each parlay costs <span className="font-semibold text-white">100 SMS Bucks</span> and automatically enters the competition</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-400 mt-1">✓</span>
                    <span><span className="font-semibold text-white">NO MINIMUM</span> or maximum parlay requirements</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-400 mt-1">ℹ️</span>
                    <span className="text-slate-400">Free tier users get unlimited free practice parlays (do not compete for prizes)</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Entry Costs - FLAT RATE */}
          <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
            <div className="flex items-start gap-4">
              <div className="text-4xl">💰</div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-white mb-3">SMS Bucks Entry Costs</h2>
                <div className="bg-gradient-to-r from-amber-900/40 to-yellow-900/40 rounded-lg p-6 border border-amber-500/50 mb-4">
                  <div className="text-center">
                    <div className="text-sm text-amber-300 font-semibold mb-2">🎉 FLAT RATE PRICING!</div>
                    <div className="text-4xl font-bold text-white mb-2">100 SMS Bucks</div>
                    <div className="text-lg text-slate-300">per parlay • ALL LEG COUNTS</div>
                  </div>
                </div>
                <p className="text-sm text-slate-400 bg-slate-900/50 rounded-lg p-3">
                  💡 <span className="text-white font-semibold">Premium members</span> get 300 SMS Bucks monthly • <span className="text-purple-400 font-semibold">VIP members</span> get 750 SMS Bucks monthly
                </p>
              </div>
            </div>
          </div>

          {/* Points System - UPDATED VALUES */}
          <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
            <div className="flex items-start gap-4">
              <div className="text-4xl">📊</div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-white mb-3">Points System</h2>
                <p className="text-slate-300 mb-4">
                  Points are only awarded for <span className="text-emerald-400 font-semibold">winning parlays</span>. The more legs, the more points you earn!
                </p>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-4">
                  <div className="text-center bg-slate-900 rounded-lg p-3">
                    <div className="text-2xl font-bold text-white">2</div>
                    <div className="text-xs text-slate-400">2-leg win</div>
                  </div>
                  <div className="text-center bg-slate-900 rounded-lg p-3">
                    <div className="text-2xl font-bold text-white">6</div>
                    <div className="text-xs text-slate-400">3-leg win</div>
                  </div>
                  <div className="text-center bg-slate-900 rounded-lg p-3">
                    <div className="text-2xl font-bold text-white">12</div>
                    <div className="text-xs text-slate-400">4-leg win</div>
                  </div>
                  <div className="text-center bg-slate-900 rounded-lg p-3">
                    <div className="text-2xl font-bold text-white">25</div>
                    <div className="text-xs text-slate-400">5-leg win</div>
                  </div>
                  <div className="text-center bg-slate-900 rounded-lg p-3">
                    <div className="text-2xl font-bold text-white">50</div>
                    <div className="text-xs text-slate-400">6+ leg win</div>
                  </div>
                </div>
                <div className="bg-red-900/20 rounded-lg p-3 border border-red-500/30">
                  <p className="text-red-300 text-sm">
                    <span className="font-semibold">❌ All-or-Nothing:</span> Must hit EVERY leg to win. Miss one leg = 0 points. No partial credit.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Uniqueness Requirement */}
          <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
            <div className="flex items-start gap-4">
              <div className="text-4xl">🚫</div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-white mb-3">Uniqueness Requirement</h2>
                <ul className="space-y-2 text-slate-300">
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-400 mt-1">✓</span>
                    <span>Cannot create <span className="font-semibold text-white">duplicate parlays</span> in the same week</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Parlay Locking & Refunds */}
          <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
            <div className="flex items-start gap-4">
              <div className="text-4xl">🔒</div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-white mb-3">Parlay Locking & Refunds</h2>
                <div className="space-y-3">
                  <div className="bg-slate-900/50 rounded-lg p-3">
                    <div className="font-semibold text-emerald-400 mb-2">✅ Before the first game in your parlay starts:</div>
                    <ul className="space-y-1 ml-4 text-slate-300">
                      <li className="flex items-start gap-2">
                        <span className="text-emerald-400 mt-1">•</span>
                        <span>Can delete parlay for <span className="font-semibold text-white">FULL REFUND</span></span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-emerald-400 mt-1">•</span>
                        <span>Can edit parlay freely</span>
                      </li>
                    </ul>
                  </div>
                  <div className="bg-slate-900/50 rounded-lg p-3">
                    <div className="font-semibold text-red-400 mb-2">❌ After the first game in your parlay starts:</div>
                    <ul className="space-y-1 ml-4 text-slate-300">
                      <li className="flex items-start gap-2">
                        <span className="text-red-400 mt-1">•</span>
                        <span>Parlay is <span className="font-semibold text-white">LOCKED</span> - cannot edit or delete</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-red-400 mt-1">•</span>
                        <span>NO REFUND available</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Prize Rules - UPDATED MINIMUM */}
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
                    <span>Minimum requirement: <span className="font-semibold text-white">2 Premium/VIP members</span> with <span className="font-semibold text-white">1+ parlay each</span></span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-400 mt-1">💵</span>
                    <span>Base prize: <span className="font-semibold text-white">$50</span> (grows with rollovers)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-400 mt-1">•</span>
                    <span>Ties: Prize is <span className="font-semibold text-white">split equally</span></span>
                  </li>
                  <li className="flex items-center gap-2 mt-3">
                    <span className="text-amber-400 text-xl">★</span>
                    <span className="text-amber-400 font-semibold text-lg">If minimums not met, prize rolls over to next week creating bigger jackpots!</span>
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
            disabled={opting}
            className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white px-12 py-4 rounded-xl font-bold text-xl shadow-2xl hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {opting ? 'Entering Competition...' : 'Enter Competition & Create Parlay →'}
          </button>
          <p className="text-slate-400 text-sm mt-4">
            You have <span className="text-white font-semibold">{user?.sms_bucks || 0} SMS Bucks</span> available
          </p>
        </div>

      </div>
    </div>
  );
}