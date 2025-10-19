// frontend/src/app/page.js
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { fetchUpcomingPredictions } from '@/utils/api';
import PredictionCard from '@/components/PredictionCard';
import StatsCard from '@/components/StatsCard';
import CompetitionHero from '../components/CompetitionHero';

export default function HomePage() {
  const [predictions, setPredictions] = useState([]);
  const [homepageStats, setHomepageStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentWeek, setCurrentWeek] = useState(null);

  useEffect(() => {
    loadPredictions();
    loadHomepageStats();
  }, []);

  const loadPredictions = async () => {
    try {
      setLoading(true);
      setError(null);

      // Determine the current week
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://statmindsports.com/api';

      const now = new Date();
      const seasonStartDate = new Date(2025, 8, 4); // Sept 4, 2025
      const daysSinceStart = Math.floor((now - seasonStartDate) / (1000 * 60 * 60 * 24));
      let currentWeek = Math.floor(daysSinceStart / 7) + 1;

      if (currentWeek < 1) currentWeek = 1;
      if (currentWeek > 18) currentWeek = 18;

      console.log(`📅 Current Week: ${currentWeek}`);
      setCurrentWeek(currentWeek);

      // Fetch ALL predictions for the current week (includes both upcoming and completed)
      const response = await fetch(`${API_BASE_URL}/predictions/week/2025/${currentWeek}`);
      const data = await response.json();

      if (!data.success || !data.predictions) {
        throw new Error('Failed to load predictions');
      }

      console.log('📊 Total predictions for this week:', data.predictions.length);

      // Filter for HIGH confidence games ONLY
      const highConfidencePicks = data.predictions.filter(pred =>
        pred.confidence && pred.confidence.toUpperCase() === 'HIGH'
      );

      console.log('🎯 High confidence picks:', highConfidencePicks.length);

      // Check if ALL high confidence games are completed
      const allCompleted = highConfidencePicks.every(pred => pred.isFinal);

      if (allCompleted && highConfidencePicks.length > 0) {
        console.log('✅ All high confidence games completed, loading NEXT week...');

        // Load next week's predictions
        const nextWeek = currentWeek + 1;
        if (nextWeek <= 18) {
          const nextWeekResponse = await fetch(`${API_BASE_URL}/predictions/week/2025/${nextWeek}`);
          const nextWeekData = await nextWeekResponse.json();

          if (nextWeekData.success && nextWeekData.predictions) {
            const nextWeekHighConfidence = nextWeekData.predictions.filter(pred =>
              pred.confidence && pred.confidence.toUpperCase() === 'HIGH'
            );

            console.log(`📅 Loaded Week ${nextWeek} high confidence picks:`, nextWeekHighConfidence.length);
            setCurrentWeek(nextWeek);
            setPredictions(nextWeekHighConfidence);
            return;
          }
        }
      }

      // Show current week's high confidence picks (mix of upcoming and completed)
      setPredictions(highConfidencePicks);

    } catch (err) {
      console.error('❌ Error loading predictions:', err);
      setError('Failed to load predictions. Please try again.');
      setPredictions([]);
    } finally {
      setLoading(false);
    }
  };

  const loadHomepageStats = async () => {
    try {
      setStatsLoading(true);
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://statmindsports.com/api';
      const response = await fetch(`${apiUrl}/stats/homepage`);
      const data = await response.json();

      if (data.success) {
        setHomepageStats(data.stats);
        console.log('✅ Homepage stats loaded:', data.stats);
      }
    } catch (err) {
      console.error('❌ Error loading homepage stats:', err);
      // Keep default stats if API fails
    } finally {
      setStatsLoading(false);
    }
  };

  // Default fallback stats (used if API fails)
  const displayStats = homepageStats || {
    mainAccuracy: 79.7,
    accuracyLabel: "Proven Accuracy",
    firstSeason: 2024,
    provenSinceText: "Proven Accuracy Since 2024",
    gamesPredicted: 256,
    gamesPredictedText: "256+ Games Predicted",
    seasonsTracked: 2,
    seasonsTrackedText: "2+ Seasons Tracked"
  };

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-900 pt-2 pb-20 px-4">
        {/* Competition Banner */}
        <CompetitionHero />
        <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:50px_50px]"></div>
        <div className="max-w-7xl mx-auto relative">
          <div className="text-center mb-12">
            {/* Big Bold Year Badge */}
            <div className="mb-8">
              <h2 className="text-6xl md:text-8xl font-black bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
                2025
              </h2>
            </div>

            <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-white to-emerald-400 bg-clip-text text-transparent">
              NFL Predictions with
              <br />
              <span className="text-emerald-400">{displayStats.mainAccuracy}% Accuracy</span>
            </h1>
            <p className="text-xl text-slate-300 max-w-2xl mx-auto mb-8">
              Advanced data science meets NFL analytics. Get reliable game predictions powered by our proven 5-component algorithm.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/predictions"
                className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-3 px-8 rounded-lg transition"
              >
                View This Week's Picks
              </Link>
              <Link
                href="/accuracy"
                className="bg-slate-700 hover:bg-slate-600 text-white font-bold py-3 px-8 rounded-lg transition"
              >
                See Our Track Record
              </Link>
            </div>
          </div>

          {/* Stats Grid - First card now shows OVERALL accuracy */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <StatsCard
              title="Overall Accuracy"
              value={displayStats.overallAccuracy ? `${displayStats.overallAccuracy}%` : "88.6%"}
              subtitle={displayStats.overallVerifiedGames ? `${displayStats.overallVerifiedGames.toLocaleString()} verified games` : "1,431 verified games"}
              highlight
            />
            <StatsCard
              title="Total Predictions"
              value={displayStats.gamesPredicted ? displayStats.gamesPredicted.toLocaleString() : "1,615"}
              subtitle="Across all seasons"
            />
            <StatsCard
              title="Seasons Tracked"
              value={displayStats.seasonsTracked}
              subtitle={`Since ${displayStats.firstSeason}`}
            />
          </div>
        </div>
      </section>

      {/* This Week's Predictions */}
      <section className="py-16 px-4 bg-slate-950">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4">This Week's Top Picks</h2>
            <p className="text-slate-400 text-lg">
              Our <span className="text-emerald-400 font-semibold">high confidence</span> predictions for {currentWeek ? `Week ${currentWeek}` : 'the upcoming games'}
            </p>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
              <p className="mt-4 text-slate-400">Loading predictions...</p>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <p className="text-red-400 mb-4">{error}</p>
              <button
                onClick={loadPredictions}
                className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-2 px-6 rounded-lg transition"
              >
                Try Again
              </button>
            </div>
          ) : predictions.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-slate-400 text-lg mb-4">No predictions available yet.</p>
              <p className="text-slate-500">Check back soon for this week's picks!</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                {predictions.map((prediction) => (
                  <PredictionCard key={prediction.gameId} prediction={prediction} />
                ))}
              </div>
              <div className="text-center">
                <Link
                  href="/predictions"
                  className="inline-block bg-slate-800 hover:bg-slate-700 text-white font-bold py-3 px-8 rounded-lg transition"
                >
                  View All Predictions →
                </Link>
              </div>
            </>
          )}
        </div>
      </section>

      {/* How It Works Preview */}
      <section className="py-16 px-4 bg-gradient-to-b from-slate-950 to-slate-900">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold mb-6">Data-Driven Predictions</h2>
          <p className="text-xl text-slate-300 mb-8">
            Our 5-component algorithm analyzes Elo ratings, team rest, weather conditions,
            home advantage, and strength of schedule to deliver consistently accurate predictions.
          </p>
          <Link
            href="/how-it-works"
            className="inline-block bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-3 px-8 rounded-lg transition"
          >
            Learn How It Works
          </Link>
        </div>
      </section>
    </div>
  );
}