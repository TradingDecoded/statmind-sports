// frontend/src/components/PredictionCard.js

import { getTeamLogo, getTeamName } from '@/utils/teamLogos';
import ConfidenceBadge from './ConfidenceBadge';

export default function PredictionCard({ prediction }) {
  const {
    homeTeamKey,
    awayTeamKey,
    predictedWinner,
    confidence,
    homeWinProbability,
    awayWinProbability,
    date,
    reasoning
  } = prediction;
  
  const gameDate = new Date(date);
  const isHomeWinner = predictedWinner === homeTeamKey;
  
  return (
    <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden hover:border-emerald-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-emerald-500/10">
      {/* Date Header */}
      <div className="bg-slate-900/50 px-4 py-2 border-b border-slate-700">
        <p className="text-slate-400 text-sm">
          {gameDate.toLocaleDateString('en-US', { 
            weekday: 'short', 
            month: 'short', 
            day: 'numeric',
            hour: 'numeric',
            minute: '2-digit'
          })}
        </p>
      </div>
      
      {/* Teams */}
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          {/* Away Team */}
          <div className={`flex items-center space-x-3 ${!isHomeWinner ? 'opacity-50' : ''}`}>
            <img 
              src={getTeamLogo(awayTeamKey)} 
              alt={getTeamName(awayTeamKey)}
              className="w-12 h-12 object-contain"
            />
            <div>
              <p className="text-white font-semibold">{awayTeamKey}</p>
              <p className="text-slate-400 text-sm">{awayWinProbability}%</p>
            </div>
          </div>
          
          {/* VS */}
          <div className="text-slate-500 font-bold text-sm">@</div>
          
          {/* Home Team */}
          <div className={`flex items-center space-x-3 ${isHomeWinner ? 'opacity-50' : ''}`}>
            <div className="text-right">
              <p className="text-white font-semibold">{homeTeamKey}</p>
              <p className="text-slate-400 text-sm">{homeWinProbability}%</p>
            </div>
            <img 
              src={getTeamLogo(homeTeamKey)} 
              alt={getTeamName(homeTeamKey)}
              className="w-12 h-12 object-contain"
            />
          </div>
        </div>
        
        {/* Winner Indicator */}
        <div className="flex items-center justify-center mb-4">
          <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-full px-4 py-2">
            <p className="text-emerald-400 font-semibold text-sm">
              Predicted Winner: {predictedWinner}
            </p>
          </div>
        </div>
        
        {/* Confidence */}
        <div className="flex justify-center mb-4">
          <ConfidenceBadge confidence={confidence} />
        </div>
        
        {/* Reasoning */}
        {reasoning && (
          <div className="mt-4 pt-4 border-t border-slate-700">
            <p className="text-slate-400 text-sm italic line-clamp-2">
              {reasoning}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}