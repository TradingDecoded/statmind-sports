// frontend/src/components/StatsCard.js

export default function StatsCard({ title, value, subtitle, icon, trend }) {
  return (
    <div className="bg-slate-800 rounded-xl border border-slate-700 p-6 hover:border-emerald-500/50 transition-all duration-300">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-slate-400 text-sm mb-1">{title}</p>
          <p className="text-white text-3xl font-bold mb-1">{value}</p>
          {subtitle && (
            <p className="text-slate-500 text-sm">{subtitle}</p>
          )}
        </div>
        {icon && (
          <div className="w-12 h-12 bg-emerald-500/10 rounded-lg flex items-center justify-center">
            {icon}
          </div>
        )}
      </div>
      {trend && (
        <div className="mt-4 pt-4 border-t border-slate-700">
          <p className={`text-sm font-medium ${trend > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
            {trend > 0 ? '↑' : '↓'} {Math.abs(trend)}% from last week
          </p>
        </div>
      )}
    </div>
  );
}