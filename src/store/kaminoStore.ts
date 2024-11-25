import { RewardInfo } from '@kamino-finance/farms-sdk';
import { KaminoMarket, KaminoReserve } from '@kamino-finance/klend-sdk';
import { Connection } from '@solana/web3.js';
import Decimal from 'decimal.js';
import { create } from 'zustand';
import { getConnection } from '../utils/connection';
import { JITO_MARKET, MAIN_MARKET, SOL_MINT, USDS_MINT } from '../utils/constants';
import { getMarket, getReserveRewardsApy, loadReserveData } from '../utils/helpers';
import { getJupiterPrices } from '../utils/jupiter';

interface ReserveApy {
  supplyApy: number;
  borrowApy: number;
  rewardApys: { rewardApy: Decimal; rewardInfo: RewardInfo }[] | null;
}

interface ReserveData {
  market: string;
  reserve: KaminoReserve;
  apy: ReserveApy;
  price: number | null;
  currentSupplyCapacity: number;
  currentBorrowCapacity: number;
  mintAddress: string;
}

interface PriceAlert {
  price: number;
  type: 'above' | 'below';
}

interface KaminoState {
  market: KaminoMarket | null;
  connection: Connection | null;
  reserves: { [key: string]: ReserveData };
  prices: { [key: string]: number };
  alerts: { [key: string]: PriceAlert };
  borrowableReserves: string[];
  isLoading: boolean;
  error: string | null;
  initializeMarket: () => Promise<void>;
  updateReserves: () => Promise<void>;
  updatePrices: () => Promise<void>;
  checkBorrowCapacity: () => void;
  setAlert: (token: string, price: number, type: 'above' | 'below') => void;
  removeAlert: (token: string) => void;
}

export const useKaminoStore = create<KaminoState>((set, get) => ({
  market: null,
  connection: null,
  reserves: {},
  prices: {},
  alerts: {},
  borrowableReserves: [],
  isLoading: false,
  error: null,

  initializeMarket: async () => {
    try {
      set({ isLoading: true, error: null });
      const connection = getConnection();
      const market = await getMarket({ connection, marketPubkey: MAIN_MARKET });

      set({
        market,
        connection,
        isLoading: false,
      });

      // After market is initialized, update reserves and prices
      const { updateReserves } = get();
      await updateReserves();
    } catch (error) {
      console.error('Error initializing market:', error);
      set({
        error: error instanceof Error ? error.message : 'Failed to initialize market',
        isLoading: false,
      });
    }
  },

  updateReserves: async () => {
    const { market } = get();
    if (!market) {
      console.error('Market not initialized');
      return;
    }

    try {
      set({ isLoading: true, error: null });
      const reserves = market.getReserves();
      console.log(
        `found market ${MAIN_MARKET.toString()} reserves:\n\n${reserves.map(x => x.symbol + ': ' + x.address.toString()).join('\n')}`
      );

      const newReserves: { [key: string]: ReserveData } = {};
      const newPrices: { [key: string]: number } = {};

      const tokens = [
        {
          mintPubkey: SOL_MINT,
          marketPubkey: MAIN_MARKET,
          hasReward: false,
          market: 'MAIN',
        },
        {
          mintPubkey: USDS_MINT,
          marketPubkey: MAIN_MARKET,
          hasReward: false,
          market: 'MAIN',
        },
        {
          mintPubkey: SOL_MINT,
          marketPubkey: JITO_MARKET,
          hasReward: true,
          market: 'JITO',
        },
      ];

      const connection = getConnection();
      for (const { mintPubkey, marketPubkey, hasReward, market } of tokens) {
        const { reserve, currentSlot } = await loadReserveData({
          connection,
          marketPubkey,
          mintPubkey,
        });

        let rewardApys: { rewardApy: Decimal; rewardInfo: RewardInfo }[] | null = null;
        if (hasReward) {
          try {
            rewardApys = await getReserveRewardsApy({
              connection,
              marketPubkey,
              mintPubkey,
            });
          } catch (error) {
            console.error(`Error processing reserve ${reserve.symbol}:`, error);
          }
        }

        newReserves[reserve.symbol + '_' + market] = {
          reserve,
          market,
          price: null, // Will be updated by updatePrices
          currentSupplyCapacity: reserve.getDepositWithdrawalCapCurrent(currentSlot).toNumber(),
          currentBorrowCapacity: reserve.getDebtWithdrawalCapCurrent(currentSlot).toNumber(),
          mintAddress: mintPubkey.toString(),
          apy: {
            supplyApy: reserve.totalSupplyAPY(currentSlot),
            borrowApy: reserve.totalBorrowAPY(currentSlot),
            rewardApys: rewardApys,
          },
        };
      }

      set({
        reserves: newReserves,
        prices: newPrices,
      });

      // Update prices after setting reserves
      const { updatePrices } = get();
      await updatePrices();

      set({ isLoading: false });

      // Check borrow capacity after updating reserves
      const { checkBorrowCapacity } = get();
      checkBorrowCapacity();
    } catch (error) {
      console.error('Error updating reserves:', error);
      set({
        error: error instanceof Error ? error.message : 'Failed to update reserves',
        isLoading: false,
      });
    }
  },

  updatePrices: async () => {
    const { reserves, alerts } = get();
    try {
      // Get all mint addresses
      const mintIds = Object.values(reserves).map(reserve => reserve.mintAddress);

      // Fetch prices from Jupiter
      const jupiterPrices = await getJupiterPrices(mintIds);

      // Update reserves with new prices
      const updatedReserves = { ...reserves };
      const newPrices: { [key: string]: number } = {};

      Object.entries(updatedReserves).forEach(([symbol, data]) => {
        const price = jupiterPrices[data.mintAddress];
        if (price !== undefined) {
          updatedReserves[symbol] = {
            ...data,
            price,
          };
          newPrices[symbol] = price;

          // Check price alerts
          const alert = alerts[symbol];
          if (alert) {
            if (
              (alert.type === 'above' && price >= alert.price) ||
              (alert.type === 'below' && price <= alert.price)
            ) {
              if ('Notification' in window && Notification.permission === 'granted') {
                new Notification(`Price Alert: ${symbol}`, {
                  body: `${symbol} price is ${alert.type === 'above' ? 'above' : 'below'} ${alert.price}`,
                });
              }
            }
          }
        }
      });

      set({
        reserves: updatedReserves,
        prices: newPrices,
      });
    } catch (error) {
      console.error('Error updating prices:', error);
    }
  },

  checkBorrowCapacity: () => {
    const { reserves } = get();
    const borrowableReserves = Object.entries(reserves)
      .filter(([_, data]) => data.currentBorrowCapacity > 0)
      .map(([symbol]) => symbol);

    if (borrowableReserves.length > 0) {
      // Show notification if browser supports it
      if ('Notification' in window && Notification.permission === 'granted') {
        const message = `Borrowing available for: ${borrowableReserves.join(', ')}`;
        new Notification('Borrow Capacity Alert', {
          body: message,
        });
      }

      // Update state with borrowable reserves
      set({ borrowableReserves });
    } else {
      set({ borrowableReserves: [] });
    }
  },

  setAlert: (token: string, price: number, type: 'above' | 'below') => {
    const { alerts } = get();
    set({
      alerts: {
        ...alerts,
        [token]: { price, type },
      },
    });
  },

  removeAlert: (token: string) => {
    const { alerts } = get();
    const newAlerts = { ...alerts };
    delete newAlerts[token];
    set({ alerts: newAlerts });
  },
}));
