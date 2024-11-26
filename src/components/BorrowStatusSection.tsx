import { BorrowStatusResponse } from '@/app/api/borrow-status/route';
import { useMonitorStore } from '@/store/monitorStore';
import { STATUS_REFRESH_INTERVAL } from '@/utils/constants';
import { getMarketName, getTokenName } from '@/utils/helpers';
import { useEffect, useState } from 'react';
import CloseButton from './CloseButton';
import FreshnessIndicator from './FreshnessIndicator';

export default function BorrowStatusSection({
  market,
  mint,
  onRemove,
}: {
  market: string;
  mint: string;
  onRemove: () => void;
}) {
  const [status, setStatus] = useState<BorrowStatusResponse | null>(null);
  const { addNotification } = useMonitorStore();

  const marketName = getMarketName(market);
  const tokenName = getTokenName(mint);

  const fetchStatus = async () => {
    try {
      const response = await fetch(
        `/api/borrow-status?market=${encodeURIComponent(market)}&mint=${encodeURIComponent(mint)}`
      );
      if (!response.ok) throw new Error('Failed to fetch borrow status');

      const data = await response.json();
      setStatus(data);

      // Check for underwater loans
      if (data.isBuyable) {
        addNotification(`${data.buyCap} ${getTokenName(mint)} are buyable in market ${marketName}`);
      }
    } catch {
      setStatus(null);
    }
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 60000); // Update every minute
    return () => clearInterval(interval);
  }, [market, mint]);

  return (
    <div className="bg-primary rounded-lg p-6 h-full">
      <div className="flex justify-between items-start mb-7">
        <div className="flex flex-row items-center gap-4">
          <h3 className="text-xl font-semibold text-white">Borrow Status</h3>
          {status && (
            <FreshnessIndicator
              timestamp={new Date(status.timestamp).getTime()}
              refreshInterval={STATUS_REFRESH_INTERVAL}
            />
          )}
        </div>
        <CloseButton onClick={onRemove} />
      </div>
      {status ? (
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-gray-400">Market</span>
            <span className="text-white font-mono">{marketName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Mint</span>
            <span className="text-white font-mono">{tokenName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Buyable</span>
            <span className={status.isBuyable ? 'text-green-400' : 'text-red-400'}>
              {status.isBuyable ? 'Yes' : 'No'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Buy Cap</span>
            <span className="text-white">{status.buyCap}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Last Update</span>
            <span className="text-gray-400">{new Date(status.timestamp).toLocaleTimeString()}</span>
          </div>
        </div>
      ) : (
        <div className="text-center py-4 text-gray-400">Loading...</div>
      )}
    </div>
  );
}
