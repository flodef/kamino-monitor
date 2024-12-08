import { LoanStatusResponse } from '@/app/api/loan-status/route';
import { useMonitorStore } from '@/store/monitorStore';
import { STATUS_REFRESH_INTERVAL } from '@/utils/constants';
import { getMarketName, getObligationName } from '@/utils/helpers';
import { useEffect, useState } from 'react';
import CloseButton from './CloseButton';
import FreshnessIndicator from './FreshnessIndicator';
import Tooltip from './Tooltip';

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
  const { addNotification, updateLoanStatus, removeLoanStatus, loanStatuses, selectedRpc } =
    useMonitorStore();

  const marketName = getMarketName(market);
  const obligationName = getObligationName(obligation);
  const statusKey = `${market}-${obligation}`;

  const isCriticallyUnderwater = (status: LoanStatusResponse) => {
    const ltv = parseFloat(status.loanToValue);
    const limitLtv = parseFloat(status.limitLtv);
    const liquidationLtv = parseFloat(status.liquidationLtv);
    const medianThreshold = limitLtv + (liquidationLtv - limitLtv) / 2;
    return ltv > medianThreshold;
  };

  // Load stored status on mount
  useEffect(() => {
    const storedStatus = loanStatuses[statusKey];
    if (storedStatus) {
      setStatus(storedStatus);
    }
  }, [statusKey, loanStatuses]);

  const fetchStatus = async () => {
    try {
      const response = await fetch(
        `/api/loan-status?market=${encodeURIComponent(market)}&obligation=${encodeURIComponent(
          obligation
        )}&rpc=${selectedRpc}`
      );
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch loan status');
      }

      const loanStatus = await response.json();

      setStatus(loanStatus);
      updateLoanStatus(statusKey, loanStatus);

      // Check for underwater loans
      if (loanStatus.isUnderwater) {
        addNotification(
          `Loan is underwater in market ${loanStatus.marketName} with LTV ${loanStatus.loanToValue}`
        );
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to fetch loan status');
    }
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 60000); // Update every minute
    return () => {
      clearInterval(interval);
      removeLoanStatus(statusKey);
    };
  }, [market, obligation, selectedRpc]);

  return (
    <div
      className={`flex flex-col bg-primary rounded-lg p-6 h-full ${status && isCriticallyUnderwater(status) ? 'animate-pulse-danger' : ''}`}
    >
      <div className="flex justify-between items-start mb-2">
        <div className="flex flex-row items-center gap-4">
          <h3 className="text-xl font-semibold text-white">Loan Status</h3>
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
        <div className="mb-6 last:mb-0">
          <div className="space-y-2 mb-4">
            <div className="flex justify-between">
              <span className="text-gray-400">Market</span>
              <span className="text-white font-mono">{marketName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Obligation</span>
              <span className="text-white font-mono">{obligationName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Loan to Value</span>
              <Tooltip
                content={
                  <div className="text-center">
                    <div>Limit LTV: {status.limitLtv}</div>
                    <div>Liquidation LTV: {status.liquidationLtv}</div>
                  </div>
                }
              >
                <span className={status.isUnderwater ? 'text-red-400' : 'text-green-400'}>
                  {status.loanToValue}
                </span>
              </Tooltip>
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
                        <span className="text-gray-400">
                          APY{amount.reward !== '0%' && ' + Reward'}
                        </span>
                        <span className="text-gray-200">
                          {amount.reward !== '0%' ? (
                            <Tooltip
                              content={`Total: ${(
                                parseFloat(amount.apy.replace('%', '')) +
                                parseFloat(amount.reward.replace('%', ''))
                              ).toFixed(2)}%`}
                            >
                              {amount.apy} + {amount.reward}
                            </Tooltip>
                          ) : (
                            amount.apy
                          )}
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
                        <span className="text-gray-400">
                          APY{amount.reward !== '0%' && ' + Reward'}
                        </span>
                        <span className="text-gray-200">
                          {amount.reward !== '0%' ? (
                            <Tooltip
                              content={`Total: ${(
                                parseFloat(amount.apy.replace('%', '')) +
                                parseFloat(amount.reward.replace('%', ''))
                              ).toFixed(2)}%`}
                            >
                              {amount.apy} + {amount.reward}
                            </Tooltip>
                          ) : (
                            amount.apy
                          )}
                        </span>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
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
