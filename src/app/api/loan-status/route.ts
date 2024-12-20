import { getApiUrl } from '@/utils/api';
import { MARKETS, OBLIGATIONS, STATUS_REFRESH_INTERVAL } from '@/utils/constants';
import { getEnv } from '@/utils/env';
import { formatPubkey, getLoan, getMarket, getMarketName, toRatio, toValue } from '@/utils/helpers';
import { Connection, PublicKey } from '@solana/web3.js';
import { NextResponse } from 'next/server';

export interface LoanAmounts {
  token: string;
  amount: string;
  apy: string;
  reward: string;
  direction: 'supply' | 'borrow';
}

export interface LoanStatusResponse {
  isUnderwater: boolean;
  loanToValue: string;
  limitLtv: string;
  liquidationLtv: string;
  marketName: string;
  timestamp: number;
  amounts: LoanAmounts[];
}

let connection: Connection | null = null;

// Get connection from connection API
async function getConnection(rpc: string) {
  if (connection) return connection;

  const url = await getApiUrl('/api/connection');
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ rpcLabel: rpc }),
  });

  if (!response.ok) {
    throw new Error('Failed to get connection from connection API');
  }

  const data = await response.json();
  if (!data.rpcEndpoint) {
    throw new Error('Invalid connection from connection API');
  }

  return new Connection(data.rpcEndpoint);
}

async function fetchKaminoLoanStatus(
  rpc: string,
  market: string,
  obligation: string
): Promise<LoanStatusResponse> {
  connection = await getConnection(rpc);

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
    throw new Error(
      'Market not found for market: ' +
        formatPubkey(marketPubkey) +
        ' and obligation: ' +
        formatPubkey(obligationPubkey)
    );
  }

  if (!loan) {
    throw new Error('Loan not found');
  }

  // Process loan data if it exists
  const currentSlot = await connection.getSlot();
  const stats = loan.refreshedStats;
  const limitLtv =
    Math.round(
      stats.liquidationLtv.div(stats.borrowLiquidationLimit).mul(stats.borrowLimit).toNumber() *
        10000
    ) / 10000;
  const loanToValue = loan.loanToValue();
  const isUnderwater = loanToValue.gt(limitLtv);
  const amounts: LoanAmounts[] = [];

  await Promise.all(
    Array.from(loan.deposits.values()).map(async deposit => {
      const reserve = marketData.getReserveByMint(deposit.mintAddress);
      if (!reserve) return;

      const prices = await marketData.getAllScopePrices();
      const rewardApys = await reserve.getRewardYields(prices);
      const totalRewardApy = rewardApys.reduce((sum, { apy }) => sum + apy.toNumber(), 0);

      amounts.push({
        token: reserve.symbol,
        amount: toValue(deposit.amount, reserve),
        apy: toRatio(reserve.totalSupplyAPY(currentSlot)),
        reward: toRatio(totalRewardApy),
        direction: 'supply',
      });
    })
  );

  await Promise.all(
    Array.from(loan.borrows.values()).map(async borrow => {
      const reserve = marketData.getReserveByMint(borrow.mintAddress);
      if (!reserve) return;

      amounts.push({
        token: reserve.symbol,
        amount: toValue(borrow.amount, reserve),
        apy: toRatio(reserve.totalBorrowAPY(currentSlot)),
        reward: toRatio(0),
        direction: 'borrow',
      });
    })
  );

  return {
    isUnderwater,
    marketName,
    timestamp: Date.now(),
    loanToValue: toRatio(loanToValue.toNumber()),
    limitLtv: toRatio(limitLtv),
    liquidationLtv: toRatio(stats.liquidationLtv.toNumber()),
    amounts,
  };
}

