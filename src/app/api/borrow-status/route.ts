import { getConnection } from '@/utils/connection';
import {
  JITO_MARKET,
  JITO_OBLIGATION,
  MAIN_MARKET,
  MAIN_OBLIGATION,
  USDS_MINT,
} from '@/utils/constants';
import { getLoan, getMarket, loadReserveData } from '@/utils/helpers';
import { ObligationStats } from '@kamino-finance/klend-sdk';
import { NextResponse } from 'next/server';

type loanSubInfo = {
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
  amounts: loanSubInfo[];
};

const toRatio = (value: number) => {
  return `${(value * 100).toFixed(2)}%`;
};

export async function GET() {
  try {
    const marketPubkey = MAIN_MARKET;
    const mintPubkey = USDS_MINT;

    const connection = getConnection();
    const { market, reserve } = await loadReserveData({
      connection,
      marketPubkey,
      mintPubkey,
    });

    const { globalDebtCap, globalTotalBorrowed } = reserve.getBorrowCapForReserve(market);
    const isBuyable = globalTotalBorrowed.lt(globalDebtCap);
    const buyCap = globalDebtCap.minus(globalTotalBorrowed).div(reserve.getMintFactor()).toFixed(2);

    const obligations = [
      {
        marketPubkey: MAIN_MARKET,
        symbol: 'MAIN',
        pubkey: MAIN_OBLIGATION,
      },
      {
        marketPubkey: JITO_MARKET,
        symbol: 'JITO',
        pubkey: JITO_OBLIGATION,
      },
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
        const loanStats: ObligationStats = loan.refreshedStats;
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

    const data = {
      isBuyable,
      buyCap,
      loanInfo,
      timestamp: new Date().toISOString(),
    };

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Failed to fetch borrow status' }, { status: 500 });
  }
}
