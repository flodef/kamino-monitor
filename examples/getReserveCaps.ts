import { ReserveArgs } from '../src/utils/models';
import { MAIN_MARKET, USDS_MINT } from '../src/utils/constants';
import { getConnection } from '../src/utils/connection';
import { loadReserveData } from '../src/utils/helpers';

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
  const connection = getConnection();
  console.log(`fetching data for market ${MAIN_MARKET.toString()} token ${USDS_MINT.toString()}`);
  const {
    currentSupplyCapacity,
    currentBorrowCapacity,
    dailySupplyCapacity,
    dailyBorrowCapacity,
    decimals,
  } = await getReserveCaps({ connection, marketPubkey: MAIN_MARKET, mintPubkey: USDS_MINT });
  console.log(`current supply capacity:`, currentSupplyCapacity.div(decimals).toFixed(2));
  console.log('current borrow capacity:', currentBorrowCapacity.div(decimals).toFixed(2));
  console.log('daily supply capacity:', dailySupplyCapacity.div(decimals).toFixed(2));
  console.log('daily borrow capacity:', dailyBorrowCapacity.div(decimals).toFixed(2));
})().catch(async e => {
  console.error(e);
});
