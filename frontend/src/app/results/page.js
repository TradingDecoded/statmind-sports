// frontend/src/app/results/page.js
'use client';

import { useState, useEffect } from 'react';
import ResultCard from '@/components/ResultCard';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://statmindsports.com/api';

export default function ResultsPage() {
  const [results, setResults] = useState([]);
  const [availableData, setAvailableData] = useState({ seasons: [], weeks: [] });
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  
  // Filters
  const [selectedSeason, setSelectedSeason] = useState('all');
  const [selectedWeek, setSelectedWeek] = useState('all');
  const [confidenceFilter, setConfidenceFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState('date');

  useEffect(() => {
    loadAvailableData();
  }, []);

  useEffect(() => {
    loadResults();
  }, [selectedSeason, selectedWeek, confidenceFilter, sortBy]);

  async function loadAvailableData() {
    try {
      const response = await fetch(`${API_BASE_URL}/predictions/results/available`);
      const data = await response.json();
      if (data.success) {
        setAvailableData(data);
      }
    } catch (error) {
      console.error('Error loading available data:', error);
    }
  }

  async function loadResults() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedSeason !== 'all') params.append('season', selectedSeason);
      if (selectedWeek !== 'all') params.append('week', selectedWeek);
      if (confidenceFilter !== 'ALL') params.append('confidence', confidenceFilter);
      params.append('sort', sortBy);

      const response = await fetch(`${API_BASE_URL}/predictions/results?${params}`);
      const data = await response.json();
      
      if (data.success) {
        setResults(data.results || []);
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Error loading results:', error);
      setResults([]);
    }
    setLoading(false);
  }

  const getWeeksForSeason = () => {
    if (selectedSeason === 'all') {
      return [];
    }
    return availableData.weeks.filter(w => w.season.toString() === selectedSeason);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 to-slate-900">
      {/* Header */}
      <section className="bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-900 py-16 px-4 border-b border-slate-700">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-white to-emerald-400 bg-clip-text text-transparent">
            Historical Results
          </h1>
          <p className="text-xl text-slate-300 max-w-3xl">
            View our complete prediction history with actual game outcomes and accuracy tracking.
          </p>
        </div>
      </section>

      {/* Stats Summary */}
      {stats && (
        <section className="py-8 px-4 bg-slate-900/50 border-b border-slate-800">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {/* Overall Accuracy */}
              <div className="bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border border-emerald-500/30 rounded-xl p-6 text-center">
                <div className="text-3xl md:text-4xl font-bold text-emerald-400 mb-2">
                  {stats.accuracy}%
                </div>
                <div className="text-sm text-slate-400 font-semibold">Overall Accuracy</div>
                <div className="text-xs text-slate-500 mt-1">
                  {stats.correct} of {stats.total} correct
                </div>
              </div>

              {/* High Confidence */}
              <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6 text-center">
                <div className="text-3xl md:text-4xl font-bold text-emerald-400 mb-2">
                  {stats.byConfidence.high.accuracy}%
                </div>
                <div className="text-sm text-slate-400 font-semibold">High Confidence</div>
                <div className="text-xs text-slate-500 mt-1">
                  {stats.byConfidence.high.correct} of {stats.byConfidence.high.total}
                </div>
              </div>

              {/* Medium Confidence */}
              <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6 text-center">
                <div className="text-3xl md:text-4xl font-bold text-yellow-400 mb-2">
                  {stats.byConfidence.medium.accuracy}%
                </div>
                <div className="text-sm text-slate-400 font-semibold">Medium Confidence</div>
                <div className="text-xs text-slate-500 mt-1">
                  {stats.byConfidence.medium.correct} of {stats.byConfidence.medium.total}
                </div>
              </div>

              {/* Low Confidence */}
              <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6 text-center">
                <div className="text-3xl md:text-4xl font-bold text-orange-400 mb-2">
                  {stats.byConfidence.low.accuracy}%
                </div>
                <div className="text-sm text-slate-400 font-semibold">Low Confidence</div>
                <div className="text-xs text-slate-500 mt-1">
                  {stats.byConfidence.low.correct} of {stats.byConfidence.low.total}
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Filters */}
      <section className="py-6 px-4 bg-slate-900/30 border-b border-slate-800 sticky top-16 z-40 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-wrap gap-4 items-center justify-between">
            {/* Left Side - Filters */}
            <div className="flex flex-wrap gap-3">
              {/* Season Filter */}
              <select
                value={selectedSeason}
                onChange={(e) => {
                  setSelectedSeason(e.target.value);
                  setSelectedWeek('all');
                }}
                className="bg-slate-800 border border-slate-600 rounded-lg px-4 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="all">All Seasons</option>
                {availableData.seasons.map((s) => (
                  <option key={s.season} value={s.season}>
                    {s.season} Season ({s.total_games} games)
                  </option>
                ))}
              </select>

              {/* Week Filter */}
              <select
                value={selectedWeek}
                onChange={(e) => setSelectedWeek(e.target.value)}
                disabled={selectedSeason === 'all'}
                className="bg-slate-800 border border-slate-600 rounded-lg px-4 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <option value="all">All Weeks</option>
                {getWeeksForSeason().map((w) => (
                  <option key={`${w.season}-${w.week}`} value={w.week}>
                    Week {w.week} ({w.game_count} games)
                  </option>
                ))}
              </select>

              {/* Confidence Filter */}
              <div className="flex gap-2 bg-slate-800 border border-slate-600 rounded-lg p-1">
                {['ALL', 'High', 'Medium', 'Low'].map((conf) => (
                  <button
                    key={conf}
                    onClick={() => setConfidenceFilter(conf)}
                    className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                      confidenceFilter === conf
                        ? 'bg-emerald-500 text-white'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {conf}
                  </button>
                ))}
              </div>
            </div>

            {/* Right Side - Sort */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-slate-800 border border-slate-600 rounded-lg px-4 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="date">Sort by Date</option>
              <option value="confidence">Sort by Confidence</option>
              <option value="correct">Sort by Accuracy</option>
            </select>
          </div>
        </div>
      </section>

      {/* Results Grid */}
      <section className="py-8 px-4">
        <div className="max-w-7xl mx-auto">
          {loading && (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="w-16 h-16 border-4 border-slate-700 border-t-emerald-500 rounded-full animate-spin mb-4"></div>
              <p className="text-slate-400 text-lg">Loading results...</p>
            </div>
          )}

          {!loading && results.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="text-6xl mb-6">📊</div>
              <h3 className="text-2xl font-bold text-white mb-3">No results found</h3>
              <p className="text-slate-400 text-center max-w-md">
                Try adjusting your filters to see more results.
              </p>
            </div>
          )}

          {!loading && results.length > 0 && (
            <>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white">
                  {results.length} {results.length === 1 ? 'Result' : 'Results'}
                </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {results.map((result) => (
                  <ResultCard key={result.gameId} result={result} />
                ))}
              </div>
            </>
          )}
        </div>
      </section>
    </div>
  );
}