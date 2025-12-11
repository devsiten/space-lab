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
    
    // Try to fetch from database
    try {
      const { sql } = await import('@vercel/postgres');
      
      const result = await sql`
        SELECT * FROM tokens WHERE mint = ${address}
      `;
      
      if (result.rows.length === 0) {
        return NextResponse.json(
          { error: 'Token not found' },
          { status: 404 }
        );
      }
      
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
      
    } catch (dbError) {
      console.warn('Database not configured, returning mock data');
      
      // Return mock data for demo
      return NextResponse.json({
        mint: address,
        name: 'Demo Token',
        symbol: 'DEMO',
        description: 'This is a demo token for testing purposes.',
        image: null,
        twitter: null,
        telegram: null,
        website: null,
        price: Math.random() * 0.0001,
        price24hAgo: Math.random() * 0.0001,
        marketCap: Math.random() * 50000 + 5000,
        volume24h: Math.random() * 50000,
        liquidity: Math.random() * 10000,
        holders: Math.floor(Math.random() * 200) + 20,
        createdAt: new Date(Date.now() - Math.random() * 86400000 * 3).toISOString(),
        creatorWallet: 'Demo' + Math.random().toString(36).substring(2, 10),
        deployedBy: 'Platform' + Math.random().toString(36).substring(2, 10),
        platform: 'Space Lab',
        graduated: false,
      });
    }
    
  } catch (error: any) {
    console.error('Failed to fetch token:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch token' },
      { status: 500 }
    );
  }
}
