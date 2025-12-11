import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category') || 'hot';
    const limit = parseInt(searchParams.get('limit') || '30');
    
    // Try to fetch from database
    try {
      const { sql } = await import('@vercel/postgres');
      
      let query;
      switch (category) {
        case 'hot':
          query = await sql`
            SELECT * FROM tokens 
            WHERE graduated = false 
            ORDER BY volume_24h DESC, market_cap DESC 
            LIMIT ${limit}
          `;
          break;
        case 'new':
          query = await sql`
            SELECT * FROM tokens 
            ORDER BY created_at DESC 
            LIMIT ${limit}
          `;
          break;
        case 'graduating':
          query = await sql`
            SELECT * FROM tokens 
            WHERE graduated = false 
            AND market_cap >= 50000 
            ORDER BY market_cap DESC 
            LIMIT ${limit}
          `;
          break;
        case 'gainers':
          query = await sql`
            SELECT *, 
              CASE WHEN price_24h_ago > 0 
                THEN ((price - price_24h_ago) / price_24h_ago) * 100 
                ELSE 0 
              END as price_change_24h
            FROM tokens 
            WHERE price_24h_ago > 0 
            ORDER BY price_change_24h DESC 
            LIMIT ${limit}
          `;
          break;
        case 'volume':
          query = await sql`
            SELECT * FROM tokens 
            ORDER BY volume_24h DESC 
            LIMIT ${limit}
          `;
          break;
        default:
          query = await sql`
            SELECT * FROM tokens 
            ORDER BY market_cap DESC 
            LIMIT ${limit}
          `;
      }
      
      const tokens = query.rows.map(row => ({
        mint: row.mint,
        name: row.name,
        symbol: row.symbol,
        description: row.description,
        image: row.image,
        price: parseFloat(row.price) || 0,
        price24hAgo: parseFloat(row.price_24h_ago) || 0,
        priceChange24h: row.price_change_24h || 0,
        marketCap: parseFloat(row.market_cap) || 0,
        volume24h: parseFloat(row.volume_24h) || 0,
        liquidity: parseFloat(row.liquidity) || 0,
        holders: row.holders || 0,
        txns24h: row.txns_24h || 0,
        createdAt: row.created_at,
        creatorWallet: row.creator_wallet,
        deployedBy: row.deployed_by,
        platform: row.platform,
        graduated: row.graduated || false,
      }));
      
      return NextResponse.json(tokens);
      
    } catch (dbError) {
      console.warn('Database not configured, returning mock data');
      return NextResponse.json(generateMockTokens(category, limit));
    }
    
  } catch (error: any) {
    console.error('Failed to fetch trending tokens:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch tokens' },
      { status: 500 }
    );
  }
}

function generateMockTokens(category: string, limit: number) {
  const names = [
    'DogeMoon', 'CatRocket', 'PepeCash', 'ShibaKing', 'FlokiGold',
    'BonkMaster', 'WifHat', 'PopcatSOL', 'MemeKing', 'SolDoge',
    'LunaCat', 'MarsApe', 'CryptoFrog', 'DiamondHands', 'RocketFuel'
  ];
  
  return names.slice(0, Math.min(limit, names.length)).map((name, i) => {
    const basePrice = Math.random() * 0.0001;
    const price24hAgo = basePrice * (1 + (Math.random() - 0.5) * 0.3);
    const priceChange = ((basePrice - price24hAgo) / price24hAgo) * 100;
    
    return {
      mint: `mock${i}${Math.random().toString(36).substring(7)}`,
      name,
      symbol: name.substring(0, 4).toUpperCase(),
      description: `${name} is the next big memecoin on Solana!`,
      image: null,
      price: basePrice,
      price24hAgo,
      priceChange24h: priceChange,
      marketCap: Math.random() * 50000 + 1000,
      volume24h: Math.random() * 100000,
      liquidity: Math.random() * 20000,
      holders: Math.floor(Math.random() * 500) + 10,
      txns24h: Math.floor(Math.random() * 1000),
      createdAt: new Date(Date.now() - Math.random() * 86400000 * 7).toISOString(),
      creatorWallet: 'Demo' + Math.random().toString(36).substring(2, 10),
      deployedBy: 'Platform' + Math.random().toString(36).substring(2, 10),
      platform: i % 3 === 0 ? 'Space Lab' : 'PumpFun',
      graduated: false,
    };
  });
}
