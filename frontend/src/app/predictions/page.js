// frontend/src/app/predictions/page.js
'use client';

import { useState, useEffect } from 'react';
import { fetchWeekPredictions, getCurrentSeasonWeek } from '@/utils/api';
import PredictionCard from '@/components/PredictionCard';

export default function PredictionsPage() {
  const { season: currentSeason, week: currentWeek } = getCurrentSeasonWeek();
  
  const [season, setSeason] = useState(currentSeason);
  const [week, setWeek] = useState(currentWeek);
  const [predictions, setPredictions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [confidenceFilter, setConfidenceFilter] = useState('ALL');
  
  useEffect(() => {
    loadPredictions();
  }, [season, week]);
  
  async function loadPredictions() {
    setLoading(true);
    const data = await fetchWeekPredictions(season, week);
    setPredictions(data);
    setLoading(false);
  }
  
  const filteredPredictions = predictions.filter(pred => {
    if (confidenceFilter === 'ALL') return true;
    return pred.confidence?.toUpperCase() === confidenceFilter;
  });
  
  return (
    <div className="min-h-screen py-12 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold mb-4">NFL Predictions</h1>
          <p className="text-slate-400 text-lg">
            Browse predictions by season and week
          </p>
        </div>
        
        {/* Filters */}
        <div className="bg-slate-800 rounded-xl border border-slate-700 p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Season Selector */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Season
              </label>
              <select
                value={season}
                onChange={(e) => setSeason(Number(e.target.value))}
                className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-emerald-500 transition-colors"
              >
                <option value={2024}>2024</option>
                <option value={2025}>2025</option>
              </select>
            </div>
            
            {/* Week Selector */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Week
              </label>
              <select
                value={week}
                onChange={(e) => setWeek(Number(e.target.value))}
                className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-emerald-500 transition-colors"
              >
                {[...Array(18)].map((_, i) => (
                  <option key={i + 1} value={i + 1}>Week {i + 1}</option>
                ))}
              </select>
            </div>
            
            {/* Confidence Filter */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Confidence Level
              </label>
              <select
                value={confidenceFilter}
                onChange={(e) => setConfidenceFilter(e.target.value)}
                className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-emerald-500 transition-colors"
              >
                <option value="ALL">All Predictions</option>
                <option value="HIGH">High Confidence</option>
                <option value="MEDIUM">Medium Confidence</option>
                <option value="LOW">Low Confidence</option>
              </select>
            </div>
          </div>
        </div>
        
        {/* Results Count */}
        <div className="mb-6">
          <p className="text-slate-400">
            Showing <span className="text-white font-semibold">{filteredPredictions.length}</span> predictions
            {confidenceFilter !== 'ALL' && ` (${confidenceFilter} confidence only)`}
          </p>
        </div>
        
        {/* Predictions Grid */}
        {loading ? (
          <div className="text-center py-20">
            <div className="inline-block w-16 h-16 border-4 border-slate-600 border-t-emerald-500 rounded-full animate-spin"></div>
            <p className="text-slate-400 mt-4">Loading predictions...</p>
          </div>
        ) : filteredPredictions.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPredictions.map((prediction, idx) => (
              <PredictionCard key={idx} prediction={prediction} />
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-slate-800 rounded-xl border border-slate-700">
            <svg className="w-16 h-16 text-slate-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-slate-400 text-lg mb-2">No predictions available</p>
            <p className="text-slate-500 text-sm">
              Try selecting a different week or season
            </p>
          </div>
        )}
      </div>
    </div>
  );
}