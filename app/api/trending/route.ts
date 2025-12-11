import { NextResponse } from 'next/server';
import { getTokensByCategory } from '@/lib/database';

type Category = 'hot' | 'new' | 'gainers' | 'volume' | 'graduating';

function mapDatabaseTokenToTokenFormat(dbToken: any) {
  const priceChange24h = dbToken.price_24h_ago && dbToken.price_24h_ago > 0
    ? ((dbToken.price - dbToken.price_24h_ago) / dbToken.price_24h_ago) * 100
    : 0;

  return {
    mint: dbToken.mint,
    name: dbToken.name,
    symbol: dbToken.symbol,
    image: dbToken.image || null,
    price: Number(dbToken.price) || 0,
    price24hAgo: Number(dbToken.price_24h_ago) || 0,
    priceChange24h,
    marketCap: Number(dbToken.market_cap) || 0,
    volume24h: Number(dbToken.volume_24h) || 0,
    liquidity: Number(dbToken.liquidity) || 0,
    holders: Number(dbToken.holders) || 0,
    txns24h: Number(dbToken.txns_24h) || 0,
    createdAt: dbToken.created_at ? new Date(dbToken.created_at).toISOString() : new Date().toISOString(),
    creatorWallet: dbToken.creator_wallet || '',
    platform: dbToken.platform || 'Space Lab',
    graduated: dbToken.graduated || false,
  };
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const category = (searchParams.get('category') as Category) || 'hot';
  const limit = parseInt(searchParams.get('limit') || '30', 10);

  try {
    // Fetch tokens from database (only tokens launched on this platform)
    const dbTokens = await getTokensByCategory(category, limit);

    if (!dbTokens || dbTokens.length === 0) {
      return NextResponse.json([]);
    }

    // Map database tokens to frontend format
    const tokens = dbTokens.map(mapDatabaseTokenToTokenFormat);

    return NextResponse.json(tokens);
  } catch (error: any) {
    console.error('Trending fetch failed:', error.message);
    return NextResponse.json([]);
  }
}
