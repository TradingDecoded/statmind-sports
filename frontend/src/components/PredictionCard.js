// frontend/src/components/PredictionCard.js
'use client';

import { useState } from 'react';
import { getTeamLogo, getTeamName } from '@/utils/teamLogos';
import ConfidenceBadge from './ConfidenceBadge';

export default function PredictionCard({ prediction }) {
  const [isExpanded, setIsExpanded] = useState(false);
  
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
  
  // Parse probabilities to ensure they're numbers
  const homeProb = parseFloat(homeWinProbability) || 0;
  const awayProb = parseFloat(awayWinProbability) || 0;
  
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
          <div className={`flex items-center space-x-3 transition-opacity ${!isHomeWinner ? '' : 'opacity-50'}`}>
            <img 
              src={getTeamLogo(awayTeamKey)} 
              alt={getTeamName(awayTeamKey)}
              className="w-12 h-12 object-contain"
              onError={(e) => {
                e.target.src = '/images/nfl-logo.png'; // Fallback logo
              }}
            />
            <div>
              <p className="text-white font-semibold">{awayTeamKey}</p>
              <p className="text-slate-400 text-sm">{awayProb.toFixed(1)}%</p>
            </div>
          </div>
          
          {/* VS */}
          <div className="text-slate-500 font-bold text-sm">@</div>
          
          {/* Home Team */}
          <div className={`flex items-center space-x-3 transition-opacity ${isHomeWinner ? '' : 'opacity-50'}`}>
            <div className="text-right">
              <p className="text-white font-semibold">{homeTeamKey}</p>
              <p className="text-slate-400 text-sm">{homeProb.toFixed(1)}%</p>
            </div>
            <img 
              src={getTeamLogo(homeTeamKey)} 
              alt={getTeamName(homeTeamKey)}
              className="w-12 h-12 object-contain"
              onError={(e) => {
                e.target.src = '/images/nfl-logo.png'; // Fallback logo
              }}
            />
          </div>
        </div>
        
        {/* Probability Bar */}
        <div className="mb-4">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>{awayTeamKey} Win Probability</span>
            <span>{homeTeamKey} Win Probability</span>
          </div>
          <div className="w-full bg-slate-700 rounded-full h-2 overflow-hidden flex">
            <div 
              className="bg-gradient-to-r from-blue-500 to-blue-400 transition-all duration-1000"
              style={{ width: `${awayProb}%` }}
            ></div>
            <div 
              className="bg-gradient-to-r from-emerald-400 to-emerald-500 transition-all duration-1000"
              style={{ width: `${homeProb}%` }}
            ></div>
          </div>
        </div>
        
        {/* Winner Indicator */}
        <div className="flex items-center justify-center mb-4">
          <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-full px-4 py-2">
            <p className="text-emerald-400 font-semibold text-sm">
              Predicted Winner: <span className="font-bold">{predictedWinner}</span>
            </p>
          </div>
        </div>
        
        {/* Confidence */}
        <div className="flex justify-center mb-4">
          <ConfidenceBadge confidence={confidence} />
        </div>
        
        {/* Reasoning - Expandable */}
        {reasoning && (
          <div className="mt-4 pt-4 border-t border-slate-700">
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="w-full flex items-center justify-between text-left hover:bg-slate-700/30 p-2 rounded-lg transition-colors"
            >
              <span className="text-slate-300 text-sm font-semibold flex items-center">
                <svg className="w-4 h-4 mr-2 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Analysis & Reasoning
              </span>
              <svg 
                className={`w-5 h-5 text-slate-400 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            
            {isExpanded && (
              <div className="mt-3 p-3 bg-slate-900/50 rounded-lg border border-slate-700/50">
                <p className="text-slate-300 text-sm leading-relaxed whitespace-pre-line">
                  {reasoning}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}