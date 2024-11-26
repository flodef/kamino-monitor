import { KaminoMarket, KaminoReserve } from '@kamino-finance/klend-sdk';
import { create } from 'zustand';
import { getConnection } from '../utils/connection';
import { MARKETS, TOKENS } from '../utils/constants';
import { getMarket } from '../utils/helpers';

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
      const market = await getMarket({ connection, marketPubkey: MARKETS.MAIN.pubkey });

      const reserves = market.getReserves();

      // Find our specific reserves
      const usdcReserve = reserves.find(r => r.stats.mintAddress.equals(TOKENS.USDC.pubkey));
      const solReserve = reserves.find(r => r.stats.mintAddress.equals(TOKENS.SOL.pubkey));
      const usdsReserve = reserves.find(r => r.stats.mintAddress.equals(TOKENS.USDS.pubkey));

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
        loading: false,
      });
    }
  },
}));
