// frontend/src/components/ResultCard.js
'use client';

import { useState } from 'react';
import { getTeamLogo, getTeamName } from '@/utils/teamLogos';
import ConfidenceBadge from './ConfidenceBadge';
import GameDetailModal from './GameDetailModal';

export default function ResultCard({ result }) {
  const [showModal, setShowModal] = useState(false);
  
  const {
    homeTeamKey,
    awayTeamKey,
    predictedWinner,
    actualWinner,
    confidence,
    homeWinProbability,
    awayWinProbability,
    homeScore,
    awayScore,
    date
  } = result;
  
  const gameDate = new Date(date);
  const wasCorrect = predictedWinner === actualWinner;
  const isHomeWinner = actualWinner === homeTeamKey;
  
  // Convert probabilities
  let homeProb = parseFloat(homeWinProbability) || 0;
  let awayProb = parseFloat(awayWinProbability) || 0;
  if (homeProb < 1) homeProb = homeProb * 100;
  if (awayProb < 1) awayProb = awayProb * 100;
  
  return (
    <>
      <div 
        className={`bg-slate-800 rounded-xl border-2 overflow-hidden transition-all duration-300 hover:shadow-lg cursor-pointer ${
          wasCorrect 
            ? 'border-emerald-500/50 hover:border-emerald-500' 
            : 'border-red-500/50 hover:border-red-500'
        }`}
        onClick={() => setShowModal(true)}
      >
        {/* Header with Result Badge */}
        <div className={`px-4 py-2 border-b flex items-center justify-between ${
          wasCorrect 
            ? 'bg-emerald-500/10 border-emerald-500/30' 
            : 'bg-red-500/10 border-red-500/30'
        }`}>
          <p className="text-slate-400 text-sm">
            {gameDate.toLocaleDateString('en-US', { 
              weekday: 'short', 
              month: 'short', 
              day: 'numeric',
              year: 'numeric'
            })}
          </p>
          <div className={`px-3 py-1 rounded-full text-xs font-bold ${
            wasCorrect 
              ? 'bg-emerald-500/20 text-emerald-400' 
              : 'bg-red-500/20 text-red-400'
          }`}>
            {wasCorrect ? '✓ CORRECT' : '✗ INCORRECT'}
          </div>
        </div>
        
        {/* Teams with Scores */}
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            {/* Away Team */}
            <div className="flex items-center space-x-3">
              <img 
                src={getTeamLogo(awayTeamKey)} 
                alt={getTeamName(awayTeamKey)}
                className="w-12 h-12 object-contain"
              />
              <div>
                <p className="text-white font-semibold">{awayTeamKey}</p>
                <p className="text-2xl font-bold text-white">{awayScore}</p>
                {!isHomeWinner && actualWinner === awayTeamKey && <span className="text-emerald-400 text-xs">WINNER</span>}
              </div>
            </div>
            
            {/* VS */}
            <div className="text-slate-500 font-bold">@</div>
            
            {/* Home Team */}
            <div className="flex items-center space-x-3">
              <div className="text-right">
                <p className="text-white font-semibold">{homeTeamKey}</p>
                <p className="text-2xl font-bold text-white">{homeScore}</p>
                {isHomeWinner && actualWinner === homeTeamKey && <span className="text-emerald-400 text-xs">WINNER</span>}
              </div>
              <img 
                src={getTeamLogo(homeTeamKey)} 
                alt={getTeamName(homeTeamKey)}
                className="w-12 h-12 object-contain"
              />
            </div>
          </div>
          
          {/* Prediction Details */}
          <div className="space-y-3 pt-4 border-t border-slate-700">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-400">Our Prediction:</span>
              <span className={`font-bold ${wasCorrect ? 'text-emerald-400' : 'text-red-400'}`}>
                {predictedWinner} ({homeProb.toFixed(1)}% / {awayProb.toFixed(1)}%)
              </span>
            </div>
            
            <div className="flex items-center justify-center">
              <ConfidenceBadge confidence={confidence} />
            </div>
          </div>
          
          {/* Click Hint */}
          <div className="text-center pt-4 border-t border-slate-700 mt-4">
            <p className="text-slate-400 text-sm flex items-center justify-center">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              Click for full analysis
            </p>
          </div>
        </div>
      </div>

      {/* Modal */}
      <GameDetailModal 
        prediction={result}
        isOpen={showModal}
        onClose={() => setShowModal(false)}
      />
    </>
  );
}