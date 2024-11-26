import { useMonitorStore } from '@/store/monitorStore';
import { PRICE_REFRESH_INTERVAL, PRICE_UPDATE_INTERVAL, TOKENS } from '@/utils/constants';
import AddIcon from '@mui/icons-material/Add';
import { CircularProgress, Switch } from '@mui/material';
import { useEffect, useState, useCallback } from 'react';
import AddPriceDialog from './AddPriceDialog';
import CloseButton from './CloseButton';
import FreshnessIndicator from './FreshnessIndicator';

const AVAILABLE_TOKENS = Object.values(TOKENS).map(token => ({
  id: token.id,
  symbol: token.label,
  mint: token.pubkey,
}));

const LoadingSpinner = () => (
  <div className="flex items-center justify-center h-[104px]">
    <div className="text-gray-500">Loading prices...</div>
  </div>
);

const PriceSection = () => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [progress, setProgress] = useState(0);
  const {
    priceConfigs,
    prices,
    currency,
    eurRate,
    isLoading,
    lastFetchTimestamp,
    updatePrices,
    setIsLoading,
    removePriceConfig,
    setCurrency,
    fetchExchangeRate,
  } = useMonitorStore();

  const availableTokens = AVAILABLE_TOKENS.filter(
    token => !priceConfigs.some(config => config.tokenId === token.id)
  );

  const fetchPrices = useCallback(async () => {
    if (!priceConfigs.length) {
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/prices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tokens: priceConfigs.map(config => {
            const token = AVAILABLE_TOKENS.find(t => t.id === config.tokenId);
            return {
              id: config.tokenId,
              symbol: config.symbol,
              mint: token?.mint.toString(),
            };
          }),
        }),
      });

      if (!response.ok) throw new Error('Failed to fetch prices');

      const data = await response.json();
      updatePrices(data.prices);
    } catch (error) {
      console.error('Error fetching prices:', error);
      setIsLoading(false);
    }
  }, [priceConfigs]);

  useEffect(() => {
    let startTime = Date.now();
    let progressInterval: NodeJS.Timeout;

    const updateProgress = () => {
      const elapsedTime = Date.now() - startTime;
      const newProgress = (elapsedTime / PRICE_REFRESH_INTERVAL) * 100;

      if (newProgress >= 100) {
        // Reset progress and fetch new prices
        setProgress(0);
        startTime = Date.now();
        fetchPrices();
      } else {
        setProgress(newProgress);
      }
    };

    // Initial fetch
    fetchPrices();

    // Set up the progress interval
    progressInterval = setInterval(updateProgress, PRICE_UPDATE_INTERVAL);

    return () => {
      clearInterval(progressInterval);
    };
  }, [fetchPrices]);

  useEffect(() => {
    // Fetch initial exchange rate
    fetchExchangeRate();
  }, []);

  const handleAddPrice = () => {
    setDialogOpen(true);
  };

  const handleCurrencyToggle = () => {
    setCurrency(currency === 'EUR' ? 'USD' : 'EUR');
  };

  if (isLoading && !Object.keys(prices).length && !priceConfigs.length) {
    return <LoadingSpinner />;
  }

  return (
    <>
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-8">
            <h2 className="text-xl font-semibold">Prices</h2>
            <div className="flex items-center space-x-2">
              <span className="text-gray-400">EUR</span>
              <Switch checked={currency === 'USD'} onChange={handleCurrencyToggle} size="small" />
              <span className="text-gray-400">USD</span>
            </div>
          </div>
          <div className="relative w-8 h-8">
            <CircularProgress
              variant="determinate"
              value={progress}
              size={32}
              thickness={4}
              className="text-gray-500"
            />
            {isLoading && (
              <CircularProgress
                size={32}
                thickness={4}
                className="absolute top-0 left-0 text-blue-500"
              />
            )}
          </div>
        </div>

        <div className="flex flex-wrap gap-4">
          {priceConfigs.map(config => {
            const token = AVAILABLE_TOKENS.find(t => t.id === config.tokenId);
            if (!token) return null;

            const priceData = prices[config.tokenId];

            return (
              <div key={config.id} className="bg-gray-700 rounded-lg p-4 relative min-w-[140px]">
                {priceData && (
                  <FreshnessIndicator
                    timestamp={priceData.timestamp}
                    refreshInterval={PRICE_REFRESH_INTERVAL}
                  />
                )}
                <CloseButton
                  onClick={() => removePriceConfig(config.id)}
                  className="absolute top-2 right-2"
                />
                <div className="text-center pt-2">
                  <div className="flex items-center justify-center gap-2 mb-1">
                    <span className="text-gray-400">{token.symbol}</span>
                  </div>
                  <div className="text-white font-medium text-lg">
                    {priceData
                      ? currency === 'USD'
                        ? `$${priceData.price.toFixed(2)}`
                        : `${(priceData.price * eurRate).toFixed(2)} €`
                      : '-'}
                  </div>
                </div>
              </div>
            );
          })}
          {availableTokens.length > 0 && (
            <button
              onClick={handleAddPrice}
              className="bg-gray-700 rounded-lg p-4 min-w-[140px] text-center hover:bg-gray-600 transition-colors"
            >
              <div className="pt-2">
                <div className="text-gray-400 mb-1">Add Price</div>
                <div className="text-white font-medium text-lg">
                  <AddIcon />
                </div>
              </div>
            </button>
          )}
        </div>
      </div>
      {dialogOpen && <AddPriceDialog onClose={() => setDialogOpen(false)} />}
    </>
  );
};

export default PriceSection;
