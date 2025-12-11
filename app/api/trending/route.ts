import { NextResponse } from 'next/server';

const DEXSCREENER_TRENDING_API = 'https://api.dexscreener.com/latest/dex/trending';

type Category = 'hot' | 'new' | 'gainers' | 'volume' | 'graduating';

function mapPairToToken(pair: any) {
  const base = pair.baseToken ?? {};
  const price = parseFloat(pair.priceUsd ?? pair.price ?? '0') || 0;
  const priceChange = pair.priceChange?.h24 ?? pair.priceChange24h ?? 0;
  const price24hAgo =
    price && typeof priceChange === 'number'
      ? price / (1 + priceChange / 100)
      : 0;

  return {
    mint: base.address ?? '',
    name: base.name ?? 'Unknown',
    symbol: base.symbol ?? '???',
    image: null,
    price,
    price24hAgo,
    priceChange24h: priceChange || 0,
    marketCap: pair.fdv ?? 0,
    volume24h: pair.volume?.h24 ?? 0,
    liquidity: pair.liquidity?.usd ?? 0,
    holders: 0,
    txns24h: pair.txns?.h24 ?? 0,
    createdAt: pair.pairCreatedAt ? new Date(pair.pairCreatedAt).toISOString() : null,
    creatorWallet: '',
    platform: 'DexScreener',
    graduated: false,
  };
}

function sortByCategory(tokens: any[], category: Category) {
  switch (category) {
    case 'new':
      return tokens.sort(
        (a, b) =>
          (new Date(b.createdAt || 0).getTime()) -
          (new Date(a.createdAt || 0).getTime())
      );
    case 'gainers':
      return tokens.sort((a, b) => (b.priceChange24h ?? 0) - (a.priceChange24h ?? 0));
    case 'volume':
      return tokens.sort((a, b) => (b.volume24h ?? 0) - (a.volume24h ?? 0));
    case 'hot':
    case 'graduating':
    default:
      // DexScreener trending is already ordered; keep as-is
      return tokens;
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const category = (searchParams.get('category') as Category) || 'hot';
  const limit = parseInt(searchParams.get('limit') || '30', 10);

  try {
    const res = await fetch(DEXSCREENER_TRENDING_API, { next: { revalidate: 60 } });
    if (!res.ok) {
      throw new Error(`DexScreener error ${res.status}`);
    }
    const data = await res.json();
    const pairs = Array.isArray(data?.pairs) ? data.pairs : Array.isArray(data) ? data : [];

    // Keep only Solana pairs
    const solPairs = pairs.filter((p: any) => p.chainId === 'solana');
    const tokens = solPairs.map(mapPairToToken).filter((t: any) => t.mint);
    const sorted = sortByCategory(tokens, category);

    return NextResponse.json(sorted.slice(0, limit));
  } catch (err) {
    console.error('Trending fetch failed:', err);
    return NextResponse.json(
      { error: 'Failed to fetch trending tokens' },
      { status: 502 }
    );
  }
}

