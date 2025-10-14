// frontend/src/app/page.js
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { fetchUpcomingPredictions } from '@/utils/api';
import PredictionCard from '@/components/PredictionCard';
import StatsCard from '@/components/StatsCard';

export default function HomePage() {
  const [predictions, setPredictions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    loadPredictions();
  }, []);
  
  const loadPredictions = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchUpcomingPredictions(6);
      setPredictions(data);
    } catch (err) {
      console.error('Error loading predictions:', err);
      setError('Failed to load predictions. Please try again later.');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-900 py-20 px-4">
        <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:50px_50px]"></div>
        <div className="max-w-7xl mx-auto relative">
          <div className="text-center mb-12">
            <div className="inline-block mb-6">
              <span className="px-4 py-2 bg-emerald-500/10 border border-emerald-500/30 rounded-full text-emerald-400 text-sm font-semibold">
                Proven Accuracy Since 2024
              </span>
            </div>
            <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-white to-emerald-400 bg-clip-text text-transparent">
              NFL Predictions with
              <br />
              <span className="text-emerald-400">79.7% Accuracy</span>
            </h1>
            <p className="text-xl text-slate-300 max-w-2xl mx-auto mb-8">
              Advanced data science meets NFL analytics. Get reliable game predictions powered by our proven 5-component algorithm.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link 
                href="/predictions"
                className="inline-flex items-center px-8 py-4 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg font-semibold transition-all duration-200 shadow-lg shadow-emerald-500/50"
              >
                View All Predictions
                <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Link>
              <Link 
                href="/accuracy"
                className="inline-flex items-center px-8 py-4 bg-slate-800 hover:bg-slate-700 text-white rounded-lg font-semibold transition-all duration-200 border border-slate-600"
              >
                See Our Track Record
              </Link>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <StatsCard
              title="Proven Accuracy"
              value="79.7%"
              subtitle="2024 Season"
              icon="🎯"
            />
            <StatsCard
              title="Games Predicted"
              value="256+"
              subtitle="Total Predictions"
              icon="📊"
            />
            <StatsCard
              title="Seasons Tracked"
              value="2+"
              subtitle="Historical Data"
              icon="📅"
            />
          </div>
        </div>
      </section>
      
      {/* This Week's Predictions */}
      <section className="py-16 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl md:text-4xl font-bold">This Week's Predictions</h2>
            <Link 
              href="/predictions"
              className="text-emerald-400 hover:text-emerald-300 font-semibold transition-colors"
            >
              View All →
            </Link>
          </div>
          
          {/* Loading State */}
          {loading && (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="relative">
                <div className="w-16 h-16 border-4 border-blue-200 border-t-emerald-500 rounded-full animate-spin"></div>
              </div>
              <p className="mt-6 text-slate-400 text-lg">Loading predictions...</p>
            </div>
          )}
          
          {/* Error State */}
          {error && !loading && (
            <div className="flex flex-col items-center justify-center py-20 px-4">
              <div className="text-6xl mb-6">⚠️</div>
              <h3 className="text-2xl font-bold text-white mb-3">Something went wrong</h3>
              <p className="text-slate-400 text-center max-w-md mb-6">{error}</p>
              <button
                onClick={loadPredictions}
                className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-3 px-6 rounded-lg transition"
              >
                Try Again
              </button>
            </div>
          )}
          
          {/* Empty State */}
          {!loading && !error && predictions.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 px-4">
              <div className="text-6xl mb-6">🔮</div>
              <h3 className="text-2xl font-bold text-white mb-3">No predictions available</h3>
              <p className="text-slate-400 text-center max-w-md">
                New predictions are generated every Tuesday. Check back soon for the latest NFL game predictions!
              </p>
            </div>
          )}
          
          {/* Success State - Show Predictions */}
          {!loading && !error && predictions.length > 0 && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                {predictions.map((prediction, idx) => (
                  <PredictionCard key={idx} prediction={prediction} />
                ))}
              </div>
              <div className="text-center">
                <Link 
                  href="/predictions"
                  className="inline-flex items-center px-6 py-3 bg-slate-800 hover:bg-slate-700 border border-slate-600 rounded-lg font-semibold transition-all duration-200"
                >
                  View All Predictions
                  <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </Link>
              </div>
            </>
          )}
        </div>
      </section>
      
      {/* CTA Section */}
      <section className="py-20 px-4 bg-gradient-to-r from-emerald-900/20 to-teal-900/20 border-y border-emerald-500/20">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold mb-4">
            Want to understand our methodology?
          </h2>
          <p className="text-slate-300 text-lg mb-8">
            Learn how we achieve 79.7% accuracy using advanced data science and a proven 5-component algorithm.
          </p>
          <Link 
            href="/how-it-works"
            className="inline-flex items-center px-8 py-4 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg font-semibold transition-all duration-200 shadow-lg shadow-emerald-500/50"
          >
            Explore Our Algorithm
            <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      </section>
    </div>
  );
}