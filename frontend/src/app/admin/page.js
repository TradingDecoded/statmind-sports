'use client';

import { useState, useEffect } from 'react';

export default function AdminPage() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [weights, setWeights] = useState({
    elo: 35,
    power: 15,
    situational: 25,
    matchup: 20,
    recentForm: 5
  });
  const [saveMessage, setSaveMessage] = useState('');

  // Check if already logged in
  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (token) {
      setIsLoggedIn(true);
      loadWeights(token);
    }
  }, []);

  // Load current weights
  const loadWeights = async (token) => {
    try {
      const response = await fetch('http://localhost:4000/api/admin/weights', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        const loadedWeights = {};
        data.forEach(item => {
          loadedWeights[item.weight_name] = parseFloat(item.weight_value) * 100;
        });
        setWeights(loadedWeights);
      }
    } catch (error) {
      console.error('Failed to load weights:', error);
    }
  };

  // Handle login
  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const response = await fetch('http://localhost:4000/api/admin/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem('adminToken', data.token);
        setIsLoggedIn(true);
        loadWeights(data.token);
      } else {
        setError(data.error || 'Login failed');
      }
    } catch (error) {
      setError('Connection error. Is the backend running?');
    }
  };

  // Handle weight change
  const handleWeightChange = (name, value) => {
    setWeights(prev => ({
      ...prev,
      [name]: parseFloat(value)
    }));
  };

  // Calculate total percentage
  const totalPercentage = Object.values(weights).reduce((sum, val) => sum + val, 0);

  // Save weights
  const handleSave = async () => {
    if (Math.abs(totalPercentage - 100) > 0.1) {
      setSaveMessage('⚠️ Weights must total 100%');
      return;
    }

    const token = localStorage.getItem('adminToken');
    
    // Convert percentages to decimals
    const weightsDecimal = {};
    Object.entries(weights).forEach(([key, value]) => {
      weightsDecimal[key] = value / 100;
    });

    try {
      const response = await fetch('http://localhost:4000/api/admin/weights', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ weights: weightsDecimal }),
      });

      const data = await response.json();

      if (response.ok) {
        setSaveMessage('✅ Weights saved successfully!');
        setTimeout(() => setSaveMessage(''), 3000);
      } else {
        setSaveMessage(`❌ ${data.error}`);
      }
    } catch (error) {
      setSaveMessage('❌ Failed to save weights');
    }
  };

  // Logout
  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    setIsLoggedIn(false);
    setUsername('');
    setPassword('');
  };

  // Login form
  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 w-full max-w-md">
          <h1 className="text-3xl font-bold text-white mb-6 text-center">
            Admin Login
          </h1>
          
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-slate-300 mb-2">Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-emerald-500"
                required
              />
            </div>
            
            <div>
              <label className="block text-slate-300 mb-2">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-emerald-500"
                required
              />
            </div>

            {error && (
              <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-3 text-red-400 text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 rounded-lg transition"
            >
              Login
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Admin dashboard
  return (
    <div className="min-h-screen bg-slate-950 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 mb-6">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold text-white">
              Admin Dashboard
            </h1>
            <button
              onClick={handleLogout}
              className="bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-lg transition"
            >
              Logout
            </button>
          </div>
        </div>

        {/* Weight Sliders */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 mb-6">
          <h2 className="text-2xl font-bold text-white mb-6">
            Prediction Weight Configuration
          </h2>

          <div className="space-y-6">
            {/* Elo Weight */}
            <div>
              <div className="flex justify-between mb-2">
                <label className="text-slate-300 font-medium">Elo Rating</label>
                <span className="text-emerald-400 font-bold">{weights.elo.toFixed(1)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="50"
                step="0.5"
                value={weights.elo}
                onChange={(e) => handleWeightChange('elo', e.target.value)}
                className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-500"
              />
              <p className="text-sm text-slate-400 mt-1">Team strength based on historical performance</p>
            </div>

            {/* Power Weight */}
            <div>
              <div className="flex justify-between mb-2">
                <label className="text-slate-300 font-medium">Power Score</label>
                <span className="text-emerald-400 font-bold">{weights.power.toFixed(1)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="50"
                step="0.5"
                value={weights.power}
                onChange={(e) => handleWeightChange('power', e.target.value)}
                className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-500"
              />
              <p className="text-sm text-slate-400 mt-1">Offensive and defensive capabilities</p>
            </div>

            {/* Situational Weight */}
            <div>
              <div className="flex justify-between mb-2">
                <label className="text-slate-300 font-medium">Situational Score</label>
                <span className="text-emerald-400 font-bold">{weights.situational.toFixed(1)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="50"
                step="0.5"
                value={weights.situational}
                onChange={(e) => handleWeightChange('situational', e.target.value)}
                className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-500"
              />
              <p className="text-sm text-slate-400 mt-1">Home/away performance advantages</p>
            </div>

            {/* Matchup Weight */}
            <div>
              <div className="flex justify-between mb-2">
                <label className="text-slate-300 font-medium">Matchup Score</label>
                <span className="text-emerald-400 font-bold">{weights.matchup.toFixed(1)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="50"
                step="0.5"
                value={weights.matchup}
                onChange={(e) => handleWeightChange('matchup', e.target.value)}
                className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-500"
              />
              <p className="text-sm text-slate-400 mt-1">Head-to-head performance analysis</p>
            </div>

            {/* Recent Form Weight */}
            <div>
              <div className="flex justify-between mb-2">
                <label className="text-slate-300 font-medium">Recent Form</label>
                <span className="text-emerald-400 font-bold">{weights.recentForm.toFixed(1)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="50"
                step="0.5"
                value={weights.recentForm}
                onChange={(e) => handleWeightChange('recentForm', e.target.value)}
                className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-500"
              />
              <p className="text-sm text-slate-400 mt-1">Recent game performance trends</p>
            </div>
          </div>

          {/* Total Display */}
          <div className="mt-8 p-4 bg-slate-800 rounded-lg border-2 border-slate-700">
            <div className="flex justify-between items-center">
              <span className="text-lg font-semibold text-white">Total Weight:</span>
              <span className={`text-2xl font-bold ${
                Math.abs(totalPercentage - 100) < 0.1 ? 'text-emerald-400' : 'text-red-400'
              }`}>
                {totalPercentage.toFixed(1)}%
              </span>
            </div>
            {Math.abs(totalPercentage - 100) > 0.1 && (
              <p className="text-red-400 text-sm mt-2">
                ⚠️ Weights must total exactly 100%
              </p>
            )}
          </div>

          {/* Save Button */}
          <div className="mt-6 flex gap-4 items-center">
            <button
              onClick={handleSave}
              disabled={Math.abs(totalPercentage - 100) > 0.1}
              className="bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-700 disabled:cursor-not-allowed text-white font-semibold px-8 py-3 rounded-lg transition"
            >
              Save Changes
            </button>
            
            {saveMessage && (
              <span className="text-sm font-medium">{saveMessage}</span>
            )}
          </div>
        </div>

        {/* Instructions */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
          <h3 className="text-lg font-bold text-white mb-3">📌 Instructions</h3>
          <ul className="text-slate-300 space-y-2 text-sm">
            <li>• Adjust sliders to change the weight of each prediction component</li>
            <li>• All weights must sum to exactly 100%</li>
            <li>• Changes save immediately and affect future predictions</li>
            <li>• Higher weights give more importance to that metric</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
