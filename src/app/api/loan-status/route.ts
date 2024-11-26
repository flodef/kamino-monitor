import { STATUS_REFRESH_INTERVAL } from '@/utils/constants';
import { getApiUrl } from '@/utils/api';
import { getLoan, getMarket, getMarketName, toRatio, toValue } from '@/utils/helpers';
import { Connection, PublicKey } from '@solana/web3.js';
import { NextResponse } from 'next/server';

export type LoanSubInfo = {
  token: string;
  amount: string;
  apy: string;
  apr: string;
  direction: 'supply' | 'borrow';
};

export type LoanInfo = {
  isUnderwater: boolean;
  loanToValue: string;
  marketName: string;
  amounts: LoanSubInfo[];
};

export type LoanStatusResponse = {
  loanInfo: LoanInfo[];
  timestamp: string;
};

let connection: Connection | null = null;

export async function GET(request: Request) {
  try {
    // Get URL parameters
    const { searchParams } = new URL(request.url);
    const market = searchParams.get('market');
    const obligation = searchParams.get('obligation');

    if (!market || !obligation) {
      return NextResponse.json(
        { error: 'Missing required parameters: market and obligation' },
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

    const marketPubkey = new PublicKey(market);
    const obligationPubkey = new PublicKey(obligation);
    const marketName = getMarketName(market);

    const args = {
      connection,
      marketPubkey,
      obligationPubkey,
    };

    const marketData = await getMarket(args);
    const loan = await getLoan(args);

    const loanInfo: LoanInfo[] = [];

    // Process loan data if it exists
    if (loan) {
      const currentSlot = await connection.getSlot();
      const loanStats = loan.refreshedStats;
      const isUnderwater = loan.loanToValue().gt(loanStats.borrowLimit);
      const loanToValue = toRatio(loan.loanToValue().toNumber());
      const index =
        loanInfo.push({
          isUnderwater,
          loanToValue,
          marketName,
          amounts: [],
        }) - 1;

      loan.deposits.forEach(deposit => {
        const reserve = marketData.getReserveByMint(deposit.mintAddress);
        if (!reserve) return;

        loanInfo[index].amounts.push({
          token: reserve.symbol,
          amount: toValue(deposit.amount, reserve),
          apy: toRatio(reserve.totalSupplyAPY(currentSlot)),
          apr: toRatio(reserve.calculateSupplyAPR(currentSlot, marketData.state.referralFeeBps)),
          direction: 'supply',
        });
      });

      loan.borrows.forEach(borrow => {
        const reserve = marketData.getReserveByMint(borrow.mintAddress);
        if (!reserve) return;

        loanInfo[index].amounts.push({
          token: reserve.symbol,
          amount: toValue(borrow.amount, reserve),
          apy: toRatio(reserve.totalBorrowAPY(currentSlot)),
          apr: toRatio(reserve.calculateBorrowAPR(currentSlot, marketData.state.referralFeeBps)),
          direction: 'borrow',
        });
      });
    }

    const response: LoanStatusResponse = {
      loanInfo,
      timestamp: new Date().toISOString(),
    };

    return NextResponse.json(response, {
      headers: {
        'Cache-Control': `s-maxage=${STATUS_REFRESH_INTERVAL / 1000}`,
      },
    });
  } catch (error) {
    console.error('Error in loan status API:', error);
    return NextResponse.json({ error: 'Failed to fetch loan status' }, { status: 500 });
  }
}
