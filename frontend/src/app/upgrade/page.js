'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useRouter } from 'next/navigation';

export default function UpgradePage() {
  const { user } = useAuth();
  const router = useRouter();
  const [currentTier, setCurrentTier] = useState('free');
  const [loading, setLoading] = useState(true);
  const [testModeEnabled, setTestModeEnabled] = useState(false);
  const [upgradingTest, setUpgradingTest] = useState(false);

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }
    fetchMembershipInfo();
    checkTestModeStatus();
  }, [user]);

  const fetchMembershipInfo = async () => {
    try {
      const token = localStorage.getItem('authToken');

      if (!token) {
        router.push('/login');
        return;
      }

      const response = await fetch('/api/sms-bucks/membership', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setCurrentTier(data.tier);
      }
    } catch (error) {
      console.error('Error fetching membership:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkTestModeStatus = async () => {
    try {
      const response = await fetch('/api/test-mode/status');
      if (response.ok) {
        const data = await response.json();
        setTestModeEnabled(data.enabled);
      }
    } catch (error) {
      console.error('Error checking test mode:', error);
    }
  };

  const handleUpgrade = (tier) => {
    // TODO: Implement Stripe payment integration
    alert(`Upgrade to ${tier.toUpperCase()} coming soon! Payment integration in progress.`);
  };

  const handleTestUpgrade = async (tier) => {
    if (!confirm(`Upgrade to ${tier.toUpperCase()} in TEST MODE?\n\nThis will:\n• Mark your account as a test account\n• Grant you ${tier === 'premium' ? '500' : '1000'} SMS Bucks\n• Give you 30 days of ${tier.toUpperCase()} access\n• NO payment required\n\nContinue?`)) {
      return;
    }

    setUpgradingTest(true);

    try {
      const token = localStorage.getItem('authToken');

      const response = await fetch('/api/test-mode/upgrade', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ tier })
      });

      const data = await response.json();

      if (response.ok) {
        alert(`✅ TEST UPGRADE SUCCESSFUL!\n\nYou now have:\n• ${tier.toUpperCase()} membership\n• ${data.smsBucks} SMS Bucks\n• 30 days of access\n\nThis is a TEST account and can be deleted by admin.`);

        // Refresh the page to show new tier
        window.location.reload();
      } else {
        alert(`❌ Test upgrade failed: ${data.error}`);
      }

    } catch (error) {
      console.error('Test upgrade error:', error);
      alert('❌ Test upgrade failed. Please try again.');
    } finally {
      setUpgradingTest(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 py-12 px-4">
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-white mb-4">
            Unlock Premium Features
          </h1>
          <p className="text-xl text-slate-300 max-w-2xl mx-auto">
            Get SMS Bucks to enter parlays, compete in weekly competitions, and win cash prizes!
          </p>
        </div>

        {/* What are SMS Bucks? */}
        <div className="bg-gradient-to-r from-emerald-500 to-teal-600 rounded-2xl p-8 mb-12 shadow-xl">
          <div className="flex items-start gap-4">
            <div className="text-6xl">💰</div>
            <div>
              <h2 className="text-3xl font-bold text-white mb-3">
                What are SMS Bucks?
              </h2>
              <p className="text-emerald-50 text-lg leading-relaxed">
                SMS Bucks are our virtual currency that let you enter competition parlays and win real cash prizes.
                Each competition parlay costs 100 SMS Bucks (flat rate, regardless of legs). Create unlimited FREE
                practice parlays anytime, or enter the weekly competition! Premium and VIP members get monthly SMS
                Bucks allowances, daily login bonuses, and win rewards for hitting parlays.
              </p>
            </div>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-8 mb-12">

          {/* FREE TIER */}
          <div className={`bg-slate-800 rounded-2xl p-8 border-2 ${currentTier === 'free' ? 'border-slate-600' : 'border-slate-700'
            } relative`}>
            {currentTier === 'free' && (
              <div className="absolute top-4 right-4 bg-slate-600 text-white px-3 py-1 rounded-full text-sm font-semibold">
                Current Plan
              </div>
            )}

            <div className="text-center mb-6">
              <div className="text-4xl mb-3">🆓</div>
              <h3 className="text-2xl font-bold text-white mb-2">Free</h3>
              <div className="text-4xl font-bold text-white mb-1">$0</div>
              <div className="text-slate-400">Forever free</div>
            </div>

            <div className="space-y-3 mb-8">
              <div className="flex items-start gap-3">
                <span className="text-green-400 text-xl">✓</span>
                <span className="text-slate-300">View AI predictions</span>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-green-400 text-xl">✓</span>
                <span className="text-slate-300">Browse leaderboards</span>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-green-400 text-xl">✓</span>
                <span className="text-slate-300">See results & analytics</span>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-red-400 text-xl">✗</span>
                <span className="text-slate-500">No SMS Bucks</span>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-red-400 text-xl">✗</span>
                <span className="text-slate-500">Can't enter parlays</span>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-red-400 text-xl">✗</span>
                <span className="text-slate-500">No competitions</span>
              </div>
            </div>

            {currentTier === 'free' && (
              <div className="text-center text-slate-400 text-sm">
                Upgrade to compete!
              </div>
            )}
          </div>

          {/* PREMIUM TIER */}
          <div className={`bg-gradient-to-br from-purple-600 to-pink-600 rounded-2xl p-8 border-2 border-purple-400 relative transform md:scale-105 shadow-2xl`}>
            <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-yellow-400 text-slate-900 px-4 py-1 rounded-full text-sm font-bold">
              MOST POPULAR
            </div>

            {currentTier === 'premium' && (
              <div className="absolute top-4 right-4 bg-white text-purple-600 px-3 py-1 rounded-full text-sm font-semibold">
                Current Plan
              </div>
            )}

            <div className="text-center mb-6">
              <div className="text-4xl mb-3">🏆</div>
              <h3 className="text-2xl font-bold text-white mb-2">Premium</h3>
              <div className="text-4xl font-bold text-white mb-1">$9.99</div>
              <div className="text-purple-100">per month</div>
            </div>

            <div className="space-y-3 mb-8">
              <div className="flex items-start gap-3">
                <span className="text-yellow-300 text-xl">★</span>
                <span className="text-white font-semibold">500 SMS Bucks/month</span>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-yellow-300 text-xl">★</span>
                <span className="text-white">Daily login bonus (+5)</span>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-yellow-300 text-xl">★</span>
                <span className="text-white">Enter weekly competitions</span>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-yellow-300 text-xl">★</span>
                <span className="text-white">Compete for $50 weekly prize</span>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-yellow-300 text-xl">★</span>
                <span className="text-white">Win rewards (+25 per win)</span>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-yellow-300 text-xl">★</span>
                <span className="text-white">Track your stats</span>
              </div>
            </div>

            {currentTier !== 'premium' && (
              <div className="space-y-3">
                {/* Regular upgrade button (for future payment integration) */}
                <button
                  onClick={() => handleUpgrade('premium')}
                  className="w-full bg-white text-purple-600 py-3 rounded-xl font-bold text-lg hover:bg-purple-50 transition-all shadow-lg hover:shadow-xl"
                >
                  Upgrade to Premium
                </button>

                {/* Test mode upgrade button */}
                {testModeEnabled && (
                  <button
                    onClick={() => handleTestUpgrade('premium')}
                    disabled={upgradingTest}
                    className="w-full bg-yellow-400 text-slate-900 py-3 rounded-xl font-bold text-lg hover:bg-yellow-300 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed border-2 border-yellow-600"
                  >
                    {upgradingTest ? '⏳ Processing...' : '🧪 TEST UPGRADE (No Payment)'}
                  </button>
                )}
              </div>
            )}
            {currentTier === 'premium' && (
              <div className="text-center text-purple-100 font-semibold">
                You're on this plan! 🎉
              </div>
            )}
          </div>

          {/* VIP TIER */}
          <div className={`bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl p-8 border-2 border-amber-400 relative shadow-xl`}>
            {currentTier === 'vip' && (
              <div className="absolute top-4 right-4 bg-white text-amber-600 px-3 py-1 rounded-full text-sm font-semibold">
                Current Plan
              </div>
            )}

            <div className="text-center mb-6">
              <div className="text-4xl mb-3">👑</div>
              <h3 className="text-2xl font-bold text-white mb-2">VIP</h3>
              <div className="text-4xl font-bold text-white mb-1">$19.99</div>
              <div className="text-amber-100">per month</div>
            </div>

            <div className="space-y-3 mb-8">
              <div className="flex items-start gap-3">
                <span className="text-yellow-200 text-xl">★</span>
                <span className="text-white font-semibold">1,000 SMS Bucks/month</span>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-yellow-200 text-xl">★</span>
                <span className="text-white">Daily login bonus (+10)</span>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-yellow-200 text-xl">★</span>
                <span className="text-white">UNLIMITED competition entries per week</span>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-yellow-200 text-xl">★</span>
                <span className="text-white">Bigger win rewards (+50)</span>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-yellow-200 text-xl">★</span>
                <span className="text-white">Priority support</span>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-yellow-200 text-xl">★</span>
                <span className="text-white">Exclusive VIP badge</span>
              </div>
            </div>

            {currentTier !== 'vip' && (
              <div className="space-y-3">
                {/* Regular upgrade button (for future payment integration) */}
                <button
                  onClick={() => handleUpgrade('vip')}
                  className="w-full bg-white text-amber-600 py-3 rounded-xl font-bold text-lg hover:bg-amber-50 transition-all shadow-lg hover:shadow-xl"
                >
                  Upgrade to VIP
                </button>

                {/* Test mode upgrade button */}
                {testModeEnabled && (
                  <button
                    onClick={() => handleTestUpgrade('vip')}
                    disabled={upgradingTest}
                    className="w-full bg-yellow-400 text-slate-900 py-3 rounded-xl font-bold text-lg hover:bg-yellow-300 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed border-2 border-yellow-600"
                  >
                    {upgradingTest ? '⏳ Processing...' : '🧪 TEST UPGRADE (No Payment)'}
                  </button>
                )}
              </div>
            )}
            {currentTier === 'vip' && (
              <div className="text-center text-amber-100 font-semibold">
                You're VIP! 👑
              </div>
            )}
          </div>

        </div>

        {/* FAQ Section */}
        <div className="bg-slate-800 rounded-2xl p-8 mb-8">
          <h2 className="text-3xl font-bold text-white mb-6 text-center">
            Frequently Asked Questions
          </h2>

          <div className="space-y-6 max-w-3xl mx-auto">
            <div>
              <h3 className="text-xl font-semibold text-emerald-400 mb-2">
                How do parlay costs work?
              </h3>
              <p className="text-slate-300 leading-relaxed mb-3">
                <strong className="text-emerald-400">Competition Parlays:</strong> Flat rate of 100 SMS Bucks per parlay
                (regardless of how many legs). These enter the weekly competition for cash prizes.
              </p>
              <p className="text-slate-300 leading-relaxed">
                <strong className="text-emerald-400">Practice Parlays:</strong> Completely FREE and unlimited! Perfect for
                testing strategies. Premium/VIP users can upgrade any practice parlay to a competition entry for 100 SMS
                Bucks (before it locks). Free tier users always get practice parlays only.
              </p>
            </div>

            <div>
              <h3 className="text-xl font-semibold text-emerald-400 mb-2">
                What's the difference between Practice and Competition mode?
              </h3>
              <p className="text-slate-300 leading-relaxed mb-3">
                <strong className="text-emerald-400">Practice Mode:</strong> Create FREE unlimited parlays to test your
                strategies. Track results and learn without spending SMS Bucks. Available to all membership tiers.
              </p>
              <p className="text-slate-300 leading-relaxed">
                <strong className="text-emerald-400">Competition Mode:</strong> Premium/VIP members can enter the weekly
                competition by opting in. Competition parlays cost 100 SMS Bucks each and compete for $50+ weekly cash prizes.
                Competition runs Tuesday 2 AM ET through Sunday 3:50 PM ET.
              </p>
            </div>

            <div>
              <h3 className="text-xl font-semibold text-emerald-400 mb-2">
                Can I earn more SMS Bucks?
              </h3>
              <p className="text-slate-300">
                Yes! Get +5 daily login bonus, win parlays for rewards (+25 Premium, +50 VIP),
                and earn bonuses for sharing your wins on social media.
              </p>
            </div>

            <div>
              <h3 className="text-xl font-semibold text-emerald-400 mb-2">
                What happens to unused SMS Bucks?
              </h3>
              <p className="text-slate-300">
                They roll over! Your SMS Bucks never expire as long as you maintain your subscription.
              </p>
            </div>

            <div>
              <h3 className="text-xl font-semibold text-emerald-400 mb-2">
                Can I cancel anytime?
              </h3>
              <p className="text-slate-300">
                Yes! Cancel anytime. You'll keep your SMS Bucks until the end of your billing period.
              </p>
            </div>
          </div>
        </div>

        {/* Back Button */}
        <div className="text-center">
          <button
            onClick={() => router.push('/')}
            className="text-slate-400 hover:text-white transition-colors"
          >
            ← Back to Dashboard
          </button>
        </div>

      </div>
    </div>
  );
}
