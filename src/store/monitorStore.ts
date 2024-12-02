import { BorrowStatusResponse } from '@/app/api/borrow-status/route';
import { LoanStatusResponse } from '@/app/api/loan-status/route';
import { v4 as uuidv4 } from 'uuid';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

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
  publicKey: string | null;
}

interface Notification {
  id: string;
  message: string;
  type: 'warning';
  timestamp: number;
}

interface StoredLoanStatus extends LoanStatusResponse {
  lastUpdated: number;
}

interface StoredBorrowStatus extends BorrowStatusResponse {
  lastUpdated: number;
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
  loanStatuses: Record<string, StoredLoanStatus>;
  borrowStatuses: Record<string, StoredBorrowStatus>;
  addPriceConfig: (config: Omit<PriceConfig, 'id'>) => void;
  removePriceConfig: (id: string) => void;
  updatePrices: (prices: Record<string, PriceData>) => void;
  updateEurRate: (rate: number) => void;
  setCurrency: (currency: 'EUR' | 'USD') => void;
  addSection: (section: Omit<MonitorSection, 'id'>) => void;
  removeSection: (id: string) => void;
  addNotification: (message: string) => void;
  removeNotification: (id: string) => void;
  setIsLoading: (loading: boolean) => void;
  setLastFetchTimestamp: (timestamp: number) => void;
  getPriceData: (tokenId: string) => PriceData | null;
  updateLoanStatus: (key: string, status: LoanStatusResponse) => void;
  updateBorrowStatus: (key: string, status: BorrowStatusResponse) => void;
  removeLoanStatus: (key: string) => void;
  removeBorrowStatus: (key: string) => void;
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
      isLoading: false,
      lastFetchTimestamp: null,
      loanStatuses: {},
      borrowStatuses: {},

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

      addSection: section => {
        set(state => {
          // Check for duplicates if it's a borrow section
          if (section.type === 'borrow') {
            const isDuplicate = state.sections.some(
              s =>
                s.type === 'borrow' &&
                s.market === section.market &&
                s.publicKey === section.publicKey
            );
            if (isDuplicate) {
              return state;
            }
          }

          return {
            sections: [
              ...state.sections,
              {
                ...section,
                id: crypto.randomUUID(),
              },
            ],
          };
        });
      },

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

      getPriceData: tokenId => {
        const prices = get().prices;
        return prices[tokenId] || null;
      },

      updateLoanStatus: (key, status) =>
        set(state => ({
          loanStatuses: {
            ...state.loanStatuses,
            [key]: {
              ...status,
              lastUpdated: status.timestamp,
              amounts: status.amounts.map(amount => ({
                token: amount.token,
                amount: amount.amount,
                apy: amount.apy,
                apr: amount.apr,
                direction: amount.direction,
              })),
            },
          },
        })),

      updateBorrowStatus: (key, status) =>
        set(state => ({
          borrowStatuses: {
            ...state.borrowStatuses,
            [key]: {
              ...status,
              lastUpdated: status.timestamp,
            },
          },
        })),

      removeLoanStatus: key =>
        set(state => {
          const { [key]: _, ...rest } = state.loanStatuses; // eslint-disable-line
          return { loanStatuses: rest };
        }),

      removeBorrowStatus: key =>
        set(state => {
          const { [key]: _, ...rest } = state.borrowStatuses; // eslint-disable-line
          return { borrowStatuses: rest };
        }),

      fetchExchangeRate: async () => {
        try {
          const response = await fetch('https://open.er-api.com/v6/latest/USD');
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
