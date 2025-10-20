'use client';

export default function LiveBadge({ isLive = false }) {
  if (!isLive) return null;

  return (
    <span className="inline-flex items-center gap-1.5 px-2 py-1 bg-red-500/20 border border-red-500/50 rounded text-red-400 text-xs font-bold animate-pulse">
      <span className="w-2 h-2 bg-red-500 rounded-full"></span>
      LIVE
    </span>
  );
}
