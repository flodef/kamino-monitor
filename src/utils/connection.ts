import { Connection } from '@solana/web3.js';
import { DEFAULT_RPC, PREFERRED_RPC_KEY } from './constants';

let connection: Connection | null = null;

export const RPC_OPTIONS = [
  { label: 'Helius' },
  { label: 'QuickNode' },
  { label: 'Ankr' },
  { label: 'Solana' },
];

export function getPreferredRpc() {
  if (typeof window === 'undefined') {
    return RPC_OPTIONS[0];
  }

  const savedRpc = localStorage.getItem(PREFERRED_RPC_KEY);
  if (!savedRpc) {
    return RPC_OPTIONS[0];
  }

  try {
    const parsed = JSON.parse(savedRpc);
    // Validate that the saved RPC is still in our options
    if (RPC_OPTIONS.some(rpc => rpc.label === parsed.label)) {
      return parsed;
    }
    return RPC_OPTIONS[0];
  } catch {
    return RPC_OPTIONS[0];
  }
}

export function setPreferredRpc(rpc: { label: string }) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(PREFERRED_RPC_KEY, JSON.stringify(rpc));
}

// This is now only used for public RPC endpoints
export function getConnection(rpcEndpoint?: string) {
  if (!connection || rpcEndpoint) {
    connection = new Connection(rpcEndpoint || DEFAULT_RPC);
  }
  return connection;
}
