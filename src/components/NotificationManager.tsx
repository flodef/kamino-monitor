import { showNotification } from '@/utils/notification';
import { useEffect, useRef } from 'react';

type Props = {
  loanInfo?: Array<{
    marketName: string;
    tokenName: string;
    loanToValue: string;
    isUnderwater: boolean;
  }>;
  borrowInfo?: Array<{
    marketName: string;
    tokenName: string;
    quantity: string;
    isBuyable: boolean;
  }>;
};

export function NotificationManager({ loanInfo, borrowInfo }: Props) {
  // Use refs to track previous states to avoid duplicate notifications
  const prevUnderwaterStates = useRef<{ [key: string]: boolean }>({});
  const prevBuyableStates = useRef<{ [key: string]: boolean }>({});

  useEffect(() => {
    if (loanInfo) {
      loanInfo.forEach(loan => {
        const key = `${loan.marketName}-${loan.tokenName}`;
        const wasUnderwater = prevUnderwaterStates.current[key];

        // Only notify if state changed to underwater
        if (loan.isUnderwater && !wasUnderwater) {
          showNotification({
            title: '⚠️ Loan Alert',
            body: `Your loan in ${loan.marketName} market is underwater! LTV: ${loan.loanToValue}`,
          });
        }

        // Update previous state
        prevUnderwaterStates.current[key] = loan.isUnderwater;
      });
    }
  }, [loanInfo]);

  useEffect(() => {
    if (borrowInfo) {
      borrowInfo.forEach(borrow => {
        const key = `${borrow.marketName}-${borrow.tokenName}`;
        const wasBuyable = prevBuyableStates.current[key];

        // Only notify if state changed to buyable
        if (borrow.isBuyable && !wasBuyable) {
          showNotification({
            title: '💰 Buyable Alert',
            body: `${borrow.tokenName} in ${borrow.marketName} market is buyable! Quantity: ${borrow.quantity}`,
          });
        }

        // Update previous state
        prevBuyableStates.current[key] = borrow.isBuyable;
      });
    }
  }, [borrowInfo]);

  // This component doesn't render anything
  return null;
}
