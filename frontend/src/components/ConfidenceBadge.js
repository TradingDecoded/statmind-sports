// frontend/src/components/ConfidenceBadge.js

export default function ConfidenceBadge({ confidence }) {
  const getConfidenceColor = (conf) => {
    const upper = conf?.toUpperCase() || 'MEDIUM';
    switch (upper) {
      case 'HIGH':
        return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50';
      case 'MEDIUM':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50';
      case 'LOW':
        return 'bg-slate-500/20 text-slate-400 border-slate-500/50';
      default:
        return 'bg-slate-500/20 text-slate-400 border-slate-500/50';
    }
  };
  
  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${getConfidenceColor(confidence)}`}>
      <span className="w-2 h-2 rounded-full mr-2 animate-pulse" style={{
        backgroundColor: confidence?.toUpperCase() === 'HIGH' ? '#10b981' :
                        confidence?.toUpperCase() === 'MEDIUM' ? '#eab308' : '#94a3b8'
      }}></span>
      {confidence?.toUpperCase() || 'MEDIUM'} CONFIDENCE
    </span>
  );
}