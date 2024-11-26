import { getConnection } from '../src/utils/connection';
import { MARKETS } from '../src/utils/constants';
import { getMarket } from '../src/utils/helpers';

(async () => {
  const marketPubkey = MARKETS.MAIN.pubkey;
  const connection = getConnection();
  const market = await getMarket({ connection, marketPubkey });
  const reserves = market.getReserves();
  console.log(
    `found market ${marketPubkey.toString()} reserves:\n\n${reserves.map(x => x.address.toString()).join('\n')}`
  );

  console.log('Reserve supply and borrow APYs:\n');

  const currentSlot = await connection.getSlot();
  for (const reserve of reserves) {
    if (reserve.state.config.status === 1 || reserve.state.config.status === 2) {
      continue;
    }
    console.log(`RESERVE ${reserve.symbol}`);
    const reserveSupplyApr = reserve.calculateSupplyAPR(currentSlot, market.state.referralFeeBps);
    const reserveSupplyApy = reserve.totalSupplyAPY(currentSlot);
    const reserveBorrowApr = reserve.calculateBorrowAPR(currentSlot, market.state.referralFeeBps);
    const reserveBorrowApy = reserve.totalBorrowAPY(currentSlot);
    console.log(
      `SUPPLY APY: ${(reserveSupplyApy * 100).toFixed(2)}% APR: ${(reserveSupplyApr * 100).toFixed(2)}%`
    );
    console.log(
      `BORROW APY: ${(reserveBorrowApy * 100).toFixed(2)}% APR: ${(reserveBorrowApr * 100).toFixed(2)}%`
    );
    console.log('--------------------');
  }
})().catch(async e => {
  console.error(e);
});
