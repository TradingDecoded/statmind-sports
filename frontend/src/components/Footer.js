import Link from 'next/link';
// frontend/src/components/Footer.js

export default function Footer() {
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
                79.7% Accuracy
              </span>
            </div>
          </div>
          
          {/* Quick Links */}
          <div>
            <h3 className="text-white font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li><a href="/" className="text-slate-400 hover:text-emerald-400 transition-colors">Home</a></li>
              <li><a href="/predictions" className="text-slate-400 hover:text-emerald-400 transition-colors">Predictions</a></li>
              <li><a href="/accuracy" className="text-slate-400 hover:text-emerald-400 transition-colors">Accuracy</a></li>
              <li><a href="/how-it-works" className="text-slate-400 hover:text-emerald-400 transition-colors">How It Works</a></li>
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