'use client';
import { useRouter } from 'next/navigation';

export default function CompetitionStatusBanner({ status }) {
  const router = useRouter();

  if (!status) return null;

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
        };

      case 'not_qualified':
        return {
          bgColor: 'bg-gradient-to-r from-yellow-900/40 to-orange-900/40',
          borderColor: 'border-yellow-600/50',
          icon: '⚠️',
          title: 'Competition Entry',
          count: `${parlayCount}/3 Parlays`,
          message: `Create ${3 - parlayCount} more to qualify for $${prizeAmount}!`,
          showButton: false,
        };

      default:
        return {
          bgColor: 'bg-gradient-to-r from-blue-900/40 to-indigo-900/40',
          borderColor: 'border-blue-600/50',
          icon: '🎯',
          title: 'Build for Fun',
          count: `${parlayCount} Parlays`,
          message: 'Upgrade to Premium for competitions!',
          showButton: false,
        };
    }
  };

  const config = getStatusConfig();

  return (
    <div className={`${config.bgColor} border-2 ${config.borderColor} rounded-xl shadow-lg p-5`}>
      <div className="flex items-center justify-between w-full">

        {/* LEFT SECTION */}
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

        {/* RIGHT SECTION */}
        {config.showButton && (
          <div className="flex items-center gap-4 flex-shrink-0">
            <button
              onClick={() => router.push('/leaderboard?tab=weekly')}
              className="bg-white/10 hover:bg-white/20 border border-white/20 text-white px-5 py-2.5 rounded-lg text-sm font-semibold whitespace-nowrap transition-all"
            >
              View Leaderboard →
            </button>
          </div>
        )}
      </div>

      {/* PROGRESS BAR */}
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