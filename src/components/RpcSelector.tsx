import { RPC_OPTIONS, getPreferredRpc, setPreferredRpc } from '@/utils/connection';
import { useState, useEffect } from 'react';

export default function RpcSelector() {
  const [selectedRpc, setSelectedRpc] = useState(getPreferredRpc());

  const handleChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const selected = RPC_OPTIONS.find(rpc => rpc.url === event.target.value);
    if (selected) {
      setSelectedRpc(selected);
      setPreferredRpc(selected);
      window.location.reload(); // Reload to use new RPC
    }
  };

  return (
    <div className="flex items-center gap-2">
      <label htmlFor="rpc-select" className="text-white">
        RPC:
      </label>
      <select
        id="rpc-select"
        value={selectedRpc.url}
        onChange={handleChange}
        className="bg-primary text-white p-2 rounded-lg border border-gray-700"
      >
        {RPC_OPTIONS.map(rpc => (
          <option key={rpc.url} value={rpc.url}>
            {rpc.label}
          </option>
        ))}
      </select>
    </div>
  );
}
