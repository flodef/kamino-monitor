import { Connection } from '@solana/web3.js';
import { NextResponse } from 'next/server';
import { getEnv } from '@/utils/env';
import { DEFAULT_RPC } from '@/utils/constants';

let connections: { [key: string]: Connection } = {};

function getRpcUrl(label: string): string {
  switch (label) {
    case 'Helius':
      return getEnv('HELIUS_RPC_URL');
    case 'QuickNode':
      return getEnv('QUICKNODE_RPC_URL');
    case 'Ankr':
      return getEnv('ANKR_RPC_URL');
    case 'Solana':
      return DEFAULT_RPC;
    default:
      return DEFAULT_RPC;
  }
}

function getServerConnection(rpcLabel: string) {
  if (!connections[rpcLabel]) {
    const rpcUrl = getRpcUrl(rpcLabel);
    connections[rpcLabel] = new Connection(rpcUrl);
  }
  return connections[rpcLabel];
}

export async function POST(request: Request) {
  try {
    const { rpcLabel } = await request.json();
    if (!rpcLabel) {
      return NextResponse.json({ error: 'RPC label is required' }, { status: 400 });
    }

    const connection = getServerConnection(rpcLabel);
    if (!connection.rpcEndpoint) {
      return NextResponse.json({ error: 'Failed to connect to RPC' }, { status: 500 });
    }

    return NextResponse.json({
      status: 'ok',
      rpcEndpoint: connection.rpcEndpoint,
    });
  } catch (error) {
    console.error('Error in connection API:', error);
    return NextResponse.json({ error: 'Failed to connect to RPC' }, { status: 500 });
  }
}
