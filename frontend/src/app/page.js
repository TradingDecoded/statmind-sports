// frontend/src/app/page.js

import Link from 'next/link';
import { fetchUpcomingPredictions } from '@/utils/api';
import PredictionCard from '@/components/PredictionCard';
import StatsCard from '@/components/StatsCard';

export default async function HomePage() {
  const predictions = await fetchUpcomingPredictions(6);
  
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
                className="px-8 py-4 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg font-semibold transition-all duration-200 shadow-lg shadow-emerald-500/50 hover:shadow-emerald-500/70"
              >
                View All Predictions
              </Link>
              <Link 
                href="/how-it-works"
                className="px-8 py-4 bg-slate-800 hover:bg-slate-700 border border-slate-600 text-white rounded-lg font-semibold transition-all duration-200"
              >
                How It Works
              </Link>
            </div>
          </div>
          
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16">
            <StatsCard
              title="Overall Accuracy"
              value="79.7%"
              subtitle="2024 Season Performance"
              icon={
                <svg className="w-6 h-6 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              }
            />
            <StatsCard
              title="Total Predictions"
              value="256"
              subtitle="Games Analyzed in 2024"
              icon={
                <svg className="w-6 h-6 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              }
            />
            <StatsCard
              title="High Confidence"
              value="68%"
              subtitle="Predictions with >75% certainty"
              icon={
                <svg className="w-6 h-6 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              }
            />
          </div>
        </div>
      </section>
      
      {/* Upcoming Predictions */}
      <section className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4">Upcoming Predictions</h2>
            <p className="text-slate-400 text-lg">
              See what our algorithm predicts for the next NFL games
            </p>
          </div>
          
          {predictions.length > 0 ? (
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
          ) : (
            <div className="text-center py-12">
              <p className="text-slate-400 text-lg">
                No upcoming predictions available. Check back soon!
              </p>
            </div>
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