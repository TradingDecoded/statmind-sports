'use client';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';

export default function CompetitionStatusBanner({ status }) {
  const router = useRouter();
  const [isExpanded, setIsExpanded] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState('');

  // Load saved preference
  useEffect(() => {
    const saved = localStorage.getItem('competition_banner_expanded');
    if (saved === 'true') {
      setIsExpanded(true);
    }
  }, []);

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

  const toggleExpanded = () => {
    const newState = !isExpanded;
    setIsExpanded(newState);
    localStorage.setItem('competition_banner_expanded', newState.toString());
  };

  const getStatusConfig = () => {
    const { statusType, parlayCount, maxParlays, competition } = status;
    const prizeAmount = competition?.prizeAmount || 50;

    switch (statusType) {
      case 'max_reached':
        return {
          bgColor: 'bg-gradient-to-r from-red-900/40 to-rose-900/40',
          borderColor: 'border-red-600/50',
          icon: '🔥',
          title: 'Weekly Max Reached!',
          count: `${parlayCount}/${maxParlays} Parlays`,
          message: `You're competing for $${prizeAmount} • Good luck!`,
          showButton: true,
          buttonText: 'View Leaderboard →',
          buttonAction: () => router.push('/leaderboard?tab=weekly'),
        };

      case 'qualified':
        return {
          bgColor: 'bg-gradient-to-r from-green-900/40 to-emerald-900/40',
          borderColor: 'border-green-600/50',
          icon: '✅',
          title: "You're Entered!",
          count: `${parlayCount}/${maxParlays} Parlays`,
          message: `Competing for $${prizeAmount}`,
          showButton: true,
          buttonText: 'View Leaderboard →',
          buttonAction: () => router.push('/leaderboard?tab=weekly'),
        };

      case 'not_qualified':
        return {
          bgColor: 'bg-gradient-to-r from-blue-900/30 to-indigo-900/30',
          borderColor: 'border-blue-500/40',
          icon: '🎯',
          title: 'Weekly Competition',
          count: `${parlayCount}/${maxParlays} Parlays`,
          message: `Create your first parlay to compete for $${prizeAmount}`,
          showButton: true,
          buttonText: 'View Rules →',
          buttonAction: () => router.push('/competition/rules'),
        };

      default:
        const potentialPoints = parlayCount * 6;

        return {
          bgColor: 'bg-gradient-to-br from-purple-900/50 via-blue-900/50 to-indigo-900/50',
          borderColor: 'border-purple-500/60',
          icon: '🎯',
          title: 'Practice Mode',
          count: `${parlayCount} Free ${parlayCount === 1 ? 'Parlay' : 'Parlays'}`,
          isFreeUser: true,
          prizeAmount,
          potentialPoints,
          showButton: true,
          buttonText: '🏆 Upgrade to Premium',
          buttonAction: () => router.push('/upgrade'),
        };
    }
  };

  const config = getStatusConfig();

  // Free user collapsible banner
  if (config.isFreeUser) {
    return (
      <div className="relative">
        {/* COLLAPSED STATE */}
        {!isExpanded && (
          <div
            onClick={toggleExpanded}
            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 rounded-xl shadow-lg px-6 py-4 cursor-pointer transition-all transform hover:scale-[1.02] border-2 border-purple-400/50"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-2xl">🏆</span>
                <div>
                  <div className="text-white font-bold text-lg">
                    Compete for ${config.prizeAmount} Weekly Prize
                  </div>
                  <div className="text-purple-100 text-sm">
                    {config.potentialPoints} potential points • {timeRemaining} left
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => router.push('/upgrade')}
                  className="bg-white/20 hover:bg-white/30 border border-white/30 text-white px-5 py-2 rounded-lg text-sm font-semibold whitespace-nowrap transition-all"
                >
                  Upgrade Now
                </button>
                <svg
                  className="w-5 h-5 text-white transition-transform"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>
        )}

        {/* EXPANDED STATE */}
        {isExpanded && (
          <div
            className={`${config.bgColor} border-2 ${config.borderColor} rounded-xl shadow-2xl p-6 relative overflow-hidden animate-slide-down`}
          >
            {/* Animated background effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-purple-600/10 via-blue-600/10 to-pink-600/10 animate-gradient-x"></div>

            {/* Collapse button */}
            <button
              onClick={toggleExpanded}
              className="absolute top-4 right-4 text-slate-400 hover:text-white transition z-10 flex items-center gap-2 text-sm"
            >
              <span>Collapse</span>
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
              </svg>
            </button>

            {/* Content */}
            <div className="relative z-10">
              <div className="flex items-start gap-4 mb-4">
                <span className="text-4xl flex-shrink-0">{config.icon}</span>
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="text-2xl font-bold text-white">{config.title}</h3>
                    <span className="bg-white/20 text-white text-xs px-3 py-1 rounded-full font-semibold">
                      {config.count}
                    </span>
                  </div>
                  <p className="text-slate-300 text-sm">Your parlays are for practice only</p>
                </div>
              </div>

              {/* Value Props Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-5">
                <div className="bg-black/30 rounded-lg p-3 border border-purple-500/30">
                  <div className="text-purple-300 text-xs font-semibold mb-1">💰 WEEKLY PRIZE</div>
                  <div className="text-white text-xl font-bold">${config.prizeAmount}</div>
                  <div className="text-slate-400 text-xs">{timeRemaining} remaining</div>
                </div>

                <div className="bg-black/30 rounded-lg p-3 border border-blue-500/30">
                  <div className="text-blue-300 text-xs font-semibold mb-1">🎯 YOUR POTENTIAL</div>
                  <div className="text-white text-xl font-bold">{config.potentialPoints} Points</div>
                  <div className="text-slate-400 text-xs">If this was competitive</div>
                </div>

                <div className="bg-black/30 rounded-lg p-3 border border-pink-500/30">
                  <div className="text-pink-300 text-xs font-semibold mb-1">👥 ACTIVE PLAYERS</div>
                  <div className="text-white text-xl font-bold">
                    {status.competition?.totalParticipants || 0}
                  </div>
                  <div className="text-slate-400 text-xs">Competing this week</div>
                </div>
              </div>

              {/* Key benefits */}
              <div className="bg-black/20 rounded-lg p-4 mb-4">
                <div className="text-emerald-400 text-sm font-semibold mb-2">💡 What You're Missing:</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div className="flex items-center gap-2 text-slate-300 text-sm">
                    <span className="text-red-400">✗</span>
                    <span>Can't win weekly cash prizes</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-300 text-sm">
                    <span className="text-red-400">✗</span>
                    <span>No leaderboard ranking</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-300 text-sm">
                    <span className="text-red-400">✗</span>
                    <span>Missing bragging rights</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-300 text-sm">
                    <span className="text-red-400">✗</span>
                    <span>No competition stats</span>
                  </div>
                </div>
              </div>

              {/* CTA Button */}
              <button
                onClick={config.buttonAction}
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold py-4 px-6 rounded-lg transition-all transform hover:scale-105 shadow-lg hover:shadow-purple-500/50 text-lg"
              >
                {config.buttonText}
              </button>

              <p className="text-center text-slate-400 text-xs mt-3">
                Only $9.99/mo • Cancel anytime • Join today!
              </p>
            </div>

            <style jsx>{`
              @keyframes gradient-x {
                0%, 100% {
                  background-position: 0% 50%;
                }
                50% {
                  background-position: 100% 50%;
                }
              }

              .animate-gradient-x {
                background-size: 200% 200%;
                animation: gradient-x 15s ease infinite;
              }

              @keyframes slide-down {
                from {
                  opacity: 0;
                  transform: translateY(-10px);
                }
                to {
                  opacity: 1;
                  transform: translateY(0);
                }
              }

              .animate-slide-down {
                animation: slide-down 0.3s ease-out;
              }
            `}</style>
          </div>
        )}
      </div>
    );
  }

  // Standard banner for Premium/VIP users (unchanged)
  return (
    <div className={`${config.bgColor} border-2 ${config.borderColor} rounded-xl shadow-lg p-5`}>
      <div className="flex items-center justify-between w-full">
        <div className="flex items-center gap-3 min-w-0">
          <span className="text-3xl translate-y-[1px] flex-shrink-0">{config.icon}</span>
          <div className="min-w-0">
            <h3 className="text-xl font-semibold text-white leading-tight flex items-center gap-4 whitespace-nowrap">
              {config.title}
              <span className="ml-2 bg-black/60 text-white/90 text-xs px-3 py-0.5 rounded-full flex-shrink-0 font-medium">
                {config.count}
              </span>
            </h3>
            <p className="text-sm text-slate-300 mt-0.5">{config.message}</p>
          </div>
        </div>

        {config.showButton && (
          <div className="flex items-center gap-4 flex-shrink-0">
            <button
              onClick={config.buttonAction}
              className="bg-white/10 hover:bg-white/20 border border-white/20 text-white px-5 py-2.5 rounded-lg text-sm font-semibold whitespace-nowrap transition-all"
            >
              {config.buttonText}
            </button>
          </div>
        )}
      </div>

      {(status.statusType === 'not_qualified' || status.statusType === 'qualified') && (
        <div className="mt-4">
          <div className="w-full bg-slate-800/60 rounded-full h-2 overflow-hidden">
            <div
              className={`h-full transition-all duration-500 ${status.statusType === 'qualified' ? 'bg-green-400' : 'bg-yellow-400'
                }`}
              style={{ width: `${(status.parlayCount / status.maxParlays) * 100}%` }}
            />
          </div>
          <div className="flex justify-between mt-1 text-xs text-slate-400">
            <span>Min: {status.minToQualify}</span>
            <span>Max: {status.maxParlays}</span>
          </div>
        </div>
      )}
    </div>
  );
}