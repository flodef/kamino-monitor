import { getConnection } from '../src/utils/connection';
import { MARKETS, TOKENS } from '../src/utils/constants';
import { loadReserveData } from '../src/utils/helpers';

(async () => {
  const marketPubkey = MARKETS.MAIN.pubkey;
  const mintPubkey = TOKENS.hubSOL.pubkey;

  const connection = getConnection();
  console.log(
    `fetching data for market ${marketPubkey.toString()} rewards for ${mintPubkey.toString()}`
  );
  const { market, reserve } = await loadReserveData({
    connection,
    marketPubkey,
    mintPubkey,
  });

  const prices = await market.getAllScopePrices();
  const rewardApys = await reserve.getRewardYields(prices);
  for (const rewardApy of rewardApys) {
    console.log(
      `reward token ${rewardApy.rewardInfo.token.mint.toString()} APY`,
      rewardApy.apy.toNumber(),
      'APR',
      rewardApy.apr.toNumber()
    );
  }
})().catch(async e => {
  console.error(e);
});
