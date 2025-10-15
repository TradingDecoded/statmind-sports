// frontend/src/components/ResultCard.js
'use client';

import { getTeamLogo } from '@/utils/teamLogos';

export default function ResultCard({ result }) {
  const {
    homeTeamKey,
    awayTeamKey,
    homeTeamName,
    awayTeamName,
    homeScore,
    awayScore,
    predictedWinner,
    confidence,
    homeWinProbability,
    awayWinProbability,
    actualWinner,
    isCorrect,
    date,
    week,
    season
  } = result;

  // Determine winner
  const homeWon = homeScore > awayScore;
  const awayWon = awayScore > homeScore;
  const predictionCorrect = isCorrect;

  // Format date
  const gameDate = new Date(date);
  const formattedDate = gameDate.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric',
    year: 'numeric'
  });

  // Confidence styling
  const confidenceColors = {
    'High': 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
    'Medium': 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30',
    'Low': 'text-orange-400 bg-orange-500/10 border-orange-500/30'
  };

  const confidenceColor = confidenceColors[confidence] || confidenceColors.Medium;

  return (
    <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl border border-slate-700 overflow-hidden hover:border-slate-600 transition-all duration-300 shadow-lg">
      {/* Header with Result Status */}
      <div className={`px-4 py-3 flex items-center justify-between border-b ${
        predictionCorrect 
          ? 'bg-emerald-500/10 border-emerald-500/20' 
          : 'bg-red-500/10 border-red-500/20'
      }`}>
        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-400">
            {season} • Week {week} • {formattedDate}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-2xl ${predictionCorrect ? '' : 'opacity-50'}`}>
            {predictionCorrect ? '✅' : '❌'}
          </span>
          <span className={`text-sm font-semibold ${
            predictionCorrect ? 'text-emerald-400' : 'text-red-400'
          }`}>
            {predictionCorrect ? 'Correct' : 'Incorrect'}
          </span>
        </div>
      </div>

      {/* Game Matchup */}
      <div className="p-6">
        {/* Away Team */}
        <div className={`flex items-center justify-between p-4 rounded-lg mb-3 ${
          awayWon ? 'bg-slate-700/50 ring-2 ring-emerald-500/30' : 'bg-slate-800/50'
        }`}>
          <div className="flex items-center gap-4">
            <img 
              src={getTeamLogo(awayTeamKey)} 
              alt={awayTeamName}
              className="w-12 h-12 object-contain"
            />
            <div>
              <div className="font-bold text-lg">{awayTeamName}</div>
              {predictedWinner === awayTeamKey && (
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-slate-400">Predicted Winner</span>
                  <span className={`px-2 py-0.5 rounded text-xs font-semibold border ${confidenceColor}`}>
                    {confidence} • {(awayWinProbability * 100).toFixed(1)}%
                  </span>
                </div>
              )}
            </div>
          </div>
          <div className={`text-3xl font-bold ${awayWon ? 'text-emerald-400' : 'text-slate-400'}`}>
            {awayScore}
          </div>
        </div>

        {/* VS Divider */}
        <div className="text-center text-slate-500 text-sm font-semibold mb-3">
          FINAL
        </div>

        {/* Home Team */}
        <div className={`flex items-center justify-between p-4 rounded-lg ${
          homeWon ? 'bg-slate-700/50 ring-2 ring-emerald-500/30' : 'bg-slate-800/50'
        }`}>
          <div className="flex items-center gap-4">
            <img 
              src={getTeamLogo(homeTeamKey)} 
              alt={homeTeamName}
              className="w-12 h-12 object-contain"
            />
            <div>
              <div className="font-bold text-lg">{homeTeamName}</div>
              {predictedWinner === homeTeamKey && (
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-slate-400">Predicted Winner</span>
                  <span className={`px-2 py-0.5 rounded text-xs font-semibold border ${confidenceColor}`}>
                    {confidence} • {(homeWinProbability * 100).toFixed(1)}%
                  </span>
                </div>
              )}
            </div>
          </div>
          <div className={`text-3xl font-bold ${homeWon ? 'text-emerald-400' : 'text-slate-400'}`}>
            {homeScore}
          </div>
        </div>
      </div>

      {/* Prediction Summary */}
      <div className={`px-6 py-4 border-t ${
        predictionCorrect ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-red-500/5 border-red-500/20'
      }`}>
        <div className="flex items-center justify-between text-sm">
          <div className="text-slate-400">
            <span className="font-semibold">Predicted: </span>
            <span className={predictionCorrect ? 'text-emerald-400' : 'text-red-400'}>
              {predictedWinner === homeTeamKey ? homeTeamName : awayTeamName}
            </span>
          </div>
          <div className="text-slate-400">
            <span className="font-semibold">Actual: </span>
            <span className="text-white">
              {actualWinner === homeTeamKey ? homeTeamName : awayTeamName}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}