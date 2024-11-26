import { getConnection } from '../src/utils/connection';
import { MARKETS, TOKENS } from '../src/utils/constants';
import { loadReserveData } from '../src/utils/helpers';

(async () => {
  const marketPubkey = MARKETS.MAIN.pubkey;
  const mintPubkey = TOKENS.USDS.pubkey;

  const connection = getConnection();
  console.log(
    `fetching data for market ${marketPubkey.toString()} reserve for ${mintPubkey.toString()}`
  );
  const { market, reserve } = await loadReserveData({
    connection,
    marketPubkey,
    mintPubkey,
  });
  const decimals = reserve.getMintFactor();
  const { globalDebtCap, globalTotalBorrowed } = reserve.getBorrowCapForReserve(market);
  console.log(
    globalDebtCap.div(decimals).toFixed(2),
    globalTotalBorrowed.div(decimals).toFixed(2),
    globalTotalBorrowed.lt(globalDebtCap)
  );
})().catch(async e => {
  console.error(e);
});
