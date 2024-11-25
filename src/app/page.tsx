'use client';

import RpcSelector from '@/components/RpcSelector';
import { useKaminoStore } from '@/store/kaminoStore';
import { useEffect, useState } from 'react';
import { Toaster } from 'sonner';

export default function Home() {
  const { reserves, alerts, isLoading, initializeMarket, updatePrices, setAlert, removeAlert } =
    useKaminoStore();

  const [selectedToken, setSelectedToken] = useState('');
  const [alertPrice, setAlertPrice] = useState('');

  useEffect(() => {
    initializeMarket();
  }, []);

  useEffect(() => {
    const interval = setInterval(updatePrices, 60000); // Update every minute
    return () => clearInterval(interval);
  }, []);

  const handleSetAlert = (token: string, price: string) => {
    const priceNumber = parseFloat(price);
    if (isNaN(priceNumber)) return;

    const alertType = (document.getElementById('alert-type') as HTMLSelectElement).value as
      | 'above'
      | 'below';
    setAlert(token, priceNumber, alertType);
  };

  return (
    <main className="min-h-screen bg-background p-8">
      <Toaster position="top-right" />

      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold text-white">Kamino Finance Monitor</h1>
          <RpcSelector />
        </div>

        <div className="grid grid-cols-1 gap-6 mb-8">
          <div className="bg-primary rounded-lg p-6">
            <h2 className="text-2xl font-semibold text-white mb-4">Market Reserves</h2>
            {isLoading ? (
              <div className="text-white text-center py-4">Loading market reserves...</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead>
                    <tr className="text-left text-gray-400">
                      <th className="pb-4">Token</th>
                      <th className="pb-4">Market</th>
                      <th className="pb-4">Price</th>
                      <th className="pb-4">Supply Capacity</th>
                      <th className="pb-4">Borrow Capacity</th>
                      <th className="pb-4">Supply APY</th>
                      <th className="pb-4">Borrow APY</th>
                      <th className="pb-4">Reward APYs</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(reserves).map(([symbol, data]) => (
                      <tr key={symbol} className="border-t border-gray-800">
                        <td className="py-4">
                          <span className="text-white font-medium">{data.reserve.symbol}</span>
                        </td>
                        <td className="py-4">
                          <span className="text-white">{data.market || 'MAIN'}</span>
                        </td>
                        <td className="py-4">
                          <span className="text-white">${data.price?.toFixed(2) || 'N/A'}</span>
                        </td>
                        <td className="py-4">
                          <span className="text-white">
                            {data.currentSupplyCapacity.toLocaleString()}
                          </span>
                        </td>
                        <td className="py-4">
                          <span className="text-white">
                            {data.currentBorrowCapacity.toLocaleString()}
                          </span>
                        </td>
                        <td className="py-4">
                          <span className="text-white">
                            {(data.apy.supplyApy * 100).toFixed(2)}%
                          </span>
                        </td>
                        <td className="py-4">
                          <span className="text-white">
                            {(data.apy.borrowApy * 100).toFixed(2)}%
                          </span>
                        </td>
                        <td className="py-4">
                          {data.apy.rewardApys ? (
                            <div className="space-y-1">
                              {data.apy.rewardApys.map((reward, index) => (
                                <div key={index} className="text-white">
                                  {(Number(reward.rewardApy) * 100).toFixed(2)}%
                                </div>
                              ))}
                            </div>
                          ) : (
                            <span className="text-gray-400">No rewards</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        <div className="mb-8">
          <h2 className="text-2xl font-semibold text-white mb-4">Set Price Alert</h2>
          <div className="flex items-end gap-4">
            <div className="flex-1">
              <label
                htmlFor="token-select"
                className="block text-sm font-medium text-gray-400 mb-2"
              >
                Token
              </label>
              <select
                id="token-select"
                value={selectedToken}
                onChange={e => setSelectedToken(e.target.value)}
                className="block w-full rounded-md border-gray-300 bg-primary text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              >
                <option value="">Select a token</option>
                {Object.keys(reserves).map(symbol => (
                  <option key={symbol} value={symbol}>
                    {symbol}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex-1">
              <label htmlFor="alert-type" className="block text-sm font-medium text-gray-400 mb-2">
                Alert Type
              </label>
              <select
                id="alert-type"
                defaultValue="above"
                className="block w-full rounded-md border-gray-300 bg-primary text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              >
                <option value="above">Above Price</option>
                <option value="below">Below Price</option>
              </select>
            </div>
            <div className="flex-1">
              <label htmlFor="price-input" className="block text-sm font-medium text-gray-400 mb-2">
                Price
              </label>
              <input
                type="number"
                id="price-input"
                value={alertPrice}
                onChange={e => setAlertPrice(e.target.value)}
                placeholder="Enter price"
                className="block w-full rounded-md border-gray-300 bg-primary text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              />
            </div>
            <button
              onClick={() => handleSetAlert(selectedToken, alertPrice)}
              disabled={!selectedToken || !alertPrice}
              className="px-4 py-2 bg-accent text-white rounded-md hover:bg-accent/80 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Set Alert
            </button>
          </div>
        </div>

        <div className="mb-8">
          <h2 className="text-2xl font-semibold text-white mb-4">Active Alerts</h2>
          <div className="grid gap-4">
            {Object.entries(alerts).length === 0 ? (
              <div className="text-gray-400 text-center">No active alerts</div>
            ) : (
              Object.entries(alerts).map(([token, alert]) => (
                <div
                  key={token}
                  className="flex items-center justify-between bg-primary rounded p-4"
                >
                  <div>
                    <span className="text-white font-medium">{token}</span>
                    <span className="text-gray-400 ml-2">
                      Alert when {alert.type} ${alert.price}
                    </span>
                  </div>
                  <button
                    onClick={() => removeAlert(token)}
                    className="text-red-500 hover:text-red-400"
                  >
                    Remove
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
