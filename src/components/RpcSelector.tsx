import { RPC_OPTIONS, getPreferredRpc, setPreferredRpc } from '@/utils/connection';
import { useMonitorStore } from '@/store/monitorStore';
import { useState } from 'react';

export default function RpcSelector() {
  const [isConnecting, setIsConnecting] = useState(false);
  const { selectedRpc, setSelectedRpc } = useMonitorStore();

  const handleChange = async (event: React.ChangeEvent<HTMLSelectElement>) => {
    const selected = RPC_OPTIONS.find(rpc => rpc.label === event.target.value);
    if (!selected) return;

    setIsConnecting(true);
    try {
      const response = await fetch('/api/connection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rpcLabel: selected.label }),
      });

      if (!response.ok) {
        throw new Error('Failed to connect to RPC');
      }

      setSelectedRpc(selected.label);
      setPreferredRpc(selected);
    } catch (error) {
      console.error('Error switching RPC:', error);
      // Revert to previous selection
      setSelectedRpc(getPreferredRpc().label);
    } finally {
      setIsConnecting(false);
    }
  };

  return (
    <div className="flex items-center justify-end gap-2">
      <label htmlFor="rpc-select" className="text-white">
        RPC:
      </label>
      <select
        id="rpc-select"
        value={selectedRpc}
        onChange={handleChange}
        disabled={isConnecting}
        className={`bg-primary text-white p-2 rounded-lg border border-gray-700 ${
          isConnecting ? 'opacity-50 cursor-not-allowed' : ''
        }`}
      >
        {RPC_OPTIONS.map(({ label }) => (
          <option key={label} value={label}>
            {label}
          </option>
        ))}
      </select>
    </div>
  );
}
