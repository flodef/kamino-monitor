import { NextResponse } from 'next/server';

async function fetchJupiterPrices(mints: string[]) {
  try {
    const response = await fetch(`https://api.jup.ag/price/v2?ids=${mints.join(',')}`);
    if (!response.ok) throw new Error('Failed to fetch Jupiter prices');
    const data = await response.json();
    return data.data || {};
  } catch (error) {
    console.error('Error fetching Jupiter prices:', error);
    return {};
  }
}

async function fetchCoinGeckoPrice(tokenId: string) {
  try {
    const response = await fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=${tokenId}&vs_currencies=usd`
    );
    if (!response.ok) throw new Error('Failed to fetch CoinGecko price');
    const data = await response.json();
    return data[tokenId]?.usd;
  } catch (error) {
    console.error('Error fetching CoinGecko price:', error);
    return null;
  }
}

export async function POST(request: Request) {
  try {
    const { tokens } = await request.json();
    const prices: Record<string, { price: number; timestamp: number }> = {};
    const timestamp = Date.now();

    // Get all mint addresses for batch Jupiter request
    const mints = tokens.map((config: any) => config.mint?.toString()).filter(Boolean);

    // Fetch all prices from Jupiter at once
    const jupiterPrices = await fetchJupiterPrices(mints);

    // Process results and fetch missing prices from CoinGecko
    for (const config of tokens) {
      try {
        // Try Jupiter price first
        const jupiterPrice = jupiterPrices[config.mint];
        if (jupiterPrice) {
          prices[config.id] = {
            price: parseFloat(jupiterPrice.price),
            timestamp,
          };
          continue;
        }

        // Fallback to CoinGecko
        const geckoPrice = await fetchCoinGeckoPrice(config.id);
        if (geckoPrice) {
          prices[config.id] = {
            price: geckoPrice,
            timestamp,
          };
        }
      } catch (error) {
        console.error(`Error fetching price for ${config.id}:`, error);
      }
    }

    return NextResponse.json({ prices });
  } catch (error) {
    console.error('Error processing price request:', error);
    return NextResponse.json({ error: 'Failed to fetch prices' }, { status: 500 });
  }
}
