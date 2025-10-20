'use client';

import { useState, useEffect } from 'react';
import PredictionCard from '@/components/PredictionCard';
import { useAutoRefresh } from '@/hooks/useAutoRefresh';
import RefreshStatus from '@/components/RefreshStatus';
import LiveBadge from '@/components/LiveBadge';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://statmindsports.com/api';

function getCurrentSeasonWeek() {
  const now = new Date();
  const year = now.getFullYear();
  const season = now.getMonth() >= 8 ? year : year - 1;
  const seasonStart = new Date(season, 8, 1);
  const weeksDiff = Math.floor((now - seasonStart) / (7 * 24 * 60 * 60 * 1000));
  let week = Math.min(Math.max(weeksDiff + 1, 1), 18);

  // If it's Monday or Tuesday, stay on previous week (wait for MNF to finish)
  const dayOfWeek = now.getDay();
  if (dayOfWeek === 1 || dayOfWeek === 2) {
    week = Math.max(1, week - 1);
  }

  return { season, week };
}

export default function PredictionsPage() {
  const { season: currentSeason, week: currentWeek } = getCurrentSeasonWeek();

  const [season, setSeason] = useState(currentSeason);
  const [week, setWeek] = useState(currentWeek);
  const [predictions, setPredictions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [confidenceFilter, setConfidenceFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState('date');
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  // Auto-refresh functionality
  const {
    isRefreshing: isAutoRefreshing,
    isPaused,
    lastUpdated,
    secondsSinceUpdate,
    isGameWindow,
    togglePause,
    manualRefresh,
  } = useAutoRefresh(
    async () => {
      await loadPredictions();
    },
    {
      intervalMs: 60000,
      enabledDays: [0, 1, 4],
      enabledHours: {
        0: [12, 23],
        1: [18, 23],
        4: [18, 23]
      },
      stopWhenAllFinal: true,
      checkAllFinalFunction: async () => {
        return predictions.length > 0 && predictions.every(pred => pred.isFinal);
      }
    }
  );

  useEffect(() => {
    loadPredictions();
  }, [season, week]);

  async function loadPredictions() {
    setLoading(true);
    setError(null);

    try {
      // Fetch predictions for selected week
      const response = await fetch(`${API_BASE_URL}/predictions/week/${season}/${week}`);
      const data = await response.json();
      const predictions = data.predictions || [];

      if (!predictions || predictions.length === 0) {
        setPredictions([]);
        setLoading(false);
        setIsInitialLoad(false);
        return;
      }

      // ONLY auto-advance on initial page load, not when user manually changes week
      if (isInitialLoad) {
        // Check if ALL games in this week are finished
        const allGamesFinished = predictions.every(pred => pred.isFinal && pred.homeScore !== null);

        // If all games finished, try to load next week
        if (allGamesFinished) {
          console.log(`📅 All games in Week ${week} are finished. Checking next week...`);

          const nextWeek = week + 1;
          if (nextWeek <= 18) {
            // Try to load next week
            const nextResponse = await fetch(`${API_BASE_URL}/predictions/week/${season}/${nextWeek}`);
            const nextData = await nextResponse.json();

            if (nextData.success && nextData.predictions && nextData.predictions.length > 0) {
              console.log(`✅ Loading Week ${nextWeek} predictions`);
              setWeek(nextWeek);
              setPredictions(nextData.predictions);
              setLoading(false);
              setIsInitialLoad(false);
              return;
            }
          }
        }
      }

      // Show current week's predictions (default behavior)
      setPredictions(predictions);
      setLoading(false);
      setIsInitialLoad(false);

    } catch (err) {
      console.error('Error loading predictions:', err);
      setError('Failed to load predictions. Please try again.');
      setLoading(false);
      setIsInitialLoad(false);
    }
  }

  const filteredPredictions = predictions.filter(pred => {
    if (confidenceFilter === 'ALL') return true;
    return pred.confidence?.toUpperCase() === confidenceFilter;
  });

  const sortedPredictions = [...filteredPredictions].sort((a, b) => {
    switch (sortBy) {
      case 'date':
        return new Date(a.date) - new Date(b.date);
      case 'confidence':
        const confidenceOrder = { 'HIGH': 3, 'MEDIUM': 2, 'LOW': 1 };
        return (confidenceOrder[b.confidence?.toUpperCase()] || 0) - (confidenceOrder[a.confidence?.toUpperCase()] || 0);
      case 'probability':
        let aProb = Math.max(parseFloat(a.homeWinProbability) || 0, parseFloat(a.awayWinProbability) || 0);
        let bProb = Math.max(parseFloat(b.homeWinProbability) || 0, parseFloat(b.awayWinProbability) || 0);
        if (aProb < 1) aProb *= 100;
        if (bProb < 1) bProb *= 100;
        return bProb - aProb;
      default:
        return 0;
    }
  });

  const highConfidenceCount = filteredPredictions.filter(p => p.confidence?.toUpperCase() === 'HIGH').length;

  let avgProbability = 0;
  if (filteredPredictions.length > 0) {
    const sum = filteredPredictions.reduce((sum, p) => {
      let maxProb = Math.max(parseFloat(p.homeWinProbability) || 0, parseFloat(p.awayWinProbability) || 0);
      if (maxProb < 1) maxProb *= 100;
      return sum + maxProb;
    }, 0);
    avgProbability = (sum / filteredPredictions.length).toFixed(1);
  }

  return (
    <div className="min-h-screen py-12 px-4">
      <div className="max-w-7xl mx-auto">
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

        <div className="bg-slate-800 rounded-xl border border-slate-700 p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Season</label>
              <select
                value={season}
                onChange={(e) => {
                  setSeason(Number(e.target.value));
                  setIsInitialLoad(false);
                }}
                className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all cursor-pointer"
              >
                {[2025, 2024, 2023, 2022, 2021, 2020].map(year => (
                  <option key={year} value={year}>{year} Season</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Week</label>
              <select
                value={week}
                onChange={(e) => {
                  setWeek(Number(e.target.value));
                  setIsInitialLoad(false);
                }}
                className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all cursor-pointer"
              >
                {[...Array(22)].map((_, i) => (
                  <option key={i + 1} value={i + 1}>
                    {i + 1 <= 18
                      ? `Week ${i + 1}`
                      : i + 1 === 19 ? 'Wild Card Round'
                        : i + 1 === 20 ? 'Divisional Round'
                          : i + 1 === 21 ? 'Conference Championships'
                            : i + 1 === 22 ? 'Super Bowl'
                              : `Week ${i + 1}`
                    }
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Confidence Level</label>
              <select value={confidenceFilter} onChange={(e) => setConfidenceFilter(e.target.value)} className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all cursor-pointer">
                <option value="ALL">All Predictions</option>
                <option value="HIGH">High Confidence</option>
                <option value="MEDIUM">Medium Confidence</option>
                <option value="LOW">Low Confidence</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Sort By</label>
              <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all cursor-pointer">
                <option value="date">Game Date</option>
                <option value="confidence">Confidence Level</option>
                <option value="probability">Win Probability</option>
              </select>
            </div>
          </div>
        </div>

        {!loading && filteredPredictions.length > 0 && (
          <div className="bg-gradient-to-r from-emerald-900/20 to-teal-900/20 border border-emerald-500/30 rounded-xl p-6 mb-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
              <div>
                <p className="text-slate-400 text-sm mb-1">Total Games</p>
                <p className="text-white text-2xl font-bold">{filteredPredictions.length}</p>
              </div>
              <div>
                <p className="text-slate-400 text-sm mb-1">
                  {confidenceFilter === 'ALL' ? 'High Confidence' : confidenceFilter.charAt(0) + confidenceFilter.slice(1).toLowerCase() + ' Confidence'}
                </p>
                <p className="text-emerald-400 text-2xl font-bold">
                  {confidenceFilter === 'ALL' ? highConfidenceCount : filteredPredictions.length}
                </p>
              </div>
              <div>
                <p className="text-slate-400 text-sm mb-1">Avg Win Probability</p>
                <p className="text-white text-2xl font-bold">{avgProbability}%</p>
              </div>
            </div>
          </div>
        )}

        {/* Showing count and Refresh Status - Same line with centered refresh */}
        <div className="grid grid-cols-3 items-center mb-8">
          {/* Left: Showing text */}
          <p className="text-slate-400 text-left">
            Showing <span className="font-bold text-white">{sortedPredictions.length}</span> prediction{sortedPredictions.length !== 1 ? 's' : ''}
            {confidenceFilter !== 'ALL' && <span className="text-emerald-400"> • {confidenceFilter} confidence</span>}
          </p>

          {/* Center: Refresh Status */}
          <div className="flex justify-center">
            <div className="bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-2 inline-block">
              <RefreshStatus
                isRefreshing={isAutoRefreshing || loading}
                isPaused={isPaused}
                lastUpdated={lastUpdated}
                secondsSinceUpdate={secondsSinceUpdate}
                isGameWindow={isGameWindow}
                onTogglePause={togglePause}
                onManualRefresh={manualRefresh}
              />
            </div>
          </div>

          {/* Right: Empty (for balance) */}
          <div></div>
        </div>

        {loading ? (
          <div className="text-center py-20">
            <div className="inline-block w-16 h-16 border-4 border-slate-600 border-t-emerald-500 rounded-full animate-spin"></div>
            <p className="text-slate-400 mt-4">Loading predictions...</p>
          </div>
        ) : sortedPredictions.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sortedPredictions.map((prediction, idx) => (
              <PredictionCard key={prediction.gameId || idx} prediction={prediction} />
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-slate-800 rounded-xl border border-slate-700">
            <svg className="w-20 h-20 text-slate-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-slate-300 text-xl font-semibold mb-2">No predictions found</p>
            <p className="text-slate-500 text-sm">Try selecting a different week or season</p>
          </div>
        )}
      </div>
    </div>
  );
}