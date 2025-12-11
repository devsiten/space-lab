import { NextResponse } from 'next/server';

// DexScreener API for trending Solana tokens
const DEXSCREENER_BOOSTED_API = 'https://api.dexscreener.com/token-boosts/top/v1';
const DEXSCREENER_LATEST_API = 'https://api.dexscreener.com/token-boosts/latest/v1';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category') || 'hot';
    const limit = parseInt(searchParams.get('limit') || '30');

    // First try database for Space Lab tokens
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
        default:
          query = await sql`
            SELECT * FROM tokens 
            ORDER BY market_cap DESC 
            LIMIT ${limit}
          `;
      }

      if (query.rows.length > 0) {
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
      }
    } catch (dbError) {
      // Database not configured - fall through to DexScreener
      console.warn('Database not configured, using DexScreener');
    }

    // Fallback to DexScreener for real live tokens
    const apiUrl = category === 'new' ? DEXSCREENER_LATEST_API : DEXSCREENER_BOOSTED_API;

    const res = await fetch(apiUrl, {
      next: { revalidate: 60 },
      headers: { 'Accept': 'application/json' },
    });

    if (!res.ok) {
      throw new Error(`DexScreener API error: ${res.status}`);
    }

    const boostedTokens = await res.json();

    // Filter to only Solana tokens
    const solanaTokenAddresses = (Array.isArray(boostedTokens) ? boostedTokens : [])
      .filter((t: any) => t.chainId === 'solana')
      .map((t: any) => t.tokenAddress)
      .slice(0, limit);

    if (solanaTokenAddresses.length === 0) {
      return NextResponse.json([]);
    }

    // Fetch detailed pair info for each token
    const detailedTokens = [];
    for (const address of solanaTokenAddresses) {
      try {
        const pairRes = await fetch(`https://api.dexscreener.com/latest/dex/tokens/${address}`, {
          next: { revalidate: 60 },
        });

        if (pairRes.ok) {
          const pairData = await pairRes.json();
          const pairs = pairData.pairs || [];
          const solanaPair = pairs.find((p: any) => p.chainId === 'solana');

          if (solanaPair) {
            const baseToken = solanaPair.baseToken || {};
            const priceUsd = parseFloat(solanaPair.priceUsd) || 0;
            const priceChange24h = solanaPair.priceChange?.h24 || 0;

            detailedTokens.push({
              mint: baseToken.address || address,
              name: baseToken.name || 'Unknown',
              symbol: baseToken.symbol || '???',
              description: null,
              image: solanaPair.info?.imageUrl || null,
              price: priceUsd,
              price24hAgo: priceChange24h !== 0 ? priceUsd / (1 + priceChange24h / 100) : priceUsd,
              priceChange24h,
              marketCap: solanaPair.marketCap || solanaPair.fdv || 0,
              volume24h: solanaPair.volume?.h24 || 0,
              liquidity: solanaPair.liquidity?.usd || 0,
              holders: 0,
              txns24h: (solanaPair.txns?.h24?.buys || 0) + (solanaPair.txns?.h24?.sells || 0),
              createdAt: solanaPair.pairCreatedAt ? new Date(solanaPair.pairCreatedAt).toISOString() : null,
              creatorWallet: '',
              deployedBy: '',
              platform: solanaPair.dexId || 'DexScreener',
              graduated: false,
            });
          }
        }
      } catch {
        continue;
      }
    }

    // Sort by volume
    detailedTokens.sort((a, b) => b.volume24h - a.volume24h);

    return NextResponse.json(detailedTokens.slice(0, limit));

  } catch (error: any) {
    console.error('Failed to fetch trending tokens:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch tokens' },
      { status: 500 }
    );
  }
}
