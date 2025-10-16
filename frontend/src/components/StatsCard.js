// frontend/src/components/StatsCard.js
export default function StatsCard({ title, value, subtitle, icon, trend, highlight }) {
  return (
    <div className={`rounded-xl border p-6 hover:border-emerald-500/50 transition-all duration-300 text-center ${
      highlight 
        ? 'bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border-emerald-500/30' 
        : 'bg-slate-800 border-slate-700'
    }`}>
      {icon && (
        <div className="w-12 h-12 bg-emerald-500/10 rounded-lg flex items-center justify-center mx-auto mb-4">
          {icon}
        </div>
      )}
      <p className="text-slate-400 text-sm font-semibold mb-2 uppercase tracking-wide">{title}</p>
      <p className="text-white text-4xl md:text-5xl font-bold mb-2">{value}</p>
      {subtitle && (
        <p className="text-slate-500 text-sm">{subtitle}</p>
      )}
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
