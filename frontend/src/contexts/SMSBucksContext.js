'use client';
import { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';

const SMSBucksContext = createContext();

export function SMSBucksProvider({ children }) {
  const { user } = useAuth();
  const [balance, setBalance] = useState(null);
  const [tier, setTier] = useState('free');
  const [loading, setLoading] = useState(true);

  // Fetch balance when user changes
  useEffect(() => {
    if (user) {
      fetchBalance();
    } else {
      setBalance(null);
      setTier('free');
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

  // Function to refresh balance (call after transactions)
  const refreshBalance = () => {
    fetchBalance();
  };

  // Function to update balance locally (optimistic update)
  const updateBalance = (newBalance) => {
    setBalance(newBalance);
  };

  return (
    <SMSBucksContext.Provider value={{ 
      balance, 
      tier, 
      loading, 
      refreshBalance,
      updateBalance 
    }}>
      {children}
    </SMSBucksContext.Provider>
  );
}

export function useSMSBucks() {
  const context = useContext(SMSBucksContext);
  if (!context) {
    throw new Error('useSMSBucks must be used within SMSBucksProvider');
  }
  return context;
}
