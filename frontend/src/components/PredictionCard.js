// frontend/src/components/PredictionCard.js
'use client';

import { useState } from 'react';
import { getTeamLogo, getTeamName } from '@/utils/teamLogos';
import { formatGameDateTime } from '@/utils/dateTimeUtils';
import ConfidenceBadge from './ConfidenceBadge';
import GameDetailModal from './GameDetailModal';
import LiveBadge from './LiveBadge';

export default function PredictionCard({ prediction }) {
  const [showModal, setShowModal] = useState(false);

  const {
    homeTeamKey,
    awayTeamKey,
    predictedWinner,
    confidence,
    homeWinProbability,
    awayWinProbability,
    homeScore,
    awayScore,
    isFinal,
    actualWinner,
    isCorrect,
    date,
    injuredPlayer,
    injuredPosition,
    injuredTeam,
    injuryDescription
  } = prediction;

  // Check if this game has injury impact
  const hasInjuryImpact = injuredPlayer && injuredTeam;

  const gameDate = new Date(date);
  const isHomeWinner = predictedWinner === homeTeamKey;

  // Determine if game is finished
  const gameFinished = isFinal && homeScore !== null && awayScore !== null;
  const actualHomeWinner = homeScore > awayScore;

  // Convert probabilities
  let homeProb = parseFloat(homeWinProbability) || 0;
  let awayProb = parseFloat(awayWinProbability) || 0;
  if (homeProb < 1) homeProb = homeProb * 100;
  if (awayProb < 1) awayProb = awayProb * 100;

  // Get the predicted team's probability
  const predictedProb = predictedWinner === homeTeamKey ? homeProb : awayProb;

  // FINISHED GAME - Use ResultCard layout
  if (gameFinished) {
    const wasCorrect = isCorrect;
    const isHomeActualWinner = actualWinner === homeTeamKey;

    return (
      <>
        <div
          className={`bg-slate-800 rounded-xl border-2 overflow-hidden transition-all duration-300 hover:shadow-lg cursor-pointer ${wasCorrect
            ? 'border-emerald-500/50 hover:border-emerald-500'
            : 'border-red-500/50 hover:border-red-500'
            }`}
          onClick={() => setShowModal(true)}
        >
          {/* Header with Result Badge - ADDED TIME HERE */}
          <div className={`px-4 py-2 border-b flex items-center justify-between ${wasCorrect
            ? 'bg-emerald-500/10 border-emerald-500/30'
            : 'bg-red-500/10 border-red-500/30'
            }`}>
            <div className="flex items-center gap-2">
              <p className="text-slate-400 text-sm">
                {formatGameDateTime(date, true)}
              </p>
              {hasInjuryImpact && (
                <div
                  className="group relative flex items-center"
                  title={`Updated for ${injuredPlayer} (${injuredPosition}) injury`}
                >
                  <span className="text-red-400 text-lg">🏥</span>
                  <div className="hidden group-hover:block absolute left-0 top-6 z-50 bg-slate-900 border border-slate-700 rounded-lg p-3 shadow-xl w-64">
                    <p className="text-yellow-400 font-semibold text-xs mb-1">⚠️ INJURY IMPACT</p>
                    <p className="text-white text-sm mb-1">
                      <span className="font-bold">{injuredPlayer}</span> ({injuredPosition})
                    </p>
                    <p className="text-slate-400 text-xs mb-1">{injuredTeam} • {injuryDescription}</p>
                    <p className="text-emerald-400 text-xs mt-2 border-t border-slate-700 pt-2">
                      ✓ Prediction updated
                    </p>
                  </div>
                </div>
              )}
            </div>
            {isFinal ? (
              <div className={`px-3 py-1 rounded-full text-xs font-bold ${wasCorrect
                ? 'bg-emerald-500/20 text-emerald-400'
                : 'bg-red-500/20 text-red-400'
                }`}>
                {wasCorrect ? '✓ CORRECT' : '✗ INCORRECT'}
              </div>
            ) : (
              <LiveBadge isLive={true} />
            )}
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
                  {!isHomeActualWinner && <span className="text-emerald-400 text-xs">WINNER</span>}
                </div>
              </div>

              {/* VS */}
              <div className="text-slate-500 font-bold">@</div>

              {/* Home Team */}
              <div className="flex items-center space-x-3">
                <div className="text-right">
                  <p className="text-white font-semibold">{homeTeamKey}</p>
                  <p className="text-2xl font-bold text-white">{homeScore}</p>
                  {isHomeActualWinner && <span className="text-emerald-400 text-xs">WINNER</span>}
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
                  {predictedWinner} ({predictedProb.toFixed(1)}%)
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
          prediction={prediction}
          isOpen={showModal}
          onClose={() => setShowModal(false)}
        />
      </>
    );
  }

  // UPCOMING GAME - Original prediction layout
  return (
    <>
      <div
        className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden hover:border-emerald-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-emerald-500/10 cursor-pointer"
        onClick={() => setShowModal(true)}
      >
        {/* Date Header with Status */}
        <div className="bg-slate-900/50 px-4 py-2 border-b border-slate-700 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <p className="text-slate-400 text-sm">
              {formatGameDateTime(date, true)}
            </p>
            {hasInjuryImpact && (
              <div
                className="group relative flex items-center"
                title={`Updated for ${injuredPlayer} (${injuredPosition}) injury`}
              >
                <span className="text-red-400 text-lg">🏥</span>
                <div className="hidden group-hover:block absolute left-0 top-6 z-50 bg-slate-900 border border-slate-700 rounded-lg p-3 shadow-xl w-64">
                  <p className="text-yellow-400 font-semibold text-xs mb-1">⚠️ INJURY IMPACT</p>
                  <p className="text-white text-sm mb-1">
                    <span className="font-bold">{injuredPlayer}</span> ({injuredPosition})
                  </p>
                  <p className="text-slate-400 text-xs mb-1">{injuredTeam} • {injuryDescription}</p>
                  <p className="text-emerald-400 text-xs mt-2 border-t border-slate-700 pt-2">
                    ✓ Prediction updated
                  </p>
                </div>
              </div>
            )}
          </div>
          {/* Status Badge */}
          {homeScore !== null && !isFinal ? (
            <LiveBadge isLive={true} />
          ) : homeScore === null ? (
            <span className="text-slate-500 text-xs px-2 py-1 bg-slate-800 rounded">UPCOMING</span>
          ) : null}
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
              />
            </div>
          </div>

          {/* Probability Bar - ORIGINAL COLORS PRESERVED */}
          <div className="mb-4">
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

          {/* Click Hint */}
          <div className="text-center pt-4 border-t border-slate-700">
            <p className="text-slate-400 text-sm flex items-center justify-center">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              Click for full breakdown
            </p>
          </div>
        </div>
      </div>

      {/* Modal */}
      <GameDetailModal
        prediction={prediction}
        isOpen={showModal}
        onClose={() => setShowModal(false)}
      />
    </>
  );
}