async function fetchSaveLoanStatus(
  market: string,
  obligation: string
): Promise<LoanStatusResponse> {
  const data = await fetch(
    `https://api.save.finance/user-overview?wallet=${getEnv('WALLET')}`
  ).then(res => res.json());
  const marketName = getMarketName(market);

  market = MARKETS.MAIN_SAVE.pubkey.toString(); // TODO : delete this
  obligation = OBLIGATIONS.MAIN_SAVE.pubkey.toString(); // TODO : delete this

  const marketData = data[market];
  if (!marketData || marketData.obligationID !== obligation) {
    throw new Error('Loan not found for market: ' + market + ' and obligation: ' + obligation);
  }

  const amounts: LoanAmounts[] = [];

  const reserves = marketData.deposits
    .concat(marketData.borrows)
    .map((deposit: { reserve: string }) => deposit.reserve);

  const reserveData = await fetch(`https://api.solend.fi/reserves?ids=${reserves.join(',')}`).then(
    res => res.json()
  );

  marketData.deposits.forEach(
    (deposit: { symbol: string; depositedAmount: string; reserve: string }) => {
      const reserve = reserveData.results.find(
        (r: { reserve: { pubkey: string } }) => r.reserve.pubkey === deposit.reserve
      );
      amounts.push({
        token: deposit.symbol,
        amount: parseFloat(deposit.depositedAmount).toFixed(2),
        apy: toRatio(parseFloat(reserve.rates.supplyInterest) / 100),
        reward: toRatio(
          reserve.rewards.reduce(
            (acc: number, reward: { apy: string }) => acc + parseFloat(reward.apy),
            0
          ) / 100
        ),
        direction: 'supply',
      });
    }
  );
  marketData.borrows.forEach(
    (borrow: { symbol: string; borrowedAmount: string; reserve: string }) => {
      const reserve = reserveData.results.find(
        (r: { reserve: { pubkey: string } }) => r.reserve.pubkey === borrow.reserve
      );
      amounts.push({
        token: borrow.symbol,
        amount: parseFloat(borrow.borrowedAmount).toFixed(2),
        apy: toRatio(parseFloat(reserve.rates.borrowInterest) / 100),
        reward: toRatio(
          reserve.rewards.reduce(
            (acc: number, reward: { apy: string }) => acc + parseFloat(reward.apy),
            0
          ) / 100
        ),
        direction: 'borrow',
      });
    }
  );

  return {
    isUnderwater: false,
    marketName,
    timestamp: Date.now(),
    loanToValue: toRatio(0),
    limitLtv: toRatio(0),
    liquidationLtv: toRatio(0),
    amounts,
  };
}

async function fetchDriftLoanStatus(
  rpc: string,
  market: string,
  obligation: string
): Promise<LoanStatusResponse> {
  connection = await getConnection(rpc);

  const marketName = 'Drift';

  // const privateKey = getEnv('PK');
  // const keypair = Keypair.fromSecretKey(new Uint8Array(JSON.parse(privateKey)));
  // const wallet = new Wallet(keypair);

  // const driftClient = new DriftClient({
  //   connection,
  //   wallet,
  //   env: 'mainnet-beta',
  // });

  // console.log({ driftClient });

  // await driftClient.subscribe();

  // await driftClient.emulateAccount(new PublicKey('58kZBjjtHShTtXFmygr3ZT8VSU4dH28PanRAdouHbToh'));

  // const user = driftClient.getUser();

  // const symbols = ['SOL', 'JLP', 'USDS'];

  // const spotMarkets = SpotMarkets['mainnet-beta'];
  // symbols.forEach(symbol => {
  //   const marketInfo = spotMarkets.find(market => market.symbol === symbol);
  //   const marketIndex = marketInfo?.marketIndex || 0;

  //   const tokenAmount = user.getTokenAmount(marketIndex);

  //   console.log(
  //     'symbol',
  //     symbol,
  //     'tokenAmount',
  //     tokenAmount.toNumber(),
  //     'marketIndex',
  //     marketIndex
  //   );
  // });

  console.log({ market, obligation });

  const amounts: LoanAmounts[] = [];

  return {
    isUnderwater: false,
    marketName,
    timestamp: Date.now(),
    loanToValue: toRatio(0),
    limitLtv: toRatio(0),
    liquidationLtv: toRatio(0),
    amounts,
  };
}

export async function GET(request: Request) {
  try {
    // Get URL parameters
    const { searchParams } = new URL(request.url);
    const rpc = searchParams.get('rpc') || 'Helius';
    const server = searchParams.get('server') || 'Kamino';
    const market = searchParams.get('market');
    const obligation = searchParams.get('obligation');

    if (!server || !market || !obligation) {
      return NextResponse.json(
        { error: 'Missing required parameters: server, market and obligation' },
        { status: 400 }
      );
    }

    let loanStatus: LoanStatusResponse;

    switch (server.toLowerCase()) {
      case 'kamino':
        loanStatus = await fetchKaminoLoanStatus(rpc, market, obligation);
        break;
      case 'save':
        loanStatus = await fetchSaveLoanStatus(market, obligation);
        break;
      case 'drift':
        loanStatus = await fetchDriftLoanStatus(rpc, market, obligation);
        break;
      default:
        return NextResponse.json({ error: 'Invalid server specified' }, { status: 400 });
    }

    return NextResponse.json(loanStatus, {
      headers: {
        'Cache-Control': `s-maxage=${STATUS_REFRESH_INTERVAL / 1000}`,
      },
    });
  } catch (error) {
    console.error('Error fetching loan status:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch loan status' },
      { status: 500 }
    );
  }
}
