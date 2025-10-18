'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { useRouter } from 'next/navigation';

export default function TransactionHistoryPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [transactions, setTransactions] = useState([]);
  const [balance, setBalance] = useState(0);
  const [tier, setTier] = useState('free');
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }
    fetchData();
  }, [user]);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('authToken');
      
      if (!token) {
        router.push('/login');
        return;
      }

      // Fetch balance
      const balanceRes = await fetch('/api/sms-bucks/balance', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (balanceRes.ok) {
        const balanceData = await balanceRes.json();
        setBalance(balanceData.balance);
        setTier(balanceData.tier);
      }

      // Fetch transactions
      const transRes = await fetch('/api/sms-bucks/transactions?limit=100', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (transRes.ok) {
        const transData = await transRes.json();
        setTransactions(transData.transactions || []);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filter transactions
  const filteredTransactions = transactions.filter(t => {
    if (filter === 'all') return true;
    if (filter === 'earned') return t.amount > 0;
    if (filter === 'spent') return t.amount < 0;
    return true;
  });

  // Paginate
  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage);
  const paginatedTransactions = filteredTransactions.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Get transaction icon
  const getTransactionIcon = (type) => {
    const icons = {
      'monthly_allowance': '📦',
      'daily_login': '🎁',
      'parlay_entry': '🎲',
      'parlay_win': '🏆',
      'share_bonus': '📤',
      'admin_adjustment': '⚙️'
    };
    return icons[type] || '💰';
  };

  // Get transaction color
  const getAmountColor = (amount) => {
    return amount > 0 ? 'text-green-400' : 'text-red-400';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 py-8 px-4">
      <div className="max-w-5xl mx-auto">
        
        {/* Header with Balance */}
        <div className="bg-gradient-to-r from-emerald-500 to-teal-600 rounded-2xl p-8 mb-8 shadow-xl">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">SMS Bucks</h1>
              <p className="text-emerald-100">Transaction History</p>
            </div>
            <div className="text-right">
              <div className="text-5xl font-bold text-white mb-1">
                💰 {balance}
              </div>
              <div className="inline-block px-4 py-1 bg-white/20 rounded-full text-white text-sm font-semibold uppercase">
                {tier} Tier
              </div>
            </div>
          </div>
        </div>

        {/* Filter Buttons */}
        <div className="flex gap-3 mb-6">
          <button
            onClick={() => { setFilter('all'); setCurrentPage(1); }}
            className={`px-6 py-2 rounded-lg font-medium transition-all ${
              filter === 'all' 
                ? 'bg-emerald-500 text-white shadow-lg' 
                : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
            }`}
          >
            All Transactions
          </button>
          <button
            onClick={() => { setFilter('earned'); setCurrentPage(1); }}
            className={`px-6 py-2 rounded-lg font-medium transition-all ${
              filter === 'earned' 
                ? 'bg-green-500 text-white shadow-lg' 
                : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
            }`}
          >
            💰 Earned
          </button>
          <button
            onClick={() => { setFilter('spent'); setCurrentPage(1); }}
            className={`px-6 py-2 rounded-lg font-medium transition-all ${
              filter === 'spent' 
                ? 'bg-red-500 text-white shadow-lg' 
                : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
            }`}
          >
            💸 Spent
          </button>
        </div>

        {/* Transactions List */}
        {paginatedTransactions.length === 0 ? (
          <div className="bg-slate-800 rounded-xl p-12 text-center">
            <div className="text-6xl mb-4">📭</div>
            <p className="text-slate-400 text-lg">No transactions yet</p>
          </div>
        ) : (
          <div className="bg-slate-800 rounded-xl overflow-hidden shadow-xl">
            {paginatedTransactions.map((transaction) => (
              <div
                key={transaction.id}
                className="border-b border-slate-700 last:border-b-0 p-5 hover:bg-slate-700/50 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4 flex-1">
                    <div className="text-3xl mt-1">
                      {getTransactionIcon(transaction.transaction_type)}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-white font-semibold mb-1">
                        {transaction.description}
                      </h3>
                      <div className="flex items-center gap-3 text-sm text-slate-400">
                        <span>{formatDate(transaction.created_at)}</span>
                        <span>•</span>
                        <span className="capitalize">
                          {transaction.transaction_type.replace(/_/g, ' ')}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className={`text-2xl font-bold ${getAmountColor(transaction.amount)}`}>
                      {transaction.amount > 0 ? '+' : ''}{transaction.amount}
                    </div>
                    <div className="text-xs text-slate-500 mt-1">
                      Balance: {transaction.balance_after}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-2 mt-8">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              ← Previous
            </button>
            
            <div className="flex gap-2">
              {[...Array(totalPages)].map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentPage(i + 1)}
                  className={`w-10 h-10 rounded-lg font-medium ${
                    currentPage === i + 1
                      ? 'bg-emerald-500 text-white'
                      : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                  }`}
                >
                  {i + 1}
                </button>
              ))}
            </div>

            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next →
            </button>
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
