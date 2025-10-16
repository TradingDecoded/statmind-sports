'use client';

import { useState, useEffect } from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function AnalyticsPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchAnalytics() {
      try {
        // Use relative URL so it works in both dev and production
        const response = await fetch('/api/analytics/dashboard');
        if (!response.ok) throw new Error('Failed to fetch analytics');
        const result = await response.json();
        setData(result);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 flex items-center justify-center">
        <div className="text-white text-2xl">Loading analytics...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 flex items-center justify-center">
        <div className="text-red-400 text-xl">Error: {error}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-white mb-4">
            Performance Analytics
          </h1>
          <p className="text-xl text-gray-300">
            2025 NFL Season • Transparency Through Data
          </p>
        </div>

        {/* Hero Stats Card */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl shadow-2xl p-8 mb-8">
          <div className="text-center">
            <div className="text-7xl font-bold text-white mb-2">
              {data.overall.accuracy_percentage}%
            </div>
            <div className="text-2xl text-white/90 mb-4">
              Overall Prediction Accuracy
            </div>
            <div className="flex justify-center gap-8 text-white/80">
              <div>
                <div className="text-3xl font-semibold">{data.overall.correct_predictions}</div>
                <div className="text-sm">Correct</div>
              </div>
              <div className="text-4xl font-thin">/</div>
              <div>
                <div className="text-3xl font-semibold">{data.overall.total_predictions}</div>
                <div className="text-sm">Total Predictions</div>
              </div>
            </div>
          </div>
        </div>

        {/* Confidence Breakdown */}
        <div className="bg-white/10 backdrop-blur-lg rounded-xl shadow-xl p-6 mb-8">
          <h2 className="text-2xl font-bold text-white mb-6">Accuracy by Confidence Level</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {data.byConfidence.map((conf) => (
              <div key={conf.confidence_level} className="bg-white/5 rounded-lg p-6 border border-white/10">
                <div className="text-lg text-gray-300 mb-2">{conf.confidence_level} Confidence</div>
                <div className="text-4xl font-bold text-white mb-2">
                  {conf.accuracy_percentage}%
                </div>
                <div className="text-sm text-gray-400">
                  {conf.correct_predictions}/{conf.total_predictions} correct
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Weekly Accuracy Trend */}
        <div className="bg-white/10 backdrop-blur-lg rounded-xl shadow-xl p-6 mb-8">
          <h2 className="text-2xl font-bold text-white mb-6">Weekly Accuracy Trend</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data.weeklyTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff20" />
              <XAxis 
                dataKey="week" 
                stroke="#fff"
                label={{ value: 'Week', position: 'insideBottom', offset: -5, fill: '#fff' }}
              />
              <YAxis 
                stroke="#fff"
                domain={[0, 100]}
                label={{ value: 'Accuracy %', angle: -90, position: 'insideLeft', fill: '#fff' }}
              />
              <Tooltip 
                contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px' }}
                labelStyle={{ color: '#fff' }}
              />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="accuracy_percentage" 
                stroke="#3b82f6" 
                strokeWidth={3}
                name="Accuracy %"
                dot={{ fill: '#3b82f6', r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Team Performance */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          
          {/* Most Predictable Teams */}
          <div className="bg-white/10 backdrop-blur-lg rounded-xl shadow-xl p-6">
            <h2 className="text-2xl font-bold text-white mb-6">Most Predictable Teams</h2>
            <div className="space-y-3">
              {data.mostPredictable.map((team, idx) => (
                <div key={team.team_name} className="bg-white/5 rounded-lg p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="text-2xl font-bold text-blue-400">#{idx + 1}</div>
                    <div>
                      <div className="text-lg font-semibold text-white">{team.team_name}</div>
                      <div className="text-sm text-gray-400">
                        {team.correct_predictions}/{team.total_predictions} predictions
                      </div>
                    </div>
                  </div>
                  <div className="text-2xl font-bold text-green-400">
                    {team.accuracy_percentage}%
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Least Predictable Teams */}
          <div className="bg-white/10 backdrop-blur-lg rounded-xl shadow-xl p-6">
            <h2 className="text-2xl font-bold text-white mb-6">Hardest to Predict</h2>
            <div className="space-y-3">
              {data.leastPredictable.map((team, idx) => (
                <div key={team.team_name} className="bg-white/5 rounded-lg p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="text-2xl font-bold text-red-400">#{idx + 1}</div>
                    <div>
                      <div className="text-lg font-semibold text-white">{team.team_name}</div>
                      <div className="text-sm text-gray-400">
                        {team.correct_predictions}/{team.total_predictions} predictions
                      </div>
                    </div>
                  </div>
                  <div className="text-2xl font-bold text-red-400">
                    {team.accuracy_percentage}%
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Biggest Upsets */}
        <div className="bg-white/10 backdrop-blur-lg rounded-xl shadow-xl p-6 mb-8">
          <h2 className="text-2xl font-bold text-white mb-6">Biggest Upsets (70%+ Favorites That Lost)</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-white/20">
                  <th className="px-4 py-3 text-gray-300">Week</th>
                  <th className="px-4 py-3 text-gray-300">Matchup</th>
                  <th className="px-4 py-3 text-gray-300">Score</th>
                  <th className="px-4 py-3 text-gray-300">Predicted</th>
                  <th className="px-4 py-3 text-gray-300">Win Prob</th>
                </tr>
              </thead>
              <tbody>
                {data.upsets.map((upset, idx) => (
                  <tr key={idx} className="border-b border-white/10">
                    <td className="px-4 py-3 text-white">{upset.week}</td>
                    <td className="px-4 py-3 text-white">
                      {upset.away_team} @ {upset.home_team}
                    </td>
                    <td className="px-4 py-3 text-white">
                      {upset.away_score} - {upset.home_score}
                    </td>
                    <td className="px-4 py-3 text-blue-400 font-semibold">
                      {upset.predicted_winner}
                    </td>
                    <td className="px-4 py-3 text-red-400 font-bold">
                      {Math.round(upset.win_probability)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Elo Ratings Leaderboard */}
        <div className="bg-white/10 backdrop-blur-lg rounded-xl shadow-xl p-6">
          <h2 className="text-2xl font-bold text-white mb-6">Current Elo Power Rankings</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {data.eloRatings.slice(0, 12).map((team, idx) => (
              <div key={team.team_key} className="bg-white/5 rounded-lg p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`text-xl font-bold ${idx < 3 ? 'text-yellow-400' : 'text-gray-400'}`}>
                    #{idx + 1}
                  </div>
                  <div>
                    <div className="text-lg font-semibold text-white">{team.team_key}</div>
                    <div className="text-sm text-gray-400">
                      {team.wins}-{team.losses} ({team.win_percentage}%)
                    </div>
                  </div>
                </div>
                <div className="text-xl font-bold text-blue-400">
                  {Math.round(team.elo_rating)}
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
