'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../contexts/AuthContext';

export default function AdminPage() {
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const [activeTab, setActiveTab] = useState('members');

  // Members management state
  const [members, setMembers] = useState([]);
  const [memberFilter, setMemberFilter] = useState('all');
  const [memberSearch, setMemberSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalMembers, setTotalMembers] = useState(0);
  const [loadingMembers, setLoadingMembers] = useState(false);

  // User detail modal state
  const [selectedMember, setSelectedMember] = useState(null);
  const [memberDetails, setMemberDetails] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  // User management action states
  const [adjustBucksAmount, setAdjustBucksAmount] = useState('');
  const [adjustBucksReason, setAdjustBucksReason] = useState('');
  const [newTier, setNewTier] = useState('');
  const [actionMessage, setActionMessage] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // Prediction weights state
  const [weights, setWeights] = useState({
    elo: 20,
    power: 20,
    situational: 20,
    matchup: 20,
    recentForm: 20
  });
  const [saveMessage, setSaveMessage] = useState('');

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
        if (activeTab === 'members') {
          fetchMembers();
        }
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

  // Fetch members list
  const fetchMembers = async () => {
    setLoadingMembers(true);
    const token = localStorage.getItem('authToken');

    try {
      const params = new URLSearchParams({
        page: currentPage,
        limit: 25
      });

      if (memberFilter !== 'all') {
        params.append('tier', memberFilter);
      }

      if (memberSearch) {
        params.append('search', memberSearch);
      }

      const response = await fetch(`/api/admin/management/members?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setMembers(data.users);
        setTotalPages(data.pagination.totalPages);
        setTotalMembers(data.pagination.totalUsers);
      }
    } catch (error) {
      console.error('Failed to fetch members:', error);
    } finally {
      setLoadingMembers(false);
    }
  };

  // Fetch detailed user info
  const fetchUserDetails = async (userId) => {
    setLoadingDetails(true);
    const token = localStorage.getItem('authToken');

    try {
      const response = await fetch(`/api/admin/management/members/${userId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setMemberDetails(data);
        setNewTier(data.user.membership_tier);
      }
    } catch (error) {
      console.error('Failed to fetch user details:', error);
      setActionMessage('❌ Failed to load user details');
    } finally {
      setLoadingDetails(false);
    }
  };

  // Open user detail modal
  const handleViewMember = (member) => {
    setSelectedMember(member);
    setMemberDetails(null);
    setActionMessage('');
    fetchUserDetails(member.id);
  };

  // Close user detail modal
  const handleCloseModal = () => {
    setSelectedMember(null);
    setMemberDetails(null);
    setAdjustBucksAmount('');
    setAdjustBucksReason('');
    setActionMessage('');
  };

  // Adjust SMS Bucks
  const handleAdjustBucks = async () => {
    if (!selectedMember || !adjustBucksAmount) {
      setActionMessage('⚠️ Please enter an amount');
      return;
    }

    const amount = parseInt(adjustBucksAmount);
    if (isNaN(amount) || amount === 0) {
      setActionMessage('⚠️ Amount must be a non-zero number');
      return;
    }

    setActionLoading(true);
    const token = localStorage.getItem('authToken');

    try {
      const response = await fetch(`/api/admin/management/members/${selectedMember.id}/adjust-bucks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          amount: amount,
          reason: adjustBucksReason || `Admin adjustment: ${amount > 0 ? '+' : ''}${amount} SMS Bucks`
        })
      });

      const data = await response.json();

      if (response.ok) {
        setActionMessage(`✅ ${data.message}`);
        // Refresh user details
        fetchUserDetails(selectedMember.id);
        // Refresh members list
        fetchMembers();
        // Clear form
        setAdjustBucksAmount('');
        setAdjustBucksReason('');
      } else {
        setActionMessage(`❌ ${data.error}`);
      }
    } catch (error) {
      setActionMessage('❌ Failed to adjust balance');
    } finally {
      setActionLoading(false);
    }
  };

  // Change membership tier
  const handleChangeTier = async () => {
    if (newTier === memberDetails.user.membership_tier) {
      setActionMessage('⚠️ User already has this tier');
      return;
    }

    setActionLoading(true);
    const token = localStorage.getItem('authToken');

    try {
      const response = await fetch(`/api/admin/management/members/${selectedMember.id}/change-tier`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ tier: newTier })
      });

      const data = await response.json();

      if (response.ok) {
        setActionMessage(`✅ ${data.message}`);
        fetchUserDetails(selectedMember.id);
        fetchMembers();
      } else {
        setActionMessage(`❌ ${data.error}`);
      }
    } catch (error) {
      setActionMessage('❌ Failed to change tier');
    } finally {
      setActionLoading(false);
    }
  };

  // Add free month
  const handleAddFreeMonth = async () => {
    if (memberDetails.user.membership_tier === 'free') {
      setActionMessage('❌ Cannot add free month to free tier users');
      return;
    }

    setActionLoading(true);
    const token = localStorage.getItem('authToken');

    try {
      const response = await fetch(`/api/admin/management/members/${selectedMember.id}/add-free-month`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (response.ok) {
        setActionMessage(`✅ ${data.message}`);
        fetchUserDetails(selectedMember.id);
      } else {
        setActionMessage(`❌ ${data.error}`);
      }
    } catch (error) {
      setActionMessage('❌ Failed to add free month');
    } finally {
      setActionLoading(false);
    }
  };

  // Cancel membership
  const handleCancelMembership = async () => {
    if (!confirm('Are you sure you want to cancel this membership? User will be downgraded to free tier.')) {
      return;
    }

    setActionLoading(true);
    const token = localStorage.getItem('authToken');

    try {
      const response = await fetch(`/api/admin/management/members/${selectedMember.id}/cancel-membership`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (response.ok) {
        setActionMessage(`✅ ${data.message}`);
        fetchUserDetails(selectedMember.id);
        fetchMembers();
      } else {
        setActionMessage(`❌ ${data.error}`);
      }
    } catch (error) {
      setActionMessage('❌ Failed to cancel membership');
    } finally {
      setActionLoading(false);
    }
  };

  // Trigger fetch when filter/search/page changes
  useEffect(() => {
    if (activeTab === 'members') {
      fetchMembers();
    }
  }, [memberFilter, memberSearch, currentPage, activeTab]);

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
        setSaveMessage('❌ Failed to save weights');
      }
    } catch (error) {
      console.error('Save weights error:', error);
      setSaveMessage('❌ Failed to save weights');
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
            onClick={() => setActiveTab('members')}
            className={`px-6 py-3 font-medium transition-all ${activeTab === 'members'
              ? 'text-emerald-400 border-b-2 border-emerald-400'
              : 'text-slate-400 hover:text-white'
              }`}
          >
            👥 Members
          </button>
          <button
            onClick={() => setActiveTab('weights')}
            className={`px-6 py-3 font-medium transition-all ${activeTab === 'weights'
              ? 'text-emerald-400 border-b-2 border-emerald-400'
              : 'text-slate-400 hover:text-white'
              }`}
          >
            ⚙️ Prediction Weights
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
                <span className={`text-2xl font-bold ${Math.abs(totalPercentage - 100) < 0.1 ?
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

        {/* ==================== MEMBERS TAB ==================== */}
        {activeTab === 'members' && (
          <div className="space-y-6">

            {/* Filters Bar */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

                {/* Tier Filter */}
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-2">
                    Filter by Tier
                  </label>
                  <select
                    value={memberFilter}
                    onChange={(e) => {
                      setMemberFilter(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white"
                  >
                    <option value="all">All Members</option>
                    <option value="free">Free Tier</option>
                    <option value="premium">Premium Tier</option>
                    <option value="vip">VIP Tier</option>
                  </select>
                </div>

                {/* Search */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-400 mb-2">
                    Search Members
                  </label>
                  <input
                    type="text"
                    placeholder="Search by username or email..."
                    value={memberSearch}
                    onChange={(e) => {
                      setMemberSearch(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white placeholder-slate-500"
                  />
                </div>
              </div>

              {/* Stats Summary */}
              <div className="mt-4 flex gap-4 text-sm">
                <span className="text-slate-400">
                  Showing <span className="text-white font-semibold">{members.length}</span> of{' '}
                  <span className="text-white font-semibold">{totalMembers}</span> members
                </span>
              </div>
            </div>

            {/* Members Table */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
              {loadingMembers ? (
                <div className="text-center py-12">
                  <div className="text-slate-400">Loading members...</div>
                </div>
              ) : members.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-slate-400">No members found</div>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-slate-800 border-b border-slate-700">
                      <tr>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">Member</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">Email</th>
                        <th className="px-6 py-4 text-center text-sm font-semibold text-slate-300">Tier</th>
                        <th className="px-6 py-4 text-center text-sm font-semibold text-slate-300">SMS Bucks</th>
                        <th className="px-6 py-4 text-center text-sm font-semibold text-slate-300">Parlays</th>
                        <th className="px-6 py-4 text-center text-sm font-semibold text-slate-300">Win Rate</th>
                        <th className="px-6 py-4 text-center text-sm font-semibold text-slate-300">Joined</th>
                        <th className="px-6 py-4 text-center text-sm font-semibold text-slate-300">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                      {members.map((member) => {
                        const winRate = member.total_parlays > 0
                          ? Math.round((member.total_wins / member.total_parlays) * 100)
                          : 0;

                        return (
                          <tr key={member.id} className="hover:bg-slate-800 transition">
                            <td className="px-6 py-4">
                              <div>
                                <div className="text-white font-medium">
                                  {member.display_name || member.username}
                                </div>
                                <div className="text-slate-400 text-sm">@{member.username}</div>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-slate-300 text-sm">{member.email}</td>
                            <td className="px-6 py-4 text-center">
                              <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${member.membership_tier === 'vip'
                                ? 'bg-purple-900 text-purple-200'
                                : member.membership_tier === 'premium'
                                  ? 'bg-emerald-900 text-emerald-200'
                                  : 'bg-slate-700 text-slate-300'
                                }`}>
                                {member.membership_tier.toUpperCase()}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-center">
                              <span className="text-emerald-400 font-semibold">{member.sms_bucks}</span>
                            </td>
                            <td className="px-6 py-4 text-center text-slate-300">
                              {member.total_parlays}
                            </td>
                            <td className="px-6 py-4 text-center">
                              <span className={`font-semibold ${winRate >= 60 ? 'text-green-400' :
                                winRate >= 40 ? 'text-yellow-400' :
                                  'text-red-400'
                                }`}>
                                {winRate}%
                              </span>
                            </td>
                            <td className="px-6 py-4 text-center text-slate-400 text-sm">
                              {new Date(member.created_at).toLocaleDateString()}
                            </td>
                            <td className="px-6 py-4 text-center">
                              <button
                                onClick={() => handleViewMember(member)}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition"
                              >
                                Manage
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
                <div className="flex justify-between items-center">
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className={`px-4 py-2 rounded-lg font-medium transition ${currentPage === 1
                      ? 'bg-slate-800 text-slate-600 cursor-not-allowed'
                      : 'bg-slate-800 text-white hover:bg-slate-700'
                      }`}
                  >
                    ← Previous
                  </button>

                  <span className="text-slate-400">
                    Page <span className="text-white font-semibold">{currentPage}</span> of{' '}
                    <span className="text-white font-semibold">{totalPages}</span>
                  </span>

                  <button
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className={`px-4 py-2 rounded-lg font-medium transition ${currentPage === totalPages
                      ? 'bg-slate-800 text-slate-600 cursor-not-allowed'
                      : 'bg-slate-800 text-white hover:bg-slate-700'
                      }`}
                  >
                    Next →
                  </button>
                </div>
              </div>
            )}
            {/* User Detail Modal */}
            {selectedMember && memberDetails && (
              <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">

                  {/* Modal Header */}
                  <div className="sticky top-0 bg-slate-900 border-b border-slate-700 p-6 flex justify-between items-center">
                    <div>
                      <h2 className="text-2xl font-bold text-white">
                        {memberDetails.user.display_name || memberDetails.user.username}
                      </h2>
                      <p className="text-slate-400">@{memberDetails.user.username}</p>
                    </div>
                    <button
                      onClick={handleCloseModal}
                      className="text-slate-400 hover:text-white text-2xl"
                    >
                      ✕
                    </button>
                  </div>

                  {/* Modal Content */}
                  <div className="p-6 space-y-6">

                    {/* User Info Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="bg-slate-800 rounded-lg p-4">
                        <p className="text-slate-400 text-sm mb-1">Membership Tier</p>
                        <p className={`text-lg font-bold ${memberDetails.user.membership_tier === 'vip' ? 'text-purple-400' :
                          memberDetails.user.membership_tier === 'premium' ? 'text-emerald-400' :
                            'text-slate-300'
                          }`}>
                          {memberDetails.user.membership_tier.toUpperCase()}
                        </p>
                      </div>
                      <div className="bg-slate-800 rounded-lg p-4">
                        <p className="text-slate-400 text-sm mb-1">SMS Bucks</p>
                        <p className="text-emerald-400 text-lg font-bold">{memberDetails.user.sms_bucks}</p>
                      </div>
                      <div className="bg-slate-800 rounded-lg p-4">
                        <p className="text-slate-400 text-sm mb-1">Member Since</p>
                        <p className="text-white text-lg font-bold">
                          {new Date(memberDetails.user.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="bg-slate-800 rounded-lg p-4">
                      <h3 className="text-white font-semibold mb-3">Parlay Statistics</h3>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                          <p className="text-slate-400 text-sm">Total Parlays</p>
                          <p className="text-white text-xl font-bold">{memberDetails.stats.total_parlays}</p>
                        </div>
                        <div>
                          <p className="text-slate-400 text-sm">Wins</p>
                          <p className="text-green-400 text-xl font-bold">{memberDetails.stats.total_wins}</p>
                        </div>
                        <div>
                          <p className="text-slate-400 text-sm">Losses</p>
                          <p className="text-red-400 text-xl font-bold">{memberDetails.stats.total_losses}</p>
                        </div>
                        <div>
                          <p className="text-slate-400 text-sm">Win Rate</p>
                          <p className="text-white text-xl font-bold">{memberDetails.stats.win_rate}%</p>
                        </div>
                      </div>
                    </div>

                    {/* Action Message */}
                    {actionMessage && (
                      <div className={`p-4 rounded-lg text-sm font-medium ${actionMessage.includes('✅')
                        ? 'bg-green-900/20 border border-green-500/30 text-green-400'
                        : 'bg-red-900/20 border border-red-500/30 text-red-400'
                        }`}>
                        {actionMessage}
                      </div>
                    )}

                    {/* Management Actions */}
                    <div className="space-y-4">

                      {/* Adjust SMS Bucks */}
                      <div className="bg-slate-800 rounded-lg p-4">
                        <h3 className="text-white font-semibold mb-3">Adjust SMS Bucks</h3>
                        <div className="space-y-3">
                          <input
                            type="number"
                            value={adjustBucksAmount}
                            onChange={(e) => setAdjustBucksAmount(e.target.value)}
                            placeholder="Amount (use - for deduction)"
                            className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white"
                          />
                          <input
                            type="text"
                            value={adjustBucksReason}
                            onChange={(e) => setAdjustBucksReason(e.target.value)}
                            placeholder="Reason for adjustment"
                            className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white"
                          />
                          <button
                            onClick={handleAdjustBucks}
                            disabled={actionLoading || !adjustBucksAmount}
                            className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-700 disabled:cursor-not-allowed text-white font-semibold py-2 rounded-lg transition"
                          >
                            {actionLoading ? 'Processing...' : 'Adjust Balance'}
                          </button>
                        </div>
                      </div>

                      {/* Change Tier */}
                      <div className="bg-slate-800 rounded-lg p-4">
                        <h3 className="text-white font-semibold mb-3">Change Membership Tier</h3>
                        <div className="space-y-3">
                          <select
                            value={newTier}
                            onChange={(e) => setNewTier(e.target.value)}
                            className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white"
                          >
                            <option value="free">Free</option>
                            <option value="premium">Premium</option>
                            <option value="vip">VIP</option>
                          </select>
                          <button
                            onClick={handleChangeTier}
                            disabled={actionLoading || newTier === memberDetails.user.membership_tier}
                            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-700 disabled:cursor-not-allowed text-white font-semibold py-2 rounded-lg transition"
                          >
                            {actionLoading ? 'Processing...' : 'Change Tier'}
                          </button>
                        </div>
                      </div>

                      {/* Add Free Month */}
                      <div className="bg-slate-800 rounded-lg p-4">
                        <h3 className="text-white font-semibold mb-3">Add Free Month</h3>
                        <p className="text-slate-400 text-sm mb-3">
                          Extends subscription by 30 days from current end date
                        </p>
                        <button
                          onClick={handleAddFreeMonth}
                          disabled={actionLoading || memberDetails.user.membership_tier === 'free'}
                          className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-slate-700 disabled:cursor-not-allowed text-white font-semibold py-2 rounded-lg transition"
                        >
                          {actionLoading ? 'Processing...' : 'Add 30 Days'}
                        </button>
                      </div>

                      {/* Cancel Membership */}
                      <div className="bg-slate-800 rounded-lg p-4 border border-red-500/30">
                        <h3 className="text-red-400 font-semibold mb-3">Danger Zone</h3>
                        <p className="text-slate-400 text-sm mb-3">
                          Cancel membership and downgrade user to free tier
                        </p>
                        <button
                          onClick={handleCancelMembership}
                          disabled={actionLoading || memberDetails.user.membership_tier === 'free'}
                          className="w-full bg-red-600 hover:bg-red-700 disabled:bg-slate-700 disabled:cursor-not-allowed text-white font-semibold py-2 rounded-lg transition"
                        >
                          {actionLoading ? 'Processing...' : 'Cancel Membership'}
                        </button>
                      </div>

                    </div>

                    {/* Recent Transactions */}
                    <div className="bg-slate-800 rounded-lg p-4">
                      <h3 className="text-white font-semibold mb-3">Recent SMS Bucks Transactions</h3>
                      {memberDetails.transactions.length === 0 ? (
                        <p className="text-slate-400 text-sm">No transactions yet</p>
                      ) : (
                        <div className="space-y-2 max-h-60 overflow-y-auto">
                          {memberDetails.transactions.map((tx) => (
                            <div key={tx.id} className="flex justify-between items-center py-2 border-b border-slate-700 last:border-0">
                              <div>
                                <p className="text-white text-sm font-medium">{tx.transaction_type}</p>
                                <p className="text-slate-400 text-xs">
                                  {new Date(tx.created_at).toLocaleString()}
                                </p>
                                {tx.description && (
                                  <p className="text-slate-400 text-xs italic">{tx.description}</p>
                                )}
                              </div>
                              <div className="text-right">
                                <p className={`font-bold ${tx.amount >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                  {tx.amount >= 0 ? '+' : ''}{tx.amount}
                                </p>
                                <p className="text-slate-500 text-xs">Balance: {tx.balance_after}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}