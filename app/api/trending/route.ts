import { NextResponse } from 'next/server';

type Category = 'hot' | 'new' | 'gainers' | 'volume' | 'graduating';

async function getTokenDetails(addresses: string[]) {
  if (addresses.length === 0) return [];
  
  const url = `https://api.dexscreener.com/tokens/v1/solana/${addresses.join(',')}`;
  
  try {
    const res = await fetch(url, {
      headers: { 'Accept': 'application/json' },
    });
    
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

function mapPairToToken(pair: any) {
  const base = pair.baseToken ?? {};
  const price = parseFloat(pair.priceUsd ?? '0') || 0;
  const priceChange = pair.priceChange?.h24 ?? 0;
  const price24hAgo = price && typeof priceChange === 'number'
    ? price / (1 + priceChange / 100)
    : 0;

  return {
    mint: base.address ?? '',
    name: base.name ?? 'Unknown',
    symbol: base.symbol ?? '???',
    image: pair.info?.imageUrl ?? null,
    price,
    price24hAgo,
    priceChange24h: priceChange || 0,
    marketCap: pair.marketCap ?? pair.fdv ?? 0,
    volume24h: pair.volume?.h24 ?? 0,
    liquidity: pair.liquidity?.usd ?? 0,
    holders: 0,
    txns24h: (pair.txns?.h24?.buys ?? 0) + (pair.txns?.h24?.sells ?? 0),
    createdAt: pair.pairCreatedAt ? new Date(pair.pairCreatedAt).toISOString() : null,
    platform: 'DexScreener',
    boosts: pair.boosts?.active ?? 0,
  };
}

function sortByCategory(tokens: any[], category: Category) {
  switch (category) {
    case 'new':
      return tokens.sort((a, b) =>
        new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
      );
    case 'gainers':
      return tokens.sort((a, b) => (b.priceChange24h ?? 0) - (a.priceChange24h ?? 0));
    case 'volume':
      return tokens.sort((a, b) => (b.volume24h ?? 0) - (a.volume24h ?? 0));
    case 'hot':
    case 'graduating':
    default:
      return tokens.sort((a, b) => (b.boosts ?? 0) - (a.boosts ?? 0));
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const category = (searchParams.get('category') as Category) || 'hot';
  const limit = parseInt(searchParams.get('limit') || '30', 10);

  try {
    // Get boosted tokens (this is DexScreener's "trending")
    const boostRes = await fetch('https://api.dexscreener.com/token-boosts/top/v1', {
      headers: { 'Accept': 'application/json' },
      next: { revalidate: 60 },
    });

    if (!boostRes.ok) {
      throw new Error(`DexScreener error: ${boostRes.status}`);
    }

    const boostedTokens = await boostRes.json();

    // Filter Solana tokens
    const solanaTokens = (Array.isArray(boostedTokens) ? boostedTokens : [])
      .filter((t: any) => t.chainId === 'solana');

    if (solanaTokens.length === 0) {
      // Fallback: search for popular Solana pairs
      const searchRes = await fetch('https://api.dexscreener.com/latest/dex/search?q=SOL', {
        headers: { 'Accept': 'application/json' },
      });
      
      if (searchRes.ok) {
        const searchData = await searchRes.json();
        const pairs = (searchData.pairs || [])
          .filter((p: any) => p.chainId === 'solana')
          .slice(0, limit);
        
        const tokens = pairs.map(mapPairToToken).filter((t: any) => t.mint);
        const sorted = sortByCategory(tokens, category);
        return NextResponse.json(sorted);
      }
      
      return NextResponse.json([]);
    }

    // Get full details for tokens
    const addresses = solanaTokens.map((t: any) => t.tokenAddress).slice(0, 30);
    const pairs = await getTokenDetails(addresses);

    const tokens = (Array.isArray(pairs) ? pairs : [])
      .map(mapPairToToken)
      .filter((t: any) => t.mint);

    const sorted = sortByCategory(tokens, category);

    return NextResponse.json(sorted.slice(0, limit));
  } catch (error: any) {
    console.error('Trending fetch failed:', error.message);
    
    // Return empty array instead of error to prevent UI crash
    return NextResponse.json([]);
  }
}
