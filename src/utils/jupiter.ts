interface JupiterPriceData {
  id: string;
  type: string;
  price: string;
}

interface JupiterPriceResponse {
  data: {
    [key: string]: JupiterPriceData;
  };
  timeTaken: number;
}

export async function getJupiterPrices(mintIds: string[]): Promise<{ [key: string]: number }> {
  try {
    const response = await fetch(`https://api.jup.ag/price/v2?ids=${mintIds.join(',')}`);
    if (!response.ok) {
      throw new Error(`Jupiter API error: ${response.statusText}`);
    }

    const data: JupiterPriceResponse = await response.json();
    const prices: { [key: string]: number } = {};

    Object.entries(data.data).forEach(([mintId, priceData]) => {
      prices[mintId] = parseFloat(priceData.price);
    });

    return prices;
  } catch (error) {
    console.error('Error fetching Jupiter prices:', error);
    throw error;
  }
}
