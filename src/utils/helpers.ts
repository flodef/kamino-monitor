import { FarmState, RewardInfo } from '@kamino-finance/farms-sdk';
import {
  buildAndSendTxn,
  DEFAULT_RECENT_SLOT_DURATION_MS,
  KaminoMarket,
  KaminoObligation,
  KaminoReserve,
  lamportsToNumberDecimal,
} from '@kamino-finance/klend-sdk';
import { aprToApy, KaminoPrices } from '@kamino-finance/kliquidity-sdk';
import { Scope } from '@kamino-finance/scope-sdk';
import { Connection, Keypair, PublicKey, TransactionInstruction } from '@solana/web3.js';
import { formatDistanceToNow } from 'date-fns';
import Decimal from 'decimal.js';
import { MARKETS, OBLIGATIONS, TOKENS } from './constants';
import { LoanArgs, MarketArgs, ReserveArgs } from './models';

/**
 * Get Kamino Lending Market
 * @param connection
 * @param marketPubkey
 */
export async function getMarket({ connection, marketPubkey }: MarketArgs) {
  const market = await KaminoMarket.load(connection, marketPubkey, DEFAULT_RECENT_SLOT_DURATION_MS);
  if (!market) {
    throw Error(`Could not load market ${marketPubkey.toString()}`);
  }
  return market;
}

/**
 * Get loan for loan (obligation) public key
 * @param args
 */
export async function getLoan(args: LoanArgs): Promise<KaminoObligation | null> {
  const market = await getMarket(args);
  return market.getObligationByAddress(args.obligationPubkey);
}

export async function loadReserveData({ connection, marketPubkey, mintPubkey }: ReserveArgs) {
  const market = await getMarket({ connection, marketPubkey });
  const reserve = market.getReserveByMint(mintPubkey);
  if (!reserve) {
    throw Error(`Could not load reserve for ${mintPubkey.toString()}`);
  }
  const currentSlot = await connection.getSlot();

  return { market, reserve, currentSlot };
}

/**
 * Get reserve rewards APY
 */
export async function getReserveRewardsApy(args: ReserveArgs) {
  const { market, reserve } = await loadReserveData(args);
  const rewardApys: { rewardApy: Decimal; rewardInfo: RewardInfo }[] = [];

  const oraclePrices = await new Scope('mainnet-beta', args.connection).getOraclePrices();
  const prices = await market.getAllScopePrices(oraclePrices);

  const farmStates = await FarmState.fetchMultiple(args.connection, [
    reserve.state.farmDebt,
    reserve.state.farmCollateral,
  ]);

  // We are not calculating APY for debt rewards
  const isDebtReward = false;

  for (const farmState of farmStates.filter(x => x !== null)) {
    for (const rewardInfo of farmState!.rewardInfos.filter(
      x => !x.token.mint.equals(PublicKey.default)
    )) {
      const { apy } = calculateRewardApy(prices, reserve, rewardInfo, isDebtReward);
      rewardApys.push({ rewardApy: apy, rewardInfo });
    }
  }
  return rewardApys;
}

/**
 * Get APY/APR of a farm with rewards
 * @param prices
 * @param reserve
 * @param rewardInfo
 * @param isDebtReward
 */
export function calculateRewardApy(
  prices: KaminoPrices,
  reserve: KaminoReserve,
  rewardInfo: RewardInfo,
  isDebtReward: boolean
) {
  const { decimals } = reserve.stats;
  const totalBorrows = reserve.getBorrowedAmount();
  const totalSupply = reserve.getTotalSupply();
  const mintAddress = reserve.getLiquidityMint();
  const totalAmount = isDebtReward
    ? lamportsToNumberDecimal(totalBorrows, decimals)
    : lamportsToNumberDecimal(totalSupply, decimals);
  const totalValue = totalAmount.mul(prices.spot[mintAddress.toString()].price);
  const rewardPerTimeUnitSecond = getRewardPerTimeUnitSecond(rewardInfo);
  const rewardsInYear = rewardPerTimeUnitSecond.mul(60 * 60 * 24 * 365);
  const rewardsInYearValue = rewardsInYear.mul(prices.spot[rewardInfo.token.mint.toString()].price);
  const apr = rewardsInYearValue.div(totalValue);
  return { apr, apy: aprToApy(apr, 1) };
}

