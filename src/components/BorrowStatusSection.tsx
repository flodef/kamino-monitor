import { useMonitorStore } from '@/store/monitorStore';
import { STATUS_REFRESH_INTERVAL } from '@/utils/constants';
import { getMarketName, getTokenName } from '@/utils/helpers';
import { useEffect, useState } from 'react';
import CloseButton from './CloseButton';
import FreshnessIndicator from './FreshnessIndicator';
import { BorrowStatusResponse } from '@/app/api/borrow-status/route';

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
  const [error, setError] = useState<string | null>(null);
  const { addNotification, updateBorrowStatus, removeBorrowStatus, borrowStatuses } =
    useMonitorStore();

  const marketName = getMarketName(market);
  const tokenName = getTokenName(mint);
  const statusKey = `${market}-${mint}`;

  // Load stored status on mount
  useEffect(() => {
    const storedStatus = borrowStatuses[statusKey];
    if (storedStatus) {
      setStatus(storedStatus);
    }
  }, [statusKey, borrowStatuses]);

  const fetchStatus = async () => {
    try {
      const response = await fetch(
        `/api/borrow-status?market=${encodeURIComponent(market)}&mint=${encodeURIComponent(mint)}`
      );
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch borrow status');
      }

      const borrowStatus = await response.json();
      setStatus(borrowStatus);
      updateBorrowStatus(statusKey, borrowStatus);

      // Check for underwater loans
      if (borrowStatus.isBuyable) {
        addNotification(
          `${borrowStatus.buyCap} ${getTokenName(mint)} are buyable in market ${marketName}`
        );
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to fetch borrow status');
    }
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 60000); // Update every minute
    return () => {
      clearInterval(interval);
      removeBorrowStatus(statusKey);
    };
  }, [market, mint]);

  return (
    <div className="flex flex-col bg-primary rounded-lg p-6 h-full">
      <div className="flex justify-between items-start mb-7">
        <div className="flex flex-row items-center gap-4">
          <h3 className="text-xl font-semibold text-white">Borrow Status</h3>
          {status && (
            <FreshnessIndicator
              timestamp={status.timestamp}
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
      ) : !error ? (
        <div className="text-center h-full text-gray-400 content-center">Loading...</div>
      ) : (
        <div className="bg-red-500/10 text-red-500 p-4 rounded-lg mb-6 content-center">
          Error: {error}
        </div>
      )}
    </div>
  );
}
