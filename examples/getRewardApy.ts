import { loadReserveData } from '../src/utils/helpers';
import { getConnection } from '../src/utils/connection';
import { JITO_MARKET, MAIN_MARKET, PYUSD_MINT, SOL_MINT, USDS_MINT } from '../src/utils/constants';

(async () => {
  const marketPubKey = JITO_MARKET;
  const mintPubKey = SOL_MINT;

  const connection = getConnection();
  console.log(
    `fetching data for market ${marketPubKey.toString()} reserve for ${mintPubKey.toString()}`
  );
  const { market, reserve } = await loadReserveData({
    connection,
    marketPubkey: marketPubKey,
    mintPubkey: mintPubKey,
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
