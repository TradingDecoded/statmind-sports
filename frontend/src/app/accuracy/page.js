// frontend/src/app/accuracy/page.js

import { fetchHistoricalAccuracy } from '@/utils/api';
import StatsCard from '@/components/StatsCard';

export default async function AccuracyPage() {
  const accuracyData = await fetchHistoricalAccuracy();
  
  if (!accuracyData || !accuracyData.overall) {
    return (
      <div className="min-h-screen py-12 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-5xl font-bold mb-4">Historical Accuracy</h1>
          <p className="text-slate-400">Unable to load accuracy data. Please try again later.</p>
        </div>
      </div>
    );
  }
  
  const { overall, bySeason, byConfidence, weeklyBreakdown } = accuracyData;
  
  return (
    <div className="min-h-screen py-12 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-block mb-6">
            <span className="px-4 py-2 bg-emerald-500/10 border border-emerald-500/30 rounded-full text-emerald-400 text-sm font-semibold">
              Complete Transparency
            </span>
          </div>
          <h1 className="text-5xl md:text-6xl font-bold mb-4">Historical Accuracy</h1>
          <p className="text-slate-400 text-lg max-w-2xl mx-auto">
            Every prediction tracked and verified since {overall.first_season || 2024}. 
            We show all results—wins and losses—to build trust through transparency.
          </p>
        </div>
        
        {/* Overall Stats - Hero */}
        <div className="bg-gradient-to-br from-emerald-900/30 to-teal-900/30 border border-emerald-500/30 rounded-2xl p-8 md:p-12 mb-12 text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:30px_30px]"></div>
          <div className="relative">
            <p className="text-emerald-400 text-sm font-semibold mb-2 uppercase tracking-wide">
              Overall Performance
            </p>
            <h2 className="text-6xl md:text-8xl font-bold text-white mb-4">
              {overall.accuracy_percentage}%
            </h2>
            <p className="text-slate-300 text-xl mb-6">
              {overall.correct_predictions.toLocaleString()} correct out of {overall.total_predictions.toLocaleString()} total predictions
            </p>
            <div className="w-full max-w-md mx-auto bg-slate-800 rounded-full h-4 overflow-hidden">
              <div 
                className="bg-gradient-to-r from-emerald-500 to-teal-500 h-full rounded-full transition-all duration-1000"
                style={{ width: `${overall.accuracy_percentage}%` }}
              ></div>
            </div>
            <p className="text-slate-400 text-sm mt-4">
              Spanning {overall.total_seasons} season{overall.total_seasons > 1 ? 's' : ''} · {overall.first_season} - {overall.latest_season}
            </p>
          </div>
        </div>
        
        {/* Season Breakdown */}
        {bySeason && bySeason.length > 0 && (
          <div className="bg-slate-800 rounded-xl border border-slate-700 p-6 md:p-8 mb-12">
            <h3 className="text-2xl font-bold mb-6 flex items-center">
              <svg className="w-6 h-6 text-emerald-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Performance by Season
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-700">
                    <th className="text-left py-3 px-4 text-slate-400 font-semibold">Season</th>
                    <th className="text-center py-3 px-4 text-slate-400 font-semibold">Games</th>
                    <th className="text-center py-3 px-4 text-slate-400 font-semibold">Correct</th>
                    <th className="text-center py-3 px-4 text-slate-400 font-semibold">Accuracy</th>
                    <th className="text-right py-3 px-4 text-slate-400 font-semibold">Performance</th>
                  </tr>
                </thead>
                <tbody>
                  {bySeason.map(season => (
                    <tr key={season.season} className="border-b border-slate-700/50 hover:bg-slate-700/30 transition">
                      <td className="py-4 px-4">
                        <span className="text-white font-semibold">{season.season}</span>
                      </td>
                      <td className="text-center py-4 px-4 text-slate-300">
                        {season.total_predictions}
                      </td>
                      <td className="text-center py-4 px-4 text-emerald-400 font-semibold">
                        {season.correct_predictions}
                      </td>
                      <td className="text-center py-4 px-4">
                        <span className="text-white font-bold text-lg">{season.accuracy_percentage}%</span>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center justify-end gap-3">
                          <div className="w-32 bg-slate-700 rounded-full h-2 overflow-hidden">
                            <div 
                              className={`h-full rounded-full transition-all duration-1000 ${season.accuracy_percentage >= 75 ? 
                                'bg-gradient-to-r from-emerald-500 to-teal-500' : season.accuracy_percentage >= 65 ? 'bg-gradient-to-r from-yellow-500 to-orange-500' : 'bg-gradient-to-r from-orange-500 to-red-500'}`}
                              style={{ width: `${season.accuracy_percentage}%` }}
                            ></div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
        
        {/* Confidence Level Breakdown - FIXED */}
        {byConfidence && byConfidence.length > 0 && (
          <div className="bg-slate-800 rounded-xl border border-slate-700 p-6 md:p-8 mb-12">
            <h3 className="text-2xl font-bold mb-6 flex items-center">
              <svg className="w-6 h-6 text-emerald-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              Accuracy by Confidence Level
            </h3>
            <p className="text-slate-400 mb-6">
              Our algorithm assigns confidence levels based on prediction strength. Higher confidence correlates with better accuracy.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {byConfidence.map(conf => {
                // FIXED: Use conf.confidence instead of conf.confidence_level
                const confidenceLevel = conf.confidence;
                const confidenceColors = {
                  'High': 'emerald',
                  'Medium': 'yellow',
                  'Low': 'orange'
                };
                const color = confidenceColors[confidenceLevel] || 'slate';
                
                return (
                  <div key={confidenceLevel} className={`bg-${color}-500/5 border border-${color}-500/30 rounded-xl p-6`}>
                    <div className="flex items-center justify-between mb-4">
                      <span className={`text-${color}-400 font-semibold text-lg`}>
                        {confidenceLevel} Confidence
                      </span>
                      <span className={`px-3 py-1 bg-${color}-500/20 border border-${color}-500/40 rounded-full text-${color}-400 text-sm font-bold`}>
                        {conf.accuracy_percentage}%
                      </span>
                    </div>
                    <div className={`w-full bg-slate-700 rounded-full h-3 mb-3 overflow-hidden`}>
                      <div 
                        className={`bg-gradient-to-r from-${color}-500 to-${color}-400 h-full rounded-full transition-all duration-1000`}
                        style={{ width: `${conf.accuracy_percentage}%` }}
                      ></div>
                    </div>
                    <div className="flex justify-between text-sm text-slate-400">
                      <span>{conf.correct_predictions} correct</span>
                      <span>{conf.total_predictions} total</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
        
        {/* Comparison Section */}
        <div className="bg-slate-800 rounded-xl border border-slate-700 p-6 md:p-8 mb-12">
          <h3 className="text-2xl font-bold mb-6 flex items-center">
            <svg className="w-6 h-6 text-emerald-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
            How We Compare
          </h3>
          <div className="space-y-6">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-white font-semibold">StatMind Sports</span>
                <span className="text-emerald-400 font-bold">{overall.accuracy_percentage}%</span>
              </div>
              <div className="w-full bg-slate-700 rounded-full h-3 overflow-hidden">
                <div 
                  className="bg-gradient-to-r from-emerald-500 to-teal-500 h-full rounded-full"
                  style={{ width: `${overall.accuracy_percentage}%` }}
                ></div>
              </div>
            </div>
            
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-slate-400">Industry Average (ESPN, 538)</span>
                <span className="text-slate-400 font-bold">~60%</span>
              </div>
              <div className="w-full bg-slate-700 rounded-full h-3 overflow-hidden">
                <div 
                  className="bg-slate-500 h-full rounded-full"
                  style={{ width: '60%' }}
                ></div>
              </div>
            </div>
            
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-slate-400">Random Chance</span>
                <span className="text-slate-400 font-bold">50%</span>
              </div>
              <div className="w-full bg-slate-700 rounded-full h-3 overflow-hidden">
                <div 
                  className="bg-slate-600 h-full rounded-full"
                  style={{ width: '50%' }}
                ></div>
              </div>
            </div>
          </div>
          
          <div className="mt-6 p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-lg">
            <p className="text-emerald-400 text-sm">
              <strong>Why this matters:</strong> Our {overall.accuracy_percentage}% accuracy rate is significantly above industry standards, 
              demonstrating the effectiveness of our 5-component prediction algorithm.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}