function getRewardPerTimeUnitSecond(reward: RewardInfo) {
  const now = new Decimal(new Date().getTime()).div(1000);
  let rewardPerTimeUnitSecond = new Decimal(0);
  for (let i = 0; i < reward.rewardScheduleCurve.points.length - 1; i++) {
    const { tsStart: tsStartThisPoint, rewardPerTimeUnit } = reward.rewardScheduleCurve.points[i];
    const { tsStart: tsStartNextPoint } = reward.rewardScheduleCurve.points[i + 1];

    const thisPeriodStart = new Decimal(tsStartThisPoint.toString());
    const thisPeriodEnd = new Decimal(tsStartNextPoint.toString());
    const rps = new Decimal(rewardPerTimeUnit.toString());
    if (thisPeriodStart <= now && thisPeriodEnd >= now) {
      rewardPerTimeUnitSecond = rps;
      break;
    } else if (thisPeriodStart > now && thisPeriodEnd > now) {
      rewardPerTimeUnitSecond = rps;
      break;
    }
  }

  const rewardTokenDecimals = reward.token.decimals.toNumber();
  const rewardAmountPerUnitDecimals = new Decimal(10).pow(
    reward.rewardsPerSecondDecimals.toString()
  );
  const rewardAmountPerUnitLamports = new Decimal(10).pow(rewardTokenDecimals.toString());

  const rpsAdjusted = new Decimal(rewardPerTimeUnitSecond.toString())
    .div(rewardAmountPerUnitDecimals)
    .div(rewardAmountPerUnitLamports);

  return rewardPerTimeUnitSecond ? rpsAdjusted : new Decimal(0);
}

export async function executeUserSetupLutsTransactions(
  connection: Connection,
  wallet: Keypair,
  setupIxns: Array<Array<TransactionInstruction>>
) {
  for (const setupIxnsGroup of setupIxns) {
    if (setupIxnsGroup.length === 0) {
      continue;
    }
    const txHash = await buildAndSendTxn(connection, wallet, setupIxnsGroup, [], []);
    console.log('txHash', txHash);
  }
}

export function toValue(value: Decimal, reserve: KaminoReserve): string {
  return value.div(reserve.getMintFactor()).toFixed(2);
}
export function toRatio(value: number): string {
  return `${(value * 100).toFixed(2)}%`;
}

export function getMarketId(marketPubkey: string): string {
  return (
    Object.entries(MARKETS).find(entry => entry[1].pubkey.toString() === marketPubkey)?.[0] ||
    marketPubkey
  );
}
export function getMarketName(marketPubkey: string): string {
  return (
    Object.values(MARKETS).find(market => market.pubkey.toString() === marketPubkey)?.label ||
    marketPubkey
  );
}
export function getTokenName(mintPubkey: string): string {
  return (
    Object.values(TOKENS).find(token => token.pubkey.toString() === mintPubkey)?.label || mintPubkey
  );
}
export function getObligationName(obligationPubkey: string): string {
  return (
    Object.values(OBLIGATIONS).find(obligation => obligation.pubkey.toString() === obligationPubkey)
      ?.label || obligationPubkey
  );
}

export function getAvailableTokensForMarket(market: keyof typeof MARKETS) {
  return Object.values(TOKENS).filter(token => token.market.includes(getMarketId(market)));
}
export function getAvailableMarketsForToken(token: keyof typeof TOKENS) {
  return (
    Object.values(TOKENS).find(t => t.pubkey.toString() === token)?.market || Object.keys(MARKETS)
  );
}

export function getAvailableObligationsForMarket(market: keyof typeof MARKETS) {
  return Object.values(OBLIGATIONS).filter(token => token.market === getMarketId(market));
}
export function getAvailableMarketForObligation(obligation: keyof typeof OBLIGATIONS) {
  const market = Object.values(OBLIGATIONS).find(o => o.pubkey.toString() === obligation)?.market;
  return market ? [market] : Object.keys(MARKETS);
}

export function getTimeAgo(timestamp: number): string {
  const diffInSeconds = Math.floor((Date.now() - timestamp) / 1000);
  if (diffInSeconds < 60) {
    return `${diffInSeconds} seconds ago`;
  }
  return formatDistanceToNow(timestamp, { addSuffix: true });
}

/**
 * Format a public key to show first 4 and last 4 characters
 * @param pubkey The public key to format (can be string or PublicKey)
 * @returns Formatted string like "AbCd...xyZ1"
 */
export function formatPubkey(pubkey: string | PublicKey): string {
  const pubkeyStr = pubkey.toString();
  if (pubkeyStr.length <= 8) return pubkeyStr;
  return `${pubkeyStr.slice(0, 4)}...${pubkeyStr.slice(-4)}`;
}
