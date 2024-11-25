import {
  JITO_MARKET,
  JITO_OBLIGATION,
  MAIN_MARKET,
  MAIN_OBLIGATION,
  USDS_MINT,
} from '@/utils/constants';
import { getLoan, getMarket, loadReserveData } from '@/utils/helpers';
import { Connection } from '@solana/web3.js';
import { NextResponse } from 'next/server';

type LoanSubInfo = {
  token: string;
  market: string;
  amount: string;
  apy: string;
  apr: string;
  direction: 'supply' | 'borrow';
};

type LoanInfo = {
  isLoanUnderwater: boolean;
  loanToValue: string;
  amounts: LoanSubInfo[];
};

type BorrowStatusResponse = {
  isBuyable: boolean;
  buyCap: string;
  loanInfo: LoanInfo[];
  timestamp: string;
};

const CACHE_REVALIDATE_SECONDS = 30;

const toRatio = (value: number): string => {
  return `${(value * 100).toFixed(2)}%`;
};

let serverConnection: Connection | null = null;

export async function GET() {
  try {
    if (!serverConnection) {
      const rpcUrl = process.env.HELIUS_RPC_URL;
      if (!rpcUrl) {
        throw new Error('HELIUS_RPC_URL not configured');
      }
      serverConnection = new Connection(rpcUrl);
    }
    const connection = serverConnection;

    // Get borrow status
    const { market, reserve } = await loadReserveData({
      connection,
      marketPubkey: MAIN_MARKET,
      mintPubkey: USDS_MINT,
    });

    const { globalDebtCap, globalTotalBorrowed } = reserve.getBorrowCapForReserve(market);
    const isBuyable = globalTotalBorrowed.lt(globalDebtCap);
    const buyCap = globalDebtCap.minus(globalTotalBorrowed).div(reserve.getMintFactor()).toFixed(2);

    // Process all obligations
    const obligations = [
      { marketPubkey: MAIN_MARKET, symbol: 'MAIN', pubkey: MAIN_OBLIGATION },
      { marketPubkey: JITO_MARKET, symbol: 'JITO', pubkey: JITO_OBLIGATION },
    ];

    const loanInfo: LoanInfo[] = [];
    for (const { marketPubkey, symbol, pubkey } of obligations) {
      const marketName = symbol;
      const obligationPubkey = pubkey;

      const args = {
        connection,
        marketPubkey,
        obligationPubkey,
      };

      const market = await getMarket(args);
      const loan = await getLoan(args);

      // General net stats
      if (loan) {
        const currentSlot = await connection.getSlot();
        const loanStats = loan.refreshedStats;
        const isLoanUnderwater = loan.loanToValue().gt(loanStats.borrowLimit);
        const loanToValue = toRatio(loan.loanToValue().toNumber());
        const index =
          loanInfo.push({
            isLoanUnderwater,
            loanToValue,
            amounts: [],
          }) - 1;
        loan.deposits.forEach(deposit => {
          const reserve = market.getReserveByMint(deposit.mintAddress);
          if (!reserve) return;

          const decimals = reserve!.getMintFactor();
          loanInfo[index].amounts.push({
            token: reserve.symbol,
            market: marketName,
            amount: deposit.amount.div(decimals).toFixed(2),
            apy: toRatio(reserve.totalSupplyAPY(currentSlot)),
            apr: toRatio(reserve.calculateSupplyAPR(currentSlot, market.state.referralFeeBps)),
            direction: 'supply',
          });
        });

        // Print all borrows
        loan.borrows.forEach(borrow => {
          const reserve = market.getReserveByMint(borrow.mintAddress);
          if (!reserve) return;

          const decimals = reserve!.getMintFactor();
          loanInfo[index].amounts.push({
            token: reserve.symbol,
            market: marketName,
            amount: borrow.amount.div(decimals).toFixed(2),
            apy: toRatio(reserve.totalBorrowAPY(currentSlot)),
            apr: toRatio(reserve.calculateBorrowAPR(currentSlot, market.state.referralFeeBps)),
            direction: 'borrow',
          });
        });
      }
    }

    const response: BorrowStatusResponse = {
      isBuyable,
      buyCap,
      loanInfo,
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
