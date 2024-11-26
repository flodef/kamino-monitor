import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';
import { MARKETS, TOKENS, OBLIGATIONS } from '../utils/constants';

interface PriceConfig {
  id: string;
  tokenId: string;
  symbol: string;
}

interface PriceData {
  price: number;
  timestamp: number;
  error?: string;
}

interface MonitorSection {
  id: string;
  type: 'borrow' | 'loan';
  market: string;
  publicKey: string;
}

interface Notification {
  id: string;
  message: string;
  type: 'warning';
  timestamp: number;
}

interface MonitorState {
  priceConfigs: PriceConfig[];
  prices: Record<string, PriceData>;
  currency: 'EUR' | 'USD';
  eurRate: number;
  sections: MonitorSection[];
  notifications: Notification[];
  isLoading: boolean;
  lastFetchTimestamp: number | null;
  addPriceConfig: (config: Omit<PriceConfig, 'id'>) => void;
  removePriceConfig: (id: string) => void;
  updatePrices: (prices: Record<string, PriceData>) => void;
  updateEurRate: (rate: number) => void;
  setCurrency: (currency: 'EUR' | 'USD') => void;
  addSection: (type: 'borrow' | 'loan', market: string, publicKey: string) => void;
  removeSection: (id: string) => void;
  addNotification: (message: string) => void;
  removeNotification: (id: string) => void;
  setIsLoading: (loading: boolean) => void;
  setLastFetchTimestamp: (timestamp: number) => void;
  getPriceData: (tokenId: string) => PriceData | null;
  fetchExchangeRate: () => Promise<void>;
}

export const useMonitorStore = create<MonitorState>()(
  persist(
    (set, get) => ({
      priceConfigs: [],
      prices: {},
      currency: 'EUR',
      eurRate: 1,
      sections: [],
      notifications: [],
      isLoading: true,
      lastFetchTimestamp: null,

      addPriceConfig: config =>
        set(state => ({
          priceConfigs: [...state.priceConfigs, { ...config, id: uuidv4() }],
        })),

      removePriceConfig: id =>
        set(state => ({
          priceConfigs: state.priceConfigs.filter(config => config.id !== id),
        })),

      updatePrices: (newPrices: Record<string, PriceData>) => {
        const timestamp = Date.now();
        set(state => ({
          prices: Object.entries(newPrices).reduce(
            (acc, [tokenId, { price, timestamp, error }]) => ({
              ...acc,
              [tokenId]: {
                price,
                timestamp,
                error,
              },
            }),
            state.prices
          ),
          lastFetchTimestamp: timestamp,
          isLoading: false,
        }));
      },

      updateEurRate: rate => set({ eurRate: rate }),

      setCurrency: currency => {
        set({ currency });
        // Fetch new exchange rate when currency changes
        if (currency === 'EUR') {
          get().fetchExchangeRate();
        }
      },

      addSection: (type, market, publicKey) =>
        set(state => ({
          sections: [
            ...state.sections,
            {
              id: uuidv4(),
              type,
              market,
              publicKey,
            },
          ],
        })),

      removeSection: id =>
        set(state => ({
          sections: state.sections.filter(section => section.id !== id),
        })),

      addNotification: message =>
        set(state => ({
          notifications: [
            ...state.notifications,
            {
              id: uuidv4(),
              message,
              type: 'warning',
              timestamp: Date.now(),
            },
          ],
        })),

      removeNotification: id =>
        set(state => ({
          notifications: state.notifications.filter(notification => notification.id !== id),
        })),

      setIsLoading: (loading: boolean) => set({ isLoading: loading }),

      setLastFetchTimestamp: (timestamp: number) => set({ lastFetchTimestamp: timestamp }),

      getPriceData: (tokenId: string) => {
        const state = get();
        return state.prices[tokenId] || null;
      },

      fetchExchangeRate: async () => {
        try {
          const response = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
          const data = await response.json();
          set({ eurRate: data.rates.EUR });
        } catch (error) {
          console.error('Error fetching exchange rate:', error);
          // Default to 1 if fetch fails
          set({ eurRate: 1 });
        }
      },
    }),
    {
      name: 'monitor-store',
    }
  )
);
