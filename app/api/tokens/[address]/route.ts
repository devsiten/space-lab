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

    // First try database for Space Lab tokens
    try {
      const { sql } = await import('@vercel/postgres');

      const result = await sql`
        SELECT * FROM tokens WHERE mint = ${address}
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
    } catch (dbError) {
      console.warn('Database not configured, using DexScreener');
    }

    // Fallback to DexScreener for real token data
    const dexRes = await fetch(`https://api.dexscreener.com/latest/dex/tokens/${address}`, {
      next: { revalidate: 60 },
    });

    if (dexRes.ok) {
      const dexData = await dexRes.json();
      const pairs = dexData.pairs || [];
      const solanaPair = pairs.find((p: any) => p.chainId === 'solana');

      if (solanaPair) {
        const baseToken = solanaPair.baseToken || {};
        const priceUsd = parseFloat(solanaPair.priceUsd) || 0;
        const priceChange24h = solanaPair.priceChange?.h24 || 0;

        return NextResponse.json({
          mint: baseToken.address || address,
          name: baseToken.name || 'Unknown Token',
          symbol: baseToken.symbol || '???',
          description: null,
          image: solanaPair.info?.imageUrl || null,
          twitter: solanaPair.info?.socials?.find((s: any) => s.type === 'twitter')?.url || null,
          telegram: solanaPair.info?.socials?.find((s: any) => s.type === 'telegram')?.url || null,
          website: solanaPair.info?.websites?.[0]?.url || null,
          price: priceUsd,
          price24hAgo: priceChange24h !== 0 ? priceUsd / (1 + priceChange24h / 100) : priceUsd,
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

    // Token not found anywhere
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
