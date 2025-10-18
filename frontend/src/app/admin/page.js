'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../contexts/AuthContext';

export default function AdminPage() {
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const [activeTab, setActiveTab] = useState('weights');
  
  // Prediction weights state
  const [weights, setWeights] = useState({
    elo: 20,
    power: 20,
    situational: 20,
    matchup: 20,
    recentForm: 20
  });
  const [saveMessage, setSaveMessage] = useState('');

  // SMS Bucks management state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [adjustAmount, setAdjustAmount] = useState('');
  const [transactionType, setTransactionType] = useState('admin_adjustment');
  const [description, setDescription] = useState('');
  const [adjustMessage, setAdjustMessage] = useState('');

  // Check if user is admin
  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        // Not logged in, redirect to login
        router.push('/login?redirect=/admin');
      } else if (!user.is_admin) {
        // Logged in but not admin
        router.push('/');
      } else {
        // User is admin, fetch weights
        fetchWeights();
      }
    }
  }, [user, isLoading, router]);

  // Fetch current weights
  const fetchWeights = async () => {
    const token = localStorage.getItem('authToken');
    
    try {
      const response = await fetch('/api/admin/weights', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        const weightsObj = {};
        data.forEach(w => {
          weightsObj[w.weight_name] = w.weight_value * 100;
        });
        setWeights(weightsObj);
      }
    } catch (error) {
      console.error('Failed to fetch weights:', error);
    }
  };

  // Weight change handler
  const handleWeightChange = (name, value) => {
    setWeights(prev => ({
      ...prev,
      [name]: parseFloat(value)
    }));
  };

  // Calculate total percentage
  const totalPercentage = Object.values(weights).reduce((sum, val) => sum + val, 0);

  // Save weights
  const handleSaveWeights = async () => {
    if (Math.abs(totalPercentage - 100) > 0.1) {
      setSaveMessage('⚠️ Weights must total 100%');
      return;
    }

    const token = localStorage.getItem('authToken');
    
    const weightsDecimal = {};
    Object.entries(weights).forEach(([key, value]) => {
      weightsDecimal[key] = value / 100;
    });

    try {
      const response = await fetch('/api/admin/weights', {
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

  // Search users
  const handleSearchUsers = async (query) => {
    setSearchQuery(query);
    
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }

    const token = localStorage.getItem('authToken');

    try {
      const response = await fetch(`/api/admin/management/users/search?query=${encodeURIComponent(query)}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (response.ok) {
        setSearchResults(data.users);
      }
    } catch (error) {
      console.error('Search failed:', error);
    }
  };

  // Select user for management
  const handleSelectUser = async (user) => {
    setSelectedUser(user);
    setSearchResults([]);
    setSearchQuery('');
  };

  // Adjust SMS Bucks
  const handleAdjustBucks = async () => {
    if (!selectedUser || !adjustAmount) {
      setAdjustMessage('⚠️ Please enter an amount');
      return;
    }

    const amount = parseInt(adjustAmount);
    if (isNaN(amount) || amount === 0) {
      setAdjustMessage('⚠️ Amount must be a non-zero number');
      return;
    }

    const token = localStorage.getItem('authToken');

    try {
      const response = await fetch(`/api/admin/management/users/${selectedUser.id}/adjust-bucks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          amount: amount,
          type: transactionType,
          description: description || `Admin adjustment: ${amount > 0 ? '+' : ''}${amount} SMS Bucks`
        })
      });

      const data = await response.json();

      if (response.ok) {
        setAdjustMessage(`✅ Balance updated! New balance: ${data.newBalance} SMS Bucks`);
        setSelectedUser({ ...selectedUser, sms_bucks: data.newBalance });
        setAdjustAmount('');
        setDescription('');
        setTimeout(() => setAdjustMessage(''), 3000);
      } else {
        setAdjustMessage(`❌ ${data.error}`);
      }
    } catch (error) {
      setAdjustMessage('❌ Failed to adjust balance');
    }
  };

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  // If not admin, don't render (redirect happens in useEffect)
  if (!user || !user.is_admin) {
    return null;
  }

  // Admin dashboard
  return (
    <div className="min-h-screen bg-slate-950 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-white">
                Admin Dashboard
              </h1>
              <p className="text-slate-400 mt-1">Welcome back, {user.displayName || user.username}</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b border-slate-700">
          <button
            onClick={() => setActiveTab('weights')}
            className={`px-6 py-3 font-medium transition-all ${
              activeTab === 'weights'
                ? 'text-emerald-400 border-b-2 border-emerald-400'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            ⚙️ Prediction Weights
          </button>
          <button
            onClick={() => setActiveTab('smsbucks')}
            className={`px-6 py-3 font-medium transition-all ${
              activeTab === 'smsbucks'
                ? 'text-emerald-400 border-b-2 border-emerald-400'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            💰 SMS Bucks Management
          </button>
        </div>

        {/* Prediction Weights Tab */}
        {activeTab === 'weights' && (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
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
                  Math.abs(totalPercentage - 100) < 0.1 ?
                  'text-emerald-400' : 'text-red-400'
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
                onClick={handleSaveWeights}
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
        )}

        {/* SMS Bucks Management Tab */}
        {activeTab === 'smsbucks' && (
          <div className="space-y-6">
            {/* Search Section */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
              <h2 className="text-2xl font-bold text-white mb-4">
                Search Users
              </h2>
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => handleSearchUsers(e.target.value)}
                  placeholder="Search by email or username..."
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-emerald-500"
                />
                
                {/* Search Results Dropdown */}
                {searchResults.length > 0 && (
                  <div className="absolute z-10 w-full mt-2 bg-slate-800 border border-slate-700 rounded-lg shadow-xl max-h-64 overflow-y-auto">
                    {searchResults.map(user => (
                      <button
                        key={user.id}
                        onClick={() => handleSelectUser(user)}
                        className="w-full px-4 py-3 text-left hover:bg-slate-700 transition border-b border-slate-700 last:border-b-0"
                      >
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="text-white font-medium">{user.username}</p>
                            <p className="text-slate-400 text-sm">{user.email}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-emerald-400 font-bold">{user.sms_bucks} SMS Bucks</p>
                            <p className="text-slate-400 text-sm capitalize">{user.membership_tier}</p>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Selected User Management */}
            {selectedUser && (
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                <h2 className="text-2xl font-bold text-white mb-4">
                  Manage: {selectedUser.username}
                </h2>

                {/* User Info */}
                <div className="bg-slate-800 rounded-lg p-4 mb-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-slate-400 text-sm">Email</p>
                      <p className="text-white font-medium">{selectedUser.email}</p>
                    </div>
                    <div>
                      <p className="text-slate-400 text-sm">Current Balance</p>
                      <p className="text-emerald-400 text-xl font-bold">{selectedUser.sms_bucks} SMS Bucks</p>
                    </div>
                    <div>
                      <p className="text-slate-400 text-sm">Membership Tier</p>
                      <p className="text-white font-medium capitalize">{selectedUser.membership_tier}</p>
                    </div>
                    <div>
                      <p className="text-slate-400 text-sm">User ID</p>
                      <p className="text-white font-medium">#{selectedUser.id}</p>
                    </div>
                  </div>
                </div>

                {/* Adjust Balance Form */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-slate-300 mb-2 font-medium">Amount (use negative for deduction)</label>
                    <input
                      type="number"
                      value={adjustAmount}
                      onChange={(e) => setAdjustAmount(e.target.value)}
                      placeholder="e.g., 100 or -50"
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 mb-2 font-medium">Transaction Type</label>
                    <select
                      value={transactionType}
                      onChange={(e) => setTransactionType(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-emerald-500"
                    >
                      <option value="admin_adjustment">Admin Adjustment</option>
                      <option value="bonus">Bonus</option>
                      <option value="correction">Correction</option>
                      <option value="compensation">Compensation</option>
                      <option value="refund">Refund</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-300 mb-2 font-medium">Description (optional)</label>
                    <input
                      type="text"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Reason for adjustment..."
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <button
                    onClick={handleAdjustBucks}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 rounded-lg transition"
                  >
                    Adjust Balance
                  </button>

                  {adjustMessage && (
                    <div className={`p-3 rounded-lg text-sm font-medium ${
                      adjustMessage.includes('✅') 
                        ? 'bg-green-900/20 border border-green-500/30 text-green-400'
                        : 'bg-red-900/20 border border-red-500/30 text-red-400'
                    }`}>
                      {adjustMessage}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}