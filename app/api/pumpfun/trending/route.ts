import { NextResponse } from 'next/server';

// DexScreener API for Solana trending tokens
const DEXSCREENER_SEARCH_API = 'https://api.dexscreener.com/latest/dex/search';

// Normalize DexScreener pair data into our Token shape
function mapDexScreenerPair(pair: any) {
  const baseToken = pair.baseToken || {};
  const priceUsd = parseFloat(pair.priceUsd) || 0;
  const priceChange24h = pair.priceChange?.h24 || 0;

  return {
    mint: baseToken.address || pair.pairAddress || '',
    name: baseToken.name || 'Unknown',
    symbol: baseToken.symbol || '???',
    image: pair.info?.imageUrl || null,
    price: priceUsd,
    price24hAgo: priceChange24h !== 0 ? priceUsd / (1 + priceChange24h / 100) : priceUsd,
    priceChange24h,
    marketCap: pair.marketCap || pair.fdv || 0,
    volume24h: pair.volume?.h24 || 0,
    liquidity: pair.liquidity?.usd || 0,
    holders: 0, // DexScreener doesn't provide holder count
    txns24h: (pair.txns?.h24?.buys || 0) + (pair.txns?.h24?.sells || 0),
    createdAt: pair.pairCreatedAt ? new Date(pair.pairCreatedAt).toISOString() : null,
    creatorWallet: '',
    platform: pair.dexId || 'Unknown',
    graduated: false,
  };
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get('category') || 'hot';
  const limit = parseInt(searchParams.get('limit') || '30', 10);

  try {
    // DexScreener search for trending Solana meme tokens
    const searchTerms: Record<string, string> = {
      hot: 'solana meme',
      new: 'solana new',
      rising: 'solana pump',
      graduated: 'solana raydium',
    };

    const searchQuery = searchTerms[category] || searchTerms.hot;
    const url = `${DEXSCREENER_SEARCH_API}?q=${encodeURIComponent(searchQuery)}`;

    const res = await fetch(url, {
      next: { revalidate: 60 },
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!res.ok) {
      throw new Error(`DexScreener API error: ${res.status}`);
    }

    const data = await res.json();
    const pairs = data.pairs || [];

    // Filter to only Solana tokens and exclude stablecoins/wrapped tokens
    const solanaTokens = pairs
      .filter((pair: any) =>
        pair.chainId === 'solana' &&
        pair.baseToken?.symbol !== 'SOL' &&
        pair.baseToken?.symbol !== 'USDC' &&
        pair.baseToken?.symbol !== 'USDT' &&
        !pair.baseToken?.name?.toLowerCase().includes('wrapped')
      )
      .map(mapDexScreenerPair)
      .filter((t: { mint: string }) => t.mint);

    // Sort by volume for 'hot', by creation date for 'new'
    if (category === 'new') {
      solanaTokens.sort((a: any, b: any) =>
        new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
      );
    } else {
      solanaTokens.sort((a: any, b: any) => b.volume24h - a.volume24h);
    }

    return NextResponse.json(solanaTokens.slice(0, limit));
  } catch (err) {
    console.error('DexScreener fetch failed:', err);

    return NextResponse.json(
      { error: 'Failed to fetch trending tokens' },
      { status: 502 }
    );
  }
}
