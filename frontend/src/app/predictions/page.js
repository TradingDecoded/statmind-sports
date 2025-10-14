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
  const [sortBy, setSortBy] = useState('date'); // date, confidence, probability
  
  useEffect(() => {
    loadPredictions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [season, week]);
  
  async function loadPredictions() {
    setLoading(true);
    const data = await fetchWeekPredictions(season, week);
    setPredictions(data);
    setLoading(false);
  }
  
  // Filter predictions by confidence
  const filteredPredictions = predictions.filter(pred => {
    if (confidenceFilter === 'ALL') return true;
    return pred.confidence?.toUpperCase() === confidenceFilter;
  });
  
  // Sort predictions
  const sortedPredictions = [...filteredPredictions].sort((a, b) => {
    switch (sortBy) {
      case 'date':
        return new Date(a.date) - new Date(b.date);
      case 'confidence':
        const confidenceOrder = { 'HIGH': 3, 'MEDIUM': 2, 'LOW': 1 };
        return (confidenceOrder[b.confidence?.toUpperCase()] || 0) - (confidenceOrder[a.confidence?.toUpperCase()] || 0);
      case 'probability':
        const aProb = Math.max(parseFloat(a.homeWinProbability) || 0, parseFloat(a.awayWinProbability) || 0);
        const bProb = Math.max(parseFloat(b.homeWinProbability) || 0, parseFloat(b.awayWinProbability) || 0);
        return bProb - aProb;
      default:
        return 0;
    }
  });
  
  // Calculate quick stats
  const highConfidenceCount = filteredPredictions.filter(p => p.confidence?.toUpperCase() === 'HIGH').length;
  const avgProbability = filteredPredictions.length > 0
    ? (filteredPredictions.reduce((sum, p) => {
        const maxProb = Math.max(parseFloat(p.homeWinProbability) || 0, parseFloat(p.awayWinProbability) || 0);
        return sum + maxProb;
      }, 0) / filteredPredictions.length).toFixed(1)
    : 0;
  
  return (
    <div className="min-h-screen py-12 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-block mb-6">
            <span className="px-4 py-2 bg-emerald-500/10 border border-emerald-500/30 rounded-full text-emerald-400 text-sm font-semibold">
              Comprehensive Analysis
            </span>
          </div>
          <h1 className="text-5xl md:text-6xl font-bold mb-4">NFL Predictions</h1>
          <p className="text-slate-400 text-lg max-w-2xl mx-auto">
            Browse predictions by season and week with advanced filtering and sorting options
          </p>
        </div>
        
        {/* Filters Section */}
        <div className="bg-slate-800 rounded-xl border border-slate-700 p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Season Selector */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Season
              </label>
              <select
                value={season}
                onChange={(e) => setSeason(Number(e.target.value))}
                className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all cursor-pointer"
              >
                <option value={2024}>2024 Season</option>
                <option value={2025}>2025 Season</option>
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
                className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all cursor-pointer"
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
                className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all cursor-pointer"
              >
                <option value="ALL">All Predictions</option>
                <option value="HIGH">High Confidence</option>
                <option value="MEDIUM">Medium Confidence</option>
                <option value="LOW">Low Confidence</option>
              </select>
            </div>
            
            {/* Sort By */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Sort By
              </label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all cursor-pointer"
              >
                <option value="date">Game Date</option>
                <option value="confidence">Confidence Level</option>
                <option value="probability">Win Probability</option>
              </select>
            </div>
          </div>
        </div>
        
        {/* Quick Stats Bar */}
        {!loading && filteredPredictions.length > 0 && (
          <div className="bg-gradient-to-r from-emerald-900/20 to-teal-900/20 border border-emerald-500/30 rounded-xl p-6 mb-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
              <div>
                <p className="text-slate-400 text-sm mb-1">Total Games</p>
                <p className="text-white text-2xl font-bold">{filteredPredictions.length}</p>
              </div>
              <div>
                <p className="text-slate-400 text-sm mb-1">High Confidence</p>
                <p className="text-emerald-400 text-2xl font-bold">{highConfidenceCount}</p>
              </div>
              <div>
                <p className="text-slate-400 text-sm mb-1">Avg Win Probability</p>
                <p className="text-white text-2xl font-bold">{avgProbability}%</p>
              </div>
            </div>
          </div>
        )}
        
        {/* Results Summary */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-slate-400">
              Showing <span className="text-white font-semibold">{sortedPredictions.length}</span> prediction{sortedPredictions.length !== 1 ? 's' : ''}
              {confidenceFilter !== 'ALL' && (
                <span className="text-emerald-400"> · {confidenceFilter} confidence</span>
              )}
            </p>
          </div>
          
          {!loading && sortedPredictions.length > 0 && (
            <div className="hidden sm:flex items-center text-sm text-slate-400">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
              </svg>
              Sorted by {sortBy === 'date' ? 'game date' : sortBy === 'confidence' ? 'confidence level' : 'win probability'}
            </div>
          )}
        </div>
        
        {/* Predictions Grid */}
        {loading ? (
          <div className="text-center py-20">
            <div className="inline-block w-16 h-16 border-4 border-slate-600 border-t-emerald-500 rounded-full animate-spin"></div>
            <p className="text-slate-400 mt-4">Loading predictions...</p>
          </div>
        ) : sortedPredictions.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sortedPredictions.map((prediction, idx) => (
              <PredictionCard key={idx} prediction={prediction} />
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-slate-800 rounded-xl border border-slate-700">
            <svg className="w-20 h-20 text-slate-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-slate-300 text-xl font-semibold mb-2">No predictions found</p>
            <p className="text-slate-500 text-sm mb-6">
              {confidenceFilter !== 'ALL' 
                ? `No ${confidenceFilter.toLowerCase()} confidence predictions for this week`
                : 'Try selecting a different week or season'}
            </p>
            {confidenceFilter !== 'ALL' && (
              <button
                onClick={() => setConfidenceFilter('ALL')}
                className="px-6 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg font-semibold transition-all duration-200"
              >
                Show All Predictions
              </button>
            )}
          </div>
        )}
        
        {/* Info Footer */}
        {!loading && sortedPredictions.length > 0 && (
          <div className="mt-12 p-6 bg-slate-800/50 border border-slate-700 rounded-xl text-center">
            <p className="text-slate-400 text-sm">
              <svg className="w-4 h-4 inline-block mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Predictions are updated weekly and based on our 5-component algorithm. 
              Visit our <a href="/how-it-works" className="text-emerald-400 hover:text-emerald-300 underline">How It Works</a> page to learn more.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}