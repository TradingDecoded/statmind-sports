'use client';

export default function RefreshStatus({ 
  isRefreshing, 
  isPaused, 
  lastUpdated, 
  secondsSinceUpdate,
  isGameWindow,
  onTogglePause,
  onManualRefresh 
}) {
  
  const formatTimeSince = (seconds) => {
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    return `${minutes}m ago`;
  };

  if (!isGameWindow) {
    return (
      <div className="flex items-center gap-3 text-sm text-slate-500">
        <span>⏸️ Auto-refresh paused (outside game window)</span>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-3 text-sm">
      {/* Last Updated */}
      {lastUpdated && !isRefreshing && (
        <span className="text-slate-400">
          Last updated: {formatTimeSince(secondsSinceUpdate)}
        </span>
      )}

      {/* Refreshing Indicator */}
      {isRefreshing && (
        <span className="flex items-center gap-2 text-blue-400">
          <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Updating...
        </span>
      )}

      {/* Manual Refresh Button */}
      <button
        onClick={onManualRefresh}
        disabled={isRefreshing}
        className="px-3 py-1 bg-slate-700 hover:bg-slate-600 disabled:bg-slate-800 disabled:cursor-not-allowed text-white rounded transition text-xs font-medium"
        title="Refresh now"
      >
        🔄 Refresh
      </button>

      {/* Pause/Resume Button */}
      <button
        onClick={onTogglePause}
        className={`px-3 py-1 rounded transition text-xs font-medium ${
          isPaused 
            ? 'bg-emerald-600 hover:bg-emerald-500 text-white' 
            : 'bg-amber-600 hover:bg-amber-500 text-white'
        }`}
        title={isPaused ? 'Resume auto-refresh' : 'Pause auto-refresh'}
      >
        {isPaused ? '▶️ Resume' : '⏸️ Pause'}
      </button>

      {/* Status Indicator */}
      {!isPaused && !isRefreshing && (
        <span className="flex items-center gap-1.5 text-emerald-400 text-xs">
          <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
          Auto-updating
        </span>
      )}
    </div>
  );
}
