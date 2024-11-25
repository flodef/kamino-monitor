import { getPreferredRpc, getRpcEndpoints, setSelectedRpc } from '@/utils/connection';
import { useState } from 'react';

export default function RpcSelector() {
  const availableRpcs = getRpcEndpoints();
  const selectedRpc = getPreferredRpc();

  const [currentRpc, setCurrentRpc] = useState(selectedRpc);
  const onChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedRpc = availableRpcs.find(rpc => rpc.url === e.target.value);
    if (selectedRpc) {
      setSelectedRpc(selectedRpc);
      setCurrentRpc(selectedRpc);
    }
  };

  return (
    <div className="flex items-center space-x-2">
      <label htmlFor="rpc-select" className="text-sm font-medium text-gray-400">
        RPC Endpoint:
      </label>
      <select
        id="rpc-select"
        value={currentRpc.url}
        onChange={onChange}
        className="block w-full rounded-md border-gray-300 bg-primary text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
      >
        {availableRpcs.map(rpc => (
          <option key={rpc.url} value={rpc.url}>
            {rpc.name}
          </option>
        ))}
      </select>
    </div>
  );
}
