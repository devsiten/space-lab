import { NextResponse } from 'next/server';

export async function GET(
  request: Request,
  { params }: { params: { address: string } }
) {
  try {
    const { address } = params;

    if (!address) {
      return NextResponse.json(
        { error: 'Token address required' },
        { status: 400 }
      );
    }

    // Only fetch from database (Space Lab tokens only)
    const { sql } = await import('@vercel/postgres');

    const result = await sql`
      SELECT * FROM tokens 
      WHERE mint = ${address} AND platform = 'Space Lab'
    `;

    if (result.rows.length > 0) {
      const row = result.rows[0];

      return NextResponse.json({
        mint: row.mint,
        name: row.name,
        symbol: row.symbol,
        description: row.description,
        image: row.image,
        twitter: row.twitter,
        telegram: row.telegram,
        website: row.website,
        bondingCurve: row.bonding_curve,
        price: parseFloat(row.price) || 0,
        price24hAgo: parseFloat(row.price_24h_ago) || 0,
        marketCap: parseFloat(row.market_cap) || 0,
        volume24h: parseFloat(row.volume_24h) || 0,
        liquidity: parseFloat(row.liquidity) || 0,
        holders: row.holders || 0,
        createdAt: row.created_at,
        creatorWallet: row.creator_wallet,
        deployedBy: row.deployed_by,
        platform: row.platform,
        graduated: row.graduated || false,
        raydiumPool: row.raydium_pool,
      });
    }

    // Token not found in database
    return NextResponse.json(
      { error: 'Token not found' },
      { status: 404 }
    );

  } catch (error: any) {
    console.error('Failed to fetch token:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch token' },
      { status: 500 }
    );
  }
}
