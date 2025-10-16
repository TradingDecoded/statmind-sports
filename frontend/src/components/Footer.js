// frontend/src/components/Footer.js
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function Footer() {
  const [stats, setStats] = useState(null);
  
  useEffect(() => {
    // Fetch homepage stats for footer
    const fetchStats = async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://statmindsports.com/api';
        const response = await fetch(`${apiUrl}/stats/homepage`);
        const data = await response.json();
        if (data.success) {
          setStats(data.stats);
        }
      } catch (err) {
        console.error('Error loading footer stats:', err);
      }
    };
    
    fetchStats();
  }, []);
  
  // Default fallback
  const displayAccuracy = stats?.mainAccuracy || 76.1;
  const displayLabel = stats?.accuracyLabel || '2025 Season';
  
  return (
    <footer className="bg-slate-900 border-t border-slate-800 mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Brand */}
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold">S</span>
              </div>
              <span className="text-white font-bold text-lg">StatMind Sports</span>
            </div>
            <p className="text-slate-400 text-sm">
              Advanced NFL predictions powered by data science and machine learning.
            </p>
            <div className="mt-4">
              <span className="inline-block px-3 py-1 bg-emerald-500/10 text-emerald-400 rounded-full text-sm font-semibold">
                {displayAccuracy}% Accuracy
              </span>
              <p className="text-slate-500 text-xs mt-1">{displayLabel}</p>
            </div>
          </div>
          
          {/* Quick Links */}
          <div>
            <h3 className="text-white font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li><Link href="/" className="text-slate-400 hover:text-emerald-400 transition-colors">Home</Link></li>
              <li><Link href="/predictions" className="text-slate-400 hover:text-emerald-400 transition-colors">Predictions</Link></li>
              <li><Link href="/results" className="text-slate-400 hover:text-emerald-400 transition-colors">Results</Link></li>
              <li><Link href="/accuracy" className="text-slate-400 hover:text-emerald-400 transition-colors">Accuracy</Link></li>
              <li><Link href="/how-it-works" className="text-slate-400 hover:text-emerald-400 transition-colors">How It Works</Link></li>
            </ul>
          </div>
          
          {/* Legal */}
          <div>
            <h3 className="text-white font-semibold mb-4">Information</h3>
            <p className="text-slate-400 text-sm mb-4">
              Predictions are for informational and entertainment purposes only. 
              Past performance does not guarantee future results.
            </p>
            <p className="text-slate-500 text-xs">
              © {new Date().getFullYear()} StatMind Sports. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}