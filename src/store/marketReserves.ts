import { create } from 'zustand';
import { KaminoMarket, KaminoReserve } from '@kamino-finance/klend-sdk';
import { getConnection } from '../utils/connection';
import { getMarket } from '../utils/helpers';
import { MAIN_MARKET, USDC_MINT, SOL_MINT, USDS_MINT } from '../utils/constants';

interface MarketReservesState {
  market: KaminoMarket | null;
  reserves: {
    USDC: KaminoReserve | null;
    SOL: KaminoReserve | null;
    USDS: KaminoReserve | null;
  };
  loading: boolean;
  error: string | null;
  fetchReserves: () => Promise<void>;
}

export const useMarketReserves = create<MarketReservesState>((set, get) => ({
  market: null,
  reserves: {
    USDC: null,
    SOL: null,
    USDS: null,
  },
  loading: false,
  error: null,
  fetchReserves: async () => {
    try {
      set({ loading: true, error: null });
      
      const connection = getConnection();
      const market = await getMarket({ connection, marketPubkey: MAIN_MARKET });
      
      const reserves = market.getReserves();
      const currentSlot = await connection.getSlot();
      
      // Find our specific reserves
      const usdcReserve = reserves.find(r => r.stats.mintAddress.equals(USDC_MINT));
      const solReserve = reserves.find(r => r.stats.mintAddress.equals(SOL_MINT));
      const usdsReserve = reserves.find(r => r.stats.mintAddress.equals(USDS_MINT));
      
      set({
        market,
        reserves: {
          USDC: usdcReserve || null,
          SOL: solReserve || null,
          USDS: usdsReserve || null,
        },
        loading: false,
      });
    } catch (error) {
      console.error('Error fetching reserves:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Failed to fetch reserves',
        loading: false 
      });
    }
  },
}));
