import { Connection } from '@solana/web3.js';
import { DEFAULT_RPC, PREFERRED_RPC_KEY } from './constants';

let connection: Connection | null = null;

export const RPC_OPTIONS = [
  { label: 'Default RPC', url: DEFAULT_RPC },
  // Add other public RPCs here
];

export function getPreferredRpc() {
  if (typeof window === 'undefined') {
    return { label: 'Default RPC', url: DEFAULT_RPC };
  }

  const savedRpc = localStorage.getItem(PREFERRED_RPC_KEY);
  if (!savedRpc) {
    return { label: 'Default RPC', url: DEFAULT_RPC };
  }

  try {
    return JSON.parse(savedRpc);
  } catch {
    return { label: 'Default RPC', url: DEFAULT_RPC };
  }
}

export function setPreferredRpc(rpc: { label: string; url: string }) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(PREFERRED_RPC_KEY, JSON.stringify(rpc));
}

// This is now only used for public RPC endpoints
export function getConnection(rpcEndpoint?: string) {
  if (!connection || rpcEndpoint) {
    connection = new Connection(rpcEndpoint || getPreferredRpc().url);
  }
  return connection;
}
