'use client';
import { useRouter } from 'next/navigation';

export default function CompetitionStatusBanner({ status }) {
  const router = useRouter();

  if (!status) return null;

  const getStatusConfig = () => {
    const { statusType, parlayCount, maxParlays, parlaysRemaining, minToQualify, competition } = status;
    const prizeAmount = competition?.prizeAmount || 50;

    switch (statusType) {
      case 'not_qualified':
        return {
          bgColor: 'bg-gradient-to-r from-yellow-900/40 to-orange-900/40',
          borderColor: 'border-yellow-600/50',
          icon: '⚠️',
          title: 'Competition Entry',
          subtitle: `${parlayCount}/${minToQualify} Parlays`,
          message: `Create ${minToQualify - parlayCount} more parlay${minToQualify - parlayCount > 1 ? 's' : ''} to enter the weekly competition!`,
          prizeText: `$${prizeAmount} prize`,
          showButton: false,
          buttonText: '',
          buttonAction: null
        };

      case 'qualified':
        return {
          bgColor: 'bg-gradient-to-r from-green-900/40 to-emerald-900/40',
          borderColor: 'border-green-600/50',
          icon: '✅',
          title: "You're Entered!",
          subtitle: `${parlayCount}/${maxParlays} Parlays this week`,
          message: `Competing for $${prizeAmount} prize • ${parlaysRemaining} more slot${parlaysRemaining !== 1 ? 's' : ''} available`,
          prizeText: null,
          showButton: true,
          buttonText: 'View Leaderboard →',
          buttonAction: () => router.push('/leaderboard?tab=weekly')
        };

      case 'max_reached':
        return {
          bgColor: 'bg-gradient-to-r from-red-900/40 to-rose-900/40',
          borderColor: 'border-red-600/50',
          icon: '🔥',
          title: 'Weekly Max Reached!',
          subtitle: `${parlayCount}/${maxParlays} Parlays`,
          message: `You're competing for $${prizeAmount} • Good luck!`,
          prizeText: null,
          showButton: true,
          buttonText: 'View Leaderboard →',
          buttonAction: () => router.push('/leaderboard?tab=weekly')
        };

      case 'free_user':
        return {
          bgColor: 'bg-gradient-to-r from-blue-900/40 to-indigo-900/40',
          borderColor: 'border-blue-600/50',
          icon: '🎯',
          title: 'Build Parlays for Fun (Free Tier)',
          subtitle: `${parlayCount} Parlays created`,
          message: 'Upgrade to Premium to enter weekly competitions for cash prizes!',
          prizeText: null,
          showButton: true,
          buttonText: 'Learn More →',
          buttonAction: () => router.push('/pricing')
        };

      default:
        return null;
    }
  };

  const config = getStatusConfig();
  if (!config) return null;

  return (
    <div className={`${config.bgColor} border-2 ${config.borderColor} rounded-xl p-6 mb-6 shadow-lg`}>
      <div className="flex items-center justify-between flex-wrap gap-4">
        
        {/* Left Side: Status Info */}
        <div className="flex items-center gap-4">
          <div className="text-4xl">{config.icon}</div>
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h3 className="text-xl font-bold text-white">{config.title}</h3>
              <span className="text-sm font-semibold text-slate-300 bg-slate-800/50 px-3 py-1 rounded-full">
                {config.subtitle}
              </span>
            </div>
            <p className="text-slate-300 text-sm">
              {config.message}
              {config.prizeText && (
                <span className="ml-2 text-yellow-400 font-semibold">
                  ({config.prizeText})
                </span>
              )}
            </p>
          </div>
        </div>

        {/* Right Side: Action Button */}
        {config.showButton && (
          <button
            onClick={config.buttonAction}
            className="bg-white/10 hover:bg-white/20 border border-white/20 text-white px-6 py-3 rounded-lg font-semibold transition-all hover:scale-105"
          >
            {config.buttonText}
          </button>
        )}
      </div>

      {/* Progress Bar (for not qualified and qualified states) */}
      {(status.statusType === 'not_qualified' || status.statusType === 'qualified') && (
        <div className="mt-4">
          <div className="w-full bg-slate-800/50 rounded-full h-3 overflow-hidden">
            <div
              className={`h-full transition-all duration-500 ${
                status.statusType === 'qualified' ? 'bg-green-500' : 'bg-yellow-500'
              }`}
              style={{ width: `${(status.parlayCount / status.maxParlays) * 100}%` }}
            />
          </div>
          <div className="flex justify-between mt-2 text-xs text-slate-400">
            <span>Min: {status.minToQualify} parlays</span>
            <span>Max: {status.maxParlays} parlays</span>
          </div>
        </div>
      )}
    </div>
  );
}
