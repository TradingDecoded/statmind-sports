'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useRouter } from 'next/navigation';

export default function SMSBucksDisplay() {
  const { user } = useAuth();
  const router = useRouter();
  const [balance, setBalance] = useState(null);
  const [tier, setTier] = useState('free');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchBalance();
    } else {
      setLoading(false);
    }
  }, [user]);

  const fetchBalance = async () => {
    try {
      const token = localStorage.getItem('authToken');
      
      if (!token) {
        setLoading(false);
        return;
      }

      const response = await fetch('/api/sms-bucks/balance', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setBalance(data.balance);
        setTier(data.tier);
      }
    } catch (error) {
      console.error('Error fetching SMS Bucks balance:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClick = () => {
    if (tier === 'free') {
      // Free users go to upgrade page
      router.push('/upgrade');
    } else {
      // Premium/VIP users go to transaction history
      router.push('/sms-bucks/transactions');
    }
  };

  // Don't render if no user
  if (!user || loading || balance === null) {
    return null;
  }

  return (
    <button
      onClick={handleClick}
      className="flex items-center space-x-2 px-3 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-all duration-200 cursor-pointer group"
      title={tier === 'free' ? 'Upgrade to unlock SMS Bucks' : 'View transaction history'}
    >
      <span className="text-2xl group-hover:scale-110 transition-transform">💰</span>
      <span className="text-white font-bold">{balance}</span>
    </button>
  );
}