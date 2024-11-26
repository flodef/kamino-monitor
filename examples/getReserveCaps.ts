import { getConnection } from '../src/utils/connection';
import { MARKETS, TOKENS } from '../src/utils/constants';
import { loadReserveData } from '../src/utils/helpers';
import { ReserveArgs } from '../src/utils/models';

/**
 * Get reserve supply/borrow caps
 */
export async function getReserveCaps(args: ReserveArgs) {
  const { reserve, currentSlot } = await loadReserveData(args);

  return {
    dailySupplyCapacity: reserve.getDepositWithdrawalCapCapacity(),
    dailyBorrowCapacity: reserve.getDebtWithdrawalCapCapacity(),
    currentSupplyCapacity: reserve.getDepositWithdrawalCapCurrent(currentSlot),
    currentBorrowCapacity: reserve.getDebtWithdrawalCapCurrent(currentSlot),
    decimals: reserve.getMintFactor(),
  };
}
(async () => {
  const marketPubkey = MARKETS.MAIN.pubkey;
  const mintPubkey = TOKENS.USDS.pubkey;

  const connection = getConnection();
  console.log(`fetching data for market ${marketPubkey.toString()} token ${mintPubkey.toString()}`);
  const {
    currentSupplyCapacity,
    currentBorrowCapacity,
    dailySupplyCapacity,
    dailyBorrowCapacity,
    decimals,
  } = await getReserveCaps({ connection, marketPubkey, mintPubkey });
  console.log(`current supply capacity:`, currentSupplyCapacity.div(decimals).toFixed(2));
  console.log('current borrow capacity:', currentBorrowCapacity.div(decimals).toFixed(2));
  console.log('daily supply capacity:', dailySupplyCapacity.div(decimals).toFixed(2));
  console.log('daily borrow capacity:', dailyBorrowCapacity.div(decimals).toFixed(2));
})().catch(async e => {
  console.error(e);
});
