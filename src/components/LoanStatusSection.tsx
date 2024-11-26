import { useMonitorStore } from '@/store/monitorStore';
import { useEffect, useState } from 'react';
import CloseButton from './CloseButton';
import { NotificationManager } from './NotificationManager';
import { LoanInfo, LoanStatusResponse } from '@/app/api/loan-status/route';

export default function LoanStatusSection({
  market,
  obligation,
  onRemove,
}: {
  market: string;
  obligation: string;
  onRemove: () => void;
}) {
  const [status, setStatus] = useState<LoanStatusResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { addNotification } = useMonitorStore();

  const fetchStatus = async () => {
    try {
      const response = await fetch(
        `/api/loan-status?market=${encodeURIComponent(market)}&obligation=${encodeURIComponent(
          obligation
        )}`
      );
      if (!response.ok) throw new Error('Failed to fetch loan status');

      const data = await response.json();
      setStatus(data);
      setError(null);

      // Check for underwater loans
      data.loanInfo.forEach((loan: LoanInfo) => {
        if (loan.isUnderwater) {
          addNotification(
            `Loan is underwater in market ${loan.marketName} with LTV ${loan.loanToValue}`
          );
        }
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      setStatus(null);
    }
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 60000); // Update every minute
    return () => clearInterval(interval);
  }, [market, obligation]);

  if (error) {
    return (
      <div className="bg-red-500/20 rounded-lg p-6">
        <div className="flex justify-between items-start mb-4">
          <h3 className="text-xl font-semibold text-white">Loan Status Error</h3>
          <CloseButton onClick={onRemove} />
        </div>
        <p className="text-red-400">{error}</p>
      </div>
    );
  }

  return (
    <div className="bg-primary rounded-lg p-6">
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-xl font-semibold text-white">Loan Status</h3>
        <CloseButton onClick={onRemove} />
      </div>
      {status?.loanInfo.map((loan, index) => (
        <div key={index} className="mb-6 last:mb-0">
          <div className="space-y-2 mb-4">
            <div className="flex justify-between">
              <span className="text-gray-400">Market</span>
              <span className="text-white font-mono">{market}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Obligation</span>
              <span className="text-white font-mono">{obligation}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Loan to Value</span>
              <span className={loan.isUnderwater ? 'text-red-400' : 'text-green-400'}>
                {loan.loanToValue}
              </span>
            </div>
          </div>

          <div className="space-y-4">
            {/* {status && <NotificationManager loanInfo={{ marketName: market }} />} */}
            <div>
              <h4 className="text-lg font-medium text-white mb-2">Deposits</h4>
              <div className="space-y-2">
                {loan.amounts
                  .filter(amount => amount.direction === 'supply')
                  .map((amount, i) => (
                    <div key={i} className="bg-secondary rounded p-3">
                      <div className="flex justify-between mb-1">
                        <span className="text-gray-400">{amount.token}</span>
                        <span className="text-white">{amount.amount}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">APY/APR</span>
                        <span className="text-gray-200">
                          {amount.apy} / {amount.apr}
                        </span>
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            <div>
              <h4 className="text-lg font-medium text-white mb-2">Borrows</h4>
              <div className="space-y-2">
                {loan.amounts
                  .filter(amount => amount.direction === 'borrow')
                  .map((amount, i) => (
                    <div key={i} className="bg-secondary rounded p-3">
                      <div className="flex justify-between mb-1">
                        <span className="text-gray-400">{amount.token}</span>
                        <span className="text-white">{amount.amount}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">APY/APR</span>
                        <span className="text-gray-200">
                          {amount.apy} / {amount.apr}
                        </span>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </div>
      ))}
      {!status && <div className="text-center py-4 text-gray-400">Loading...</div>}
    </div>
  );
}
