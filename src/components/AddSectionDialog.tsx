import { useMonitorStore } from '@/store/monitorStore';
import { MARKET_OPTIONS, MARKETS, MINT_OPTIONS, OBLIGATION_OPTIONS } from '@/utils/constants';
import {
  getAvailableMarketsForToken,
  getAvailableObligationsForMarket,
  getAvailableTokensForMarket,
} from '@/utils/helpers';
import { useState } from 'react';
import CloseButton from './CloseButton';

export default function AddSectionDialog({ onClose }: { onClose: () => void }) {
  const [type, setType] = useState<'borrow' | 'loan'>('borrow');
  const [market, setMarket] = useState(MARKET_OPTIONS[0].value);
  const [mint, setMint] = useState(MINT_OPTIONS[0].value);
  const [obligation, setObligation] = useState(OBLIGATION_OPTIONS[0].value);
  const { addSection } = useMonitorStore();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (type === 'borrow') {
      addSection({ type, market, publicKey: mint });
    } else {
      addSection({ type, market, publicKey: obligation });
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
      <div className="bg-primary rounded-lg p-6 max-w-md w-full mx-4">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-semibold text-white">Add Section</h2>
          <CloseButton onClick={onClose} />
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-gray-400 mb-2">Section Type</label>
            <select
              value={type}
              onChange={e => setType(e.target.value as 'borrow' | 'loan')}
              className="w-full bg-secondary text-white rounded p-2"
            >
              <option value="borrow">Borrow Status</option>
              <option value="loan">Loan Status</option>
            </select>
          </div>

          <div>
            <label className="block text-gray-400 mb-2">Market</label>
            <select
              value={market}
              onChange={e => {
                setMarket(e.target.value);
                setMint(getAvailableTokensForMarket(e.target.value)[0].pubkey.toString());
                setObligation(
                  getAvailableObligationsForMarket(e.target.value)[0].pubkey.toString()
                );
              }}
              className="w-full bg-secondary text-white rounded p-2"
            >
              {type === 'borrow'
                ? getAvailableMarketsForToken(mint).map(option => (
                    <option key={option} value={MARKETS[option].pubkey.toString()}>
                      {MARKETS[option].label}
                    </option>
                  ))
                : Object.keys(MARKETS).map(option => (
                    <option key={option} value={MARKETS[option].pubkey.toString()}>
                      {MARKETS[option].label}
                    </option>
                  ))}
            </select>
          </div>

          {type === 'borrow' ? (
            <div>
              <label className="block text-gray-400 mb-2">Mint</label>
              <select
                value={mint}
                onChange={e => {
                  setMint(e.target.value);
                  if (type === 'borrow') {
                    setMarket(getAvailableMarketsForToken(e.target.value)[0]);
                  }
                }}
                className="w-full bg-secondary text-white rounded p-2"
              >
                {getAvailableTokensForMarket(market).map(token => (
                  <option key={token.pubkey.toString()} value={token.pubkey.toString()}>
                    {token.label}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div>
              <label className="block text-gray-400 mb-2">Obligation</label>
              <select
                value={obligation}
                onChange={e => setObligation(e.target.value)}
                className="w-full bg-secondary text-white rounded p-2"
              >
                {getAvailableObligationsForMarket(market).map(obligation => (
                  <option key={obligation.pubkey.toString()} value={obligation.pubkey.toString()}>
                    {obligation.label}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="flex justify-end gap-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
            >
              Add Section
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
