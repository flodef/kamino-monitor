import { LoanStatusResponse } from '@/app/api/loan-status/route';
import { useMonitorStore } from '@/store/monitorStore';
import { useEffect, useState } from 'react';
import CloseButton from './CloseButton';

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

      // Check for underwater loans
      data.loanInfo.forEach((loan: LoanStatusResponse) => {
        if (loan.isUnderwater) {
          addNotification(
            `Loan is underwater in market ${loan.marketName} with LTV ${loan.loanToValue}`
          );
        }
      });
    } catch {
      setStatus(null);
    }
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 60000); // Update every minute
    return () => clearInterval(interval);
  }, [market, obligation]);

  return (
    <div className="bg-primary rounded-lg p-6 h-full">
      <div className="flex justify-between items-start mb-7">
        <h3 className="text-xl font-semibold text-white">Loan Status</h3>
        <CloseButton onClick={onRemove} />
      </div>
      {status && (
        <div className="mb-6 last:mb-0">
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
              <span className={status.isUnderwater ? 'text-red-400' : 'text-green-400'}>
                {status.loanToValue}
              </span>
            </div>
          </div>

          <div className="space-y-4">
            {/* {status && <NotificationManager loanInfo={{ marketName: market }} />} */}
            <div>
              <h4 className="text-lg font-medium text-white mb-2">Deposits</h4>
              <div className="space-y-2">
                {status.amounts
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
                {status.amounts
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
      )}
      {!status && <div className="text-center py-4 text-gray-400">Loading...</div>}
    </div>
  );
}
