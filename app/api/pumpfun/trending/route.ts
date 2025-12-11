import { NextResponse } from 'next/server';

// Public Pump.fun frontend feed (community-documented)
// This may change; we wrap in try/catch and return a safe fallback.
const PUMP_FUN_TRENDING_API = 'https://frontend-api.pump.fun/trending';
const PUMP_FUN_NEW_API = 'https://frontend-api.pump.fun/recent';

// Normalize Pump.fun token data into our Token shape
function mapPumpFunToken(token: any) {
  const price = token.price_usd ?? token.price ?? 0;
  const price24hAgo =
    token.price_usd_24h_ago ??
    token.price24hAgo ??
    (price && token.price_change_24h
      ? price / (1 + token.price_change_24h / 100)
      : 0);

  return {
    mint: token.mint ?? token.address ?? token.mintAddress ?? '',
    name: token.name ?? token.token ?? 'Unknown',
    symbol: token.symbol ?? token.ticker ?? '???',
    image: token.image_uri ?? token.image ?? null,
    price,
    price24hAgo,
    priceChange24h: token.price_change_24h ?? token.priceChange24h ?? 0,
    marketCap:
      token.usd_market_cap ??
      token.market_cap ??
      (token.liquidity_usd && token.fd_mc ? token.fd_mc : 0) ??
      0,
    volume24h:
      token.usd_volume_24h ??
      token.volume_24h ??
      token.volume24h ??
      token.usd_volume ?? 0,
    liquidity: token.usd_liquidity ?? token.liquidity_usd ?? token.liquidity ?? 0,
    holders: token.holder_count ?? token.holders ?? 0,
    txns24h: token.transactions_24h ?? token.txns24h ?? 0,
    createdAt: token.created_timestamp ?? token.created_at ?? token.createdAt ?? null,
    creatorWallet: token.creator ?? token.owner ?? token.creator_wallet ?? '',
    platform: 'Pump.fun',
    graduated: false,
  };
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get('category') || 'hot';
  const limit = parseInt(searchParams.get('limit') || '30', 10);

  try {
    let apiUrl = PUMP_FUN_TRENDING_API;
    if (category === 'new') apiUrl = PUMP_FUN_NEW_API;

    const url = new URL(apiUrl);
    url.searchParams.set('limit', String(limit));

    const res = await fetch(url.toString(), { next: { revalidate: 60 } });
    if (!res.ok) {
      throw new Error(`Pump.fun API error: ${res.status}`);
    }

    const data = await res.json();
    const tokensRaw = Array.isArray(data) ? data : data.tokens || data.items || [];
    const tokens = tokensRaw.map(mapPumpFunToken).filter((t) => t.mint);

    return NextResponse.json(tokens.slice(0, limit));
  } catch (err) {
    console.error('Pump.fun fetch failed:', err);

    // Surface error to caller; no mock fallback
    return NextResponse.json(
      { error: 'Failed to fetch Pump.fun data' },
      { status: 502 }
    );
  }
}

