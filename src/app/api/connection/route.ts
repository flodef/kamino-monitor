import { Connection } from '@solana/web3.js';
import { NextResponse } from 'next/server';
import { getEnv } from '@/utils/env';

let connection: Connection | null = null;

function getServerConnection() {
  if (!connection) {
    const rpcUrl = getEnv('HELIUS_RPC_URL');
    connection = new Connection(rpcUrl);
  }
  return connection;
}

export async function GET() {
  try {
    const connection = getServerConnection();

    return NextResponse.json(
      { status: 'ok', connection },
      {
        headers: {
          'Cache-Control': 's-maxage=30',
        },
      }
    );
  } catch (error) {
    console.error('Connection error:', error);
    return NextResponse.json({ error: 'Failed to establish connection' }, { status: 500 });
  }
}
