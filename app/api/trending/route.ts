import { NextResponse } from 'next/server';

const DEXSCREENER_BOOSTED_API = 'https://api.dexscreener.com/token-boosts/top/v1';

type Category = 'hot' | 'new' | 'gainers' | 'volume' | 'graduating';

async function getTokenDetails(addresses: string[]) {
  const url = `https://api.dexscreener.com/tokens/v1/solana/${addresses.join(',')}`;
  const res = await fetch(url);
  if (!res.ok) return [];
  return res.json();
}

function mapPairToToken(pair: any) {
  const base = pair.baseToken ?? {};
  const price = parseFloat(pair.priceUsd ?? '0') || 0;
  const priceChange = pair.priceChange?.h24 ?? 0;
  const price24hAgo =
    price && typeof priceChange === 'number'
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
    creatorWallet: '',
    platform: 'DexScreener',
    graduated: false,
    boosts: pair.boosts?.active ?? 0,
  };
}

function sortByCategory(tokens: any[], category: Category) {
  switch (category) {
    case 'new':
      return tokens.sort(
        (a, b) =>
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
    // Get boosted/trending tokens
    const boostRes = await fetch(DEXSCREENER_BOOSTED_API, {
      next: { revalidate: 60 },
    });

    if (!boostRes.ok) {
      throw new Error(`DexScreener error ${boostRes.status}`);
    }

    const boostedTokens = await boostRes.json();

    // Filter Solana tokens only
    const solanaTokens = (Array.isArray(boostedTokens) ? boostedTokens : []).filter(
      (t: any) => t.chainId === 'solana'
    );

    if (solanaTokens.length === 0) {
      return NextResponse.json([]);
    }

    // Get full details for tokens (max 30)
    const addresses = solanaTokens.map((t: any) => t.tokenAddress).slice(0, 30);
    const pairs = await getTokenDetails(addresses);

    // Map to your token format
    const tokens = (Array.isArray(pairs) ? pairs : [])
      .map(mapPairToToken)
      .filter((t: any) => t.mint);

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

