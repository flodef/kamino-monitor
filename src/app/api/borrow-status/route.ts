import { loadReserveData, toValue } from '@/utils/helpers';
import { getApiUrl } from '@/utils/api';
import { Connection, PublicKey } from '@solana/web3.js';
import { NextResponse } from 'next/server';

export type BorrowStatusResponse = {
  isBuyable: boolean;
  buyCap: string;
  timestamp: string;
};

const CACHE_REVALIDATE_SECONDS = 30;

let connection: Connection | null = null;

export async function GET(request: Request) {
  try {
    // Get URL parameters
    const { searchParams } = new URL(request.url);
    const market = searchParams.get('market');
    const mint = searchParams.get('mint');

    if (!market || !mint) {
      return NextResponse.json(
        { error: 'Missing required parameters: market and mint' },
        { status: 400 }
      );
    }

    // Get connection from connection API
    if (!connection) {
      const url = await getApiUrl('/api/connection');
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rpcLabel: 'Helius' }), // Default to Helius
      });

      if (!response.ok) {
        throw new Error('Failed to get connection from connection API');
      }

      const data = await response.json();
      if (!data.rpcEndpoint) {
        throw new Error('Invalid connection from connection API');
      }

      connection = new Connection(data.rpcEndpoint);
    }

    // Get borrow status
    const { market: marketData, reserve } = await loadReserveData({
      connection,
      marketPubkey: new PublicKey(market),
      mintPubkey: new PublicKey(mint),
    });

    const { globalDebtCap, globalTotalBorrowed } = reserve.getBorrowCapForReserve(marketData);
    const isBuyable = globalTotalBorrowed.lt(globalDebtCap);
    const buyCap = toValue(globalDebtCap.minus(globalTotalBorrowed), reserve);

    const response: BorrowStatusResponse = {
      isBuyable,
      buyCap,
      timestamp: new Date().toISOString(),
    };

    return NextResponse.json(response, {
      headers: {
        'Cache-Control': `s-maxage=${CACHE_REVALIDATE_SECONDS}`,
      },
    });
  } catch (error) {
    console.error('Error in borrow status API:', error);
    return NextResponse.json({ error: 'Failed to fetch borrow status' }, { status: 500 });
  }
}
