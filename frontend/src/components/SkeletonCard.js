// frontend/src/components/SkeletonCard.js
export function SkeletonCard() {
  return (
    <div className="bg-slate-800 rounded-xl p-6 animate-pulse">
      <div className="h-6 bg-slate-700 rounded w-3/4 mb-4"></div>
      <div className="h-4 bg-slate-700 rounded w-1/2 mb-6"></div>
      <div className="flex justify-between items-center mb-6">
        <div className="h-16 bg-slate-700 rounded w-1/3"></div>
        <div className="h-8 bg-slate-700 rounded-full w-16"></div>
        <div className="h-16 bg-slate-700 rounded w-1/3"></div>
      </div>
      <div className="h-4 bg-slate-700 rounded w-full mb-2"></div>
      <div className="h-4 bg-slate-700 rounded w-5/6"></div>
    </div>
  );
}