import { STATUS_REFRESH_INTERVAL } from '@/utils/constants';
import { getApiUrl } from '@/utils/api';
import { formatPubkey, getLoan, getMarket, getMarketName, toRatio, toValue } from '@/utils/helpers';
import { Connection, PublicKey } from '@solana/web3.js';
import { NextResponse } from 'next/server';

export type LoanAmounts = {
  token: string;
  amount: string;
  apy: string;
  apr: string;
  direction: 'supply' | 'borrow';
};

export type LoanStatusResponse = {
  isUnderwater: boolean;
  loanToValue: string;
  marketName: string;
  timestamp: number;
  amounts: LoanAmounts[];
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

    let loan;
    try {
      loan = await getLoan(args);
    } catch (error) {
      console.error(error);
      return NextResponse.json(
        {
          error:
            'Market not found for market: ' +
            formatPubkey(marketPubkey) +
            ' and obligation: ' +
            formatPubkey(obligationPubkey),
        },
        { status: 404 }
      );
    }

    if (!loan) {
      return NextResponse.json({ error: 'Loan not found' }, { status: 404 });
    }

    // Process loan data if it exists
    const currentSlot = await connection.getSlot();
    const isUnderwater = loan.loanToValue().gt(0.7);
    const loanToValue = toRatio(loan.loanToValue().toNumber());
    const amounts: LoanAmounts[] = [];

    loan.deposits.forEach(deposit => {
      const reserve = marketData.getReserveByMint(deposit.mintAddress);
      if (!reserve) return;

      amounts.push({
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

      amounts.push({
        token: reserve.symbol,
        amount: toValue(borrow.amount, reserve),
        apy: toRatio(reserve.totalBorrowAPY(currentSlot)),
        apr: toRatio(reserve.calculateBorrowAPR(currentSlot, marketData.state.referralFeeBps)),
        direction: 'borrow',
      });
    });

    const response: LoanStatusResponse = {
      isUnderwater,
      loanToValue,
      marketName,
      timestamp: Date.now(),
      amounts,
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
