import { useMonitorStore } from '@/store/monitorStore';
import { TOKENS } from '@/utils/constants';
import { useState } from 'react';
import CloseButton from './CloseButton';

const AVAILABLE_TOKENS = Object.values(TOKENS).map(token => ({
  id: token.id,
  symbol: token.label,
  mint: token.pubkey,
}));

export default function AddPriceDialog({ onClose }: { onClose: () => void }) {
  const { priceConfigs, addPriceConfig } = useMonitorStore();
  const availableTokens = AVAILABLE_TOKENS.filter(
    token => !priceConfigs.some(config => config.tokenId === token.id)
  );

  const [selectedToken, setSelectedToken] = useState(availableTokens[0]?.id.toString() || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedToken) return;

    const token = availableTokens.find(t => t.id === selectedToken);
    if (!token) return;

    addPriceConfig({
      tokenId: token.id,
      symbol: token.symbol,
    });
    onClose();
  };

  // If no tokens available, don't show the dialog
  if (availableTokens.length === 0) {
    onClose();
    return null;
  }

  return (
    <div className="z-10 fixed inset-0 bg-black/50 flex items-center justify-center">
      <div className="bg-primary rounded-lg p-6 max-w-md w-full mx-4">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-semibold text-white">Add Price</h2>
          <CloseButton onClick={onClose} />
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-gray-400 mb-2">Token</label>
            <select
              value={selectedToken}
              onChange={e => setSelectedToken(e.target.value)}
              className="w-full bg-secondary text-white rounded p-2"
            >
              {availableTokens.map(token => (
                <option key={token.id} value={token.id}>
                  {token.symbol}
                </option>
              ))}
            </select>
          </div>

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
              Add Price
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
