// frontend/src/app/accuracy/page.js

import StatsCard from '@/components/StatsCard';

export default function AccuracyPage() {
  // This data should come from your backend API
  // For now, using the data from your TRD
  const overallStats = {
    totalPredictions: 256,
    correctPredictions: 204,
    accuracy: 79.7
  };
  
  const seasonStats = [
    { season: 2024, total: 256, correct: 204, accuracy: 79.7 },
    { season: 2025, total: 90, correct: 68, accuracy: 75.6 }
  ];
  
  const confidenceBreakdown = [
    { level: 'High', total: 174, correct: 148, accuracy: 85.1 },
    { level: 'Medium', total: 62, correct: 44, accuracy: 71.0 },
    { level: 'Low', total: 20, correct: 12, accuracy: 60.0 }
  ];
  
  return (
    <div className="min-h-screen py-12 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold mb-4">Historical Accuracy</h1>
          <p className="text-slate-400 text-lg">
            Transparent performance tracking since 2024
          </p>
        </div>
        
        {/* Overall Stats - Hero */}
        <div className="bg-gradient-to-br from-emerald-900/30 to-teal-900/30 border border-emerald-500/30 rounded-2xl p-12 mb-12 text-center">
          <p className="text-emerald-400 text-sm font-semibold mb-2">OVERALL PERFORMANCE</p>
          <h2 className="text-7xl font-bold text-white mb-4">{overallStats.accuracy}%</h2>
          <p className="text-slate-300 text-xl mb-6">
            {overallStats.correctPredictions} correct out of {overallStats.totalPredictions} total predictions
          </p>
          <div className="w-full max-w-md mx-auto bg-slate-800 rounded-full h-4 overflow-hidden">
            <div 
              className="bg-gradient-to-r from-emerald-500 to-teal-500 h-full rounded-full transition-all duration-1000"
              style={{ width: `${overallStats.accuracy}%` }}
            ></div>
          </div>
        </div>
        
        {/* Quick Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <StatsCard
            title="Total Games Analyzed"
            value={overallStats.totalPredictions.toLocaleString()}
            subtitle="Across all seasons"
            icon={
              <svg className="w-6 h-6 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            }
          />
          <StatsCard
            title="Correct Predictions"
            value={overallStats.correctPredictions.toLocaleString()}
            subtitle="Winning picks"
            icon={
              <svg className="w-6 h-6 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
          />
          <StatsCard
            title="Industry Benchmark"
            value="~55%"
            subtitle="Typical sports prediction accuracy"
            icon={
              <svg className="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            }
          />
        </div>
        
        {/* Performance by Season */}
        <div className="mb-12">
          <h2 className="text-3xl font-bold mb-6">Performance by Season</h2>
          <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-900">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">Season</th>
                    <th className="px-6 py-4 text-right text-sm font-semibold text-slate-300">Total Games</th>
                    <th className="px-6 py-4 text-right text-sm font-semibold text-slate-300">Correct</th>
                    <th className="px-6 py-4 text-right text-sm font-semibold text-slate-300">Accuracy</th>
                    <th className="px-6 py-4 text-right text-sm font-semibold text-slate-300">Visual</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700">
                  {seasonStats.map((stat) => (
                    <tr key={stat.season} className="hover:bg-slate-700/50 transition-colors">
                      <td className="px-6 py-4 text-white font-semibold">{stat.season}</td>
                      <td className="px-6 py-4 text-right text-slate-300">{stat.total}</td>
                      <td className="px-6 py-4 text-right text-emerald-400 font-semibold">{stat.correct}</td>
                      <td className="px-6 py-4 text-right">
                        <span className="inline-block px-3 py-1 bg-emerald-500/20 text-emerald-400 rounded-full font-semibold">
                          {stat.accuracy}%
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex justify-end">
                          <div className="w-32 bg-slate-900 rounded-full h-2 overflow-hidden">
                            <div 
                              className="bg-emerald-500 h-full rounded-full"
                              style={{ width: `${stat.accuracy}%` }}
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
        </div>
        
        {/* Confidence Level Breakdown */}
        <div className="mb-12">
          <h2 className="text-3xl font-bold mb-6">Accuracy by Confidence Level</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {confidenceBreakdown.map((conf) => (
              <div key={conf.level} className="bg-slate-800 rounded-xl border border-slate-700 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-semibold text-white">{conf.level} Confidence</h3>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    conf.level === 'High' ? 'bg-emerald-500/20 text-emerald-400' :
                    conf.level === 'Medium' ? 'bg-yellow-500/20 text-yellow-400' :
                    'bg-slate-500/20 text-slate-400'
                  }`}>
                    {conf.accuracy}%
                  </span>
                </div>
                <p className="text-slate-400 mb-4">
                  {conf.correct} / {conf.total} predictions correct
                </p>
                <div className="w-full bg-slate-900 rounded-full h-3 overflow-hidden">
                  <div 
                    className={`h-full rounded-full ${
                      conf.level === 'High' ? 'bg-emerald-500' :
                      conf.level === 'Medium' ? 'bg-yellow-500' :
                      'bg-slate-500'
                    }`}
                    style={{ width: `${conf.accuracy}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {/* Comparison to Industry */}
        <div className="bg-gradient-to-r from-slate-800 to-slate-900 border border-slate-700 rounded-xl p-8">
          <h2 className="text-2xl font-bold mb-4">How We Compare</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <p className="text-slate-400 mb-4">
                Our algorithm consistently outperforms industry benchmarks and traditional prediction methods.
              </p>
              <ul className="space-y-2 text-slate-300">
                <li className="flex items-center">
                  <svg className="w-5 h-5 text-emerald-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span><strong>24.7%</strong> above industry average</span>
                </li>
                <li className="flex items-center">
                  <svg className="w-5 h-5 text-emerald-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>Transparent methodology</span>
                </li>
                <li className="flex items-center">
                  <svg className="w-5 h-5 text-emerald-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>Proven track record since 2024</span>
                </li>
              </ul>
            </div>
            <div className="flex items-center justify-center">
              <div className="text-center">
                <div className="text-6xl font-bold text-emerald-400 mb-2">79.7%</div>
                <div className="text-slate-400">vs.</div>
                <div className="text-4xl font-bold text-slate-500 mt-2">~55%</div>
                <p className="text-slate-500 text-sm mt-2">Industry Average</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}