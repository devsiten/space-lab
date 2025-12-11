import { NextResponse } from 'next/server';

// DexScreener Token Profiles - returns top boosted/trending tokens
const DEXSCREENER_BOOSTED_API = 'https://api.dexscreener.com/token-boosts/top/v1';
const DEXSCREENER_LATEST_API = 'https://api.dexscreener.com/token-boosts/latest/v1';

// Normalize DexScreener boosted token data
function mapBoostedToken(token: any) {
  return {
    mint: token.tokenAddress || '',
    name: token.description?.split(' ')[0] || token.tokenAddress?.slice(0, 8) || 'Unknown',
    symbol: token.description?.match(/\$(\w+)/)?.[1] || '???',
    image: token.icon || null,
    url: token.url || null,
    chainId: token.chainId || 'solana',
    amount: token.amount || 0,
  };
}

// Fetch detailed pair info for tokens
async function fetchPairDetails(tokenAddresses: string[]) {
  const tokens = [];

  // Batch fetch - DexScreener allows multiple tokens
  for (const address of tokenAddresses.slice(0, 30)) {
    try {
      const res = await fetch(`https://api.dexscreener.com/latest/dex/tokens/${address}`, {
        next: { revalidate: 60 },
      });

      if (res.ok) {
        const data = await res.json();
        const pairs = data.pairs || [];
        const solanaPair = pairs.find((p: any) => p.chainId === 'solana');

        if (solanaPair) {
          const baseToken = solanaPair.baseToken || {};
          const priceUsd = parseFloat(solanaPair.priceUsd) || 0;
          const priceChange24h = solanaPair.priceChange?.h24 || 0;

          tokens.push({
            mint: baseToken.address || address,
            name: baseToken.name || 'Unknown',
            symbol: baseToken.symbol || '???',
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
            platform: solanaPair.dexId || 'Unknown',
            graduated: false,
          });
        }
      }
    } catch (err) {
      // Skip failed tokens
      continue;
    }
  }

  return tokens;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get('category') || 'hot';
  const limit = parseInt(searchParams.get('limit') || '30', 10);

  try {
    // Get boosted/trending tokens from DexScreener
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
    const solanaTokens = (Array.isArray(boostedTokens) ? boostedTokens : [])
      .filter((t: any) => t.chainId === 'solana')
      .map(mapBoostedToken);

    if (solanaTokens.length === 0) {
      return NextResponse.json([]);
    }

    // Get detailed pair info for each token
    const tokenAddresses = solanaTokens.map((t: any) => t.mint);
    const detailedTokens = await fetchPairDetails(tokenAddresses);

    // Sort by volume or creation date
    if (category === 'new') {
      detailedTokens.sort((a, b) =>
        new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
      );
    } else {
      detailedTokens.sort((a, b) => b.volume24h - a.volume24h);
    }

    return NextResponse.json(detailedTokens.slice(0, limit));
  } catch (err) {
    console.error('DexScreener fetch failed:', err);

    return NextResponse.json(
      { error: 'Failed to fetch trending tokens' },
      { status: 502 }
    );
  }
}
