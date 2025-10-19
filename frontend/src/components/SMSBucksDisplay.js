'use client';
import { useSMSBucks } from '../contexts/SMSBucksContext';
import { useRouter } from 'next/navigation';

export default function SMSBucksDisplay() {
  const { balance, tier, loading } = useSMSBucks();
  const router = useRouter();

  const handleClick = () => {
    if (tier === 'free') {
      router.push('/upgrade');
    } else {
      router.push('/sms-bucks/transactions');
    }
  };

  // Don't render if loading or no balance
  if (loading || balance === null) {
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