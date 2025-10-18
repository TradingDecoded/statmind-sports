'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useRouter } from 'next/navigation';

export default function SettingsPage() {
  const { user, logout } = useAuth();
  const router = useRouter();
  
  // User data
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [email, setEmail] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // Membership info
  const [membershipTier, setMembershipTier] = useState('free');
  const [smsBucks, setSmsBucks] = useState(0);
  
  // UI state
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [activeTab, setActiveTab] = useState('profile');

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }
    fetchUserData();
  }, [user]);

  const fetchUserData = async () => {
    try {
      const token = localStorage.getItem('authToken');
      
      if (!token) {
        router.push('/login');
        return;
      }

      // Get user profile
      const profileRes = await fetch('/api/auth/me', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (profileRes.ok) {
        const data = await profileRes.json();
        setDisplayName(data.user.display_name || '');
        setBio(data.user.bio || '');
        setEmail(data.user.email || '');
        setMembershipTier(data.user.membership_tier || 'free');
      }

      // Get SMS Bucks balance
      const balanceRes = await fetch('/api/sms-bucks/balance', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (balanceRes.ok) {
        const balanceData = await balanceRes.json();
        setSmsBucks(balanceData.balance);
      }

    } catch (error) {
      console.error('Error fetching user data:', error);
      setMessage({ type: 'error', text: 'Failed to load settings' });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    setMessage({ type: '', text: '' });

    try {
      const token = localStorage.getItem('authToken');
      
      const response = await fetch('/api/auth/update-profile', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          display_name: displayName,
          bio: bio
        })
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({ type: 'success', text: 'Profile updated successfully!' });
        setTimeout(() => setMessage({ type: '', text: '' }), 3000);
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to update profile' });
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      setMessage({ type: 'error', text: 'Failed to update profile' });
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      setMessage({ type: 'error', text: 'New passwords do not match' });
      return;
    }

    if (newPassword.length < 8) {
      setMessage({ type: 'error', text: 'Password must be at least 8 characters' });
      return;
    }

    setSaving(true);
    setMessage({ type: '', text: '' });

    try {
      const token = localStorage.getItem('authToken');
      
      const response = await fetch('/api/auth/change-password', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          currentPassword,
          newPassword
        })
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({ type: 'success', text: 'Password changed successfully!' });
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setTimeout(() => setMessage({ type: '', text: '' }), 3000);
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to change password' });
      }
    } catch (error) {
      console.error('Error changing password:', error);
      setMessage({ type: 'error', text: 'Failed to change password' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 flex items-center justify-center">
        <div className="text-white text-xl">Loading settings...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Settings</h1>
          <p className="text-slate-400">Manage your account and preferences</p>
        </div>

        {/* Message Display */}
        {message.text && (
          <div className={`mb-6 p-4 rounded-lg ${
            message.type === 'success' ? 'bg-green-500/20 border border-green-500 text-green-400' : 'bg-red-500/20 border border-red-500 text-red-400'
          }`}>
            {message.text}
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b border-slate-700">
          <button
            onClick={() => setActiveTab('profile')}
            className={`px-6 py-3 font-medium transition-all ${
              activeTab === 'profile'
                ? 'text-emerald-400 border-b-2 border-emerald-400'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            👤 Profile
          </button>
          <button
            onClick={() => setActiveTab('security')}
            className={`px-6 py-3 font-medium transition-all ${
              activeTab === 'security'
                ? 'text-emerald-400 border-b-2 border-emerald-400'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            🔒 Security
          </button>
          <button
            onClick={() => setActiveTab('membership')}
            className={`px-6 py-3 font-medium transition-all ${
              activeTab === 'membership'
                ? 'text-emerald-400 border-b-2 border-emerald-400'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            💎 Membership
          </button>
        </div>

        {/* Profile Tab */}
        {activeTab === 'profile' && (
          <div className="bg-slate-800 rounded-xl p-8">
            <h2 className="text-2xl font-bold text-white mb-6">Profile Information</h2>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Display Name
                </label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Enter your display name"
                  className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Bio
                </label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Tell us about yourself..."
                  rows={4}
                  className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  disabled
                  className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-slate-400 cursor-not-allowed"
                />
                <p className="text-xs text-slate-500 mt-1">Email cannot be changed</p>
              </div>

              <button
                onClick={handleSaveProfile}
                disabled={saving}
                className="w-full bg-emerald-500 text-white py-3 rounded-lg font-semibold hover:bg-emerald-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? 'Saving...' : 'Save Profile'}
              </button>
            </div>
          </div>
        )}

        {/* Security Tab */}
        {activeTab === 'security' && (
          <div className="bg-slate-800 rounded-xl p-8">
            <h2 className="text-2xl font-bold text-white mb-6">Change Password</h2>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Current Password
                </label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Enter current password"
                  className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  New Password
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password (min 8 characters)"
                  className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                  className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <button
                onClick={handleChangePassword}
                disabled={saving || !currentPassword || !newPassword || !confirmPassword}
                className="w-full bg-emerald-500 text-white py-3 rounded-lg font-semibold hover:bg-emerald-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? 'Changing Password...' : 'Change Password'}
              </button>
            </div>
          </div>
        )}

        {/* Membership Tab */}
        {activeTab === 'membership' && (
          <div className="bg-slate-800 rounded-xl p-8">
            <h2 className="text-2xl font-bold text-white mb-6">Membership & SMS Bucks</h2>
            
            <div className="space-y-6">
              {/* Current Tier */}
              <div className="bg-slate-700 rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-1">Current Tier</h3>
                    <p className="text-slate-400">Your membership level</p>
                  </div>
                  <span className={`px-4 py-2 rounded-lg font-bold text-sm uppercase ${
                    membershipTier === 'vip' 
                      ? 'bg-amber-600 text-white' 
                      : membershipTier === 'premium' 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-slate-600 text-slate-300'
                  }`}>
                    {membershipTier === 'vip' && '👑 VIP'}
                    {membershipTier === 'premium' && '🏆 PREMIUM'}
                    {membershipTier === 'free' && '🆓 FREE'}
                  </span>
                </div>
              </div>

              {/* SMS Bucks Balance */}
              <div className="bg-gradient-to-r from-emerald-500 to-teal-600 rounded-lg p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-1">SMS Bucks Balance</h3>
                    <p className="text-emerald-100">Your virtual currency</p>
                  </div>
                  <div className="text-4xl font-bold text-white">
                    💰 {smsBucks}
                  </div>
                </div>
                <button
                  onClick={() => router.push(membershipTier === 'free' ? '/upgrade' : '/sms-bucks/transactions')}
                  className="mt-4 w-full bg-white text-emerald-600 py-2 rounded-lg font-semibold hover:bg-emerald-50 transition-colors"
                >
                  {membershipTier === 'free' ? 'Upgrade to Get SMS Bucks' : 'View Transaction History'}
                </button>
              </div>

              {/* Upgrade Options */}
              {membershipTier === 'free' && (
                <div className="bg-slate-700 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-white mb-3">Unlock Premium Features</h3>
                  <p className="text-slate-300 mb-4">
                    Upgrade to Premium or VIP to get monthly SMS Bucks, enter parlays, and compete for cash prizes!
                  </p>
                  <button
                    onClick={() => router.push('/upgrade')}
                    className="w-full bg-emerald-500 text-white py-3 rounded-lg font-semibold hover:bg-emerald-600 transition-colors"
                  >
                    View Upgrade Options
                  </button>
                </div>
              )}

              {/* Tier Benefits */}
              <div className="bg-slate-700 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Your Benefits</h3>
                <div className="space-y-3">
                  {membershipTier === 'free' && (
                    <>
                      <div className="flex items-start gap-3">
                        <span className="text-green-400 text-xl">✓</span>
                        <span className="text-slate-300">View AI predictions</span>
                      </div>
                      <div className="flex items-start gap-3">
                        <span className="text-green-400 text-xl">✓</span>
                        <span className="text-slate-300">Browse leaderboards</span>
                      </div>
                      <div className="flex items-start gap-3">
                        <span className="text-red-400 text-xl">✗</span>
                        <span className="text-slate-500">No SMS Bucks or parlays</span>
                      </div>
                    </>
                  )}
                  {membershipTier === 'premium' && (
                    <>
                      <div className="flex items-start gap-3">
                        <span className="text-yellow-400 text-xl">★</span>
                        <span className="text-white">300 SMS Bucks/month</span>
                      </div>
                      <div className="flex items-start gap-3">
                        <span className="text-yellow-400 text-xl">★</span>
                        <span className="text-white">Daily login bonus (+5)</span>
                      </div>
                      <div className="flex items-start gap-3">
                        <span className="text-yellow-400 text-xl">★</span>
                        <span className="text-white">10 parlays per week</span>
                      </div>
                      <div className="flex items-start gap-3">
                        <span className="text-yellow-400 text-xl">★</span>
                        <span className="text-white">Win rewards (+25 per win)</span>
                      </div>
                    </>
                  )}
                  {membershipTier === 'vip' && (
                    <>
                      <div className="flex items-start gap-3">
                        <span className="text-yellow-300 text-xl">★</span>
                        <span className="text-white">750 SMS Bucks/month</span>
                      </div>
                      <div className="flex items-start gap-3">
                        <span className="text-yellow-300 text-xl">★</span>
                        <span className="text-white">Daily login bonus (+10)</span>
                      </div>
                      <div className="flex items-start gap-3">
                        <span className="text-yellow-300 text-xl">★</span>
                        <span className="text-white">UNLIMITED parlays</span>
                      </div>
                      <div className="flex items-start gap-3">
                        <span className="text-yellow-300 text-xl">★</span>
                        <span className="text-white">Win rewards (+50 per win)</span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Back Button */}
        <div className="mt-8 text-center">
          <button
            onClick={() => router.push('/')}
            className="text-slate-400 hover:text-white transition-colors"
          >
            ← Back to Dashboard
          </button>
        </div>

      </div>
    </div>
  );
}
