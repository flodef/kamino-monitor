import { Connection } from '@solana/web3.js';
import { DEFAULT_RPC, PREFERRED_RPC_KEY } from './constants';
import { getEnv } from './env';

export interface RpcEndpoint {
  name: string;
  url: string;
  priority: number;
}

// RPC Configuration
export function getRpcEndpoints(): RpcEndpoint[] {
  const endpoints: RpcEndpoint[] = [
    {
      name: 'Helius',
      url: process.env.NEXT_PUBLIC_HELIUS_RPC_URL || '',
      priority: 1,
    },
    {
      name: 'QuickNode',
      url: process.env.NEXT_PUBLIC_QUICKNODE_RPC_URL || '',
      priority: 2,
    },
    {
      name: 'Ankr',
      url: process.env.NEXT_PUBLIC_ANKR_RPC_URL || '',
      priority: 3,
    },
    {
      name: 'Solana',
      url: DEFAULT_RPC,
      priority: 4,
    },
  ];

  // Filter out endpoints with empty URLs except for the default Solana RPC
  return endpoints.filter(endpoint => endpoint.url || endpoint.name === 'Solana');
}

// Get the preferred RPC from localStorage or default to first available
export function getPreferredRpc(): RpcEndpoint {
  if (typeof window === 'undefined') return getRpcEndpoints()[0];

  const storedRpc = localStorage.getItem(PREFERRED_RPC_KEY);
  if (!storedRpc) return getRpcEndpoints()[0];

  try {
    const parsed = JSON.parse(storedRpc);
    const availableRpcs = getRpcEndpoints();
    const found = availableRpcs.find(rpc => rpc.name === parsed.name);
    return found || availableRpcs[0];
  } catch {
    return getRpcEndpoints()[0];
  }
}

export function setSelectedRpc(rpc: RpcEndpoint) {
  if (typeof window !== 'undefined') {
    localStorage.setItem(PREFERRED_RPC_KEY, JSON.stringify(rpc));
    // Reset connection so it will be recreated with new RPC
    connection = null;
  }
}

let connection: Connection | null = null;

export function getConnection(rpcEndpoint?: string): Connection {
  if (!connection || rpcEndpoint) {
    connection = new Connection(rpcEndpoint || getPreferredRpc().url);
  }
  return connection;
}

export function getConnection2() {
  const RPC_ENDPOINT = getEnv('NEXT_PUBLIC_HELIUS_RPC_URL');
  console.log('RPC_ENDPOINT:', RPC_ENDPOINT);
  return new Connection(RPC_ENDPOINT);
}
