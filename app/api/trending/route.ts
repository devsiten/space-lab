import { NextResponse } from 'next/server';

type Category = 'hot' | 'new' | 'gainers' | 'volume' | 'graduating';

// Popular Solana meme tokens to display
const TRENDING_TOKENS = [
  'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263', // BONK
  'EKpQGSJtjMFqKZ9KQanSqYXRcF8fBopzLHYxdM65zcjm', // WIF
  '7GCihgDB8fe6KNjn2MYtkzZcRjQy3t9GHdC8uHYmW2hr', // POPCAT
  'MEW1gQWJ3nEXg2qgERiKu7FAFj79PHvQVREQUzScPP5', // MEW
  'A8C3xuqscfmyLrte3VmTqrAq8kgMASius9AFNANwpump', // FARTCOIN
  'Grass7B4RdKfBCjTKgSqnXkqjwiGvQyFbuSCUJr3XXjs', // GRASS
  '2qEHjDLDLbuBgRYvsxhc5D6uDWAivNFZGan56P1tpump', // PNUT
  'HeLp6NuQkmYB4pYWo2zYs22mESHXPQYzXbB8n4V98jwC', // AI16Z
  'CzLSujWBLFsSjncfkh59rUFqvafWcY5tzedWJSuypump', // GOAT
  'ukHH6c7mMyiWCf1b9pnWe25TSpkDDt3H5pQZgZ74J82', // BOME
  '3S8qX1MsMqRbiwKg2cQyx7nis1oHMgaCuc9c4VfvVdPN', // MOTHER
  'ED5nyyWEzpPPiWimP8vYm7sD7TD3LAt3Q3gRTWHzPJBY', // MOODENG
  'JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN', // JUP
  '4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R', // RAY
  'orcaEKTdK7LKz57vaAYr9QeNsVEPfiu6QeMU1kektZE', // ORCA
];

async function fetchDexScreenerData(addresses: string[]) {
  try {
    const url = `https://api.dexscreener.com/tokens/v1/solana/${addresses.join(',')}`;
    const res = await fetch(url, {
      headers: { 'Accept': 'application/json' },
      next: { revalidate: 60 },
    });
    
    if (!res.ok) return [];
    return await res.json();
  } catch {
    return [];
  }
}

async function fetchHolderCount(mint: string, heliusKey: string): Promise<number> {
  try {
    const res = await fetch(`https://mainnet.helius-rpc.com/?api-key=${heliusKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'getTokenAccounts',
        params: {
          mint: mint,
          limit: 1,
          options: { showZeroBalance: false },
        },
      }),
    });
    
    const data = await res.json();
    return data.result?.total || 0;
  } catch {
    return 0;
  }
}

function mapPairToToken(pair: any) {
  const base = pair.baseToken ?? {};
  const price = parseFloat(pair.priceUsd ?? '0') || 0;
  const priceChange = pair.priceChange?.h24 ?? 0;
  
  const buys = pair.txns?.h24?.buys ?? 0;
  const sells = pair.txns?.h24?.sells ?? 0;

  return {
    mint: base.address ?? '',
    name: base.name ?? 'Unknown',
    symbol: base.symbol ?? '???',
    image: pair.info?.imageUrl ?? null,
    price,
    price24hAgo: price / (1 + priceChange / 100),
    priceChange24h: priceChange,
    marketCap: pair.marketCap ?? pair.fdv ?? 0,
    volume24h: pair.volume?.h24 ?? 0,
    liquidity: pair.liquidity?.usd ?? 0,
    holders: 0, // Will be filled by Helius
    txns24h: buys + sells,
    buys24h: buys,
    sells24h: sells,
    createdAt: pair.pairCreatedAt 
      ? new Date(pair.pairCreatedAt).toISOString() 
      : new Date().toISOString(),
    creatorWallet: '',
    platform: 'DexScreener',
  };
}

function sortTokens(tokens: any[], category: Category) {
  switch (category) {
    case 'new':
      return [...tokens].sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    case 'gainers':
      return [...tokens].sort((a, b) => b.priceChange24h - a.priceChange24h);
    case 'volume':
      return [...tokens].sort((a, b) => b.volume24h - a.volume24h);
    case 'graduating':
      return [...tokens]
        .filter(t => t.marketCap > 50000 && t.marketCap < 500000)
        .sort((a, b) => b.marketCap - a.marketCap);
    case 'hot':
    default:
      return [...tokens].sort((a, b) => b.txns24h - a.txns24h);
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const category = (searchParams.get('category') as Category) || 'hot';
  const limit = parseInt(searchParams.get('limit') || '30', 10);

  try {
    // Fetch token data from DexScreener
    const data = await fetchDexScreenerData(TRENDING_TOKENS);

    if (!data || typeof data !== 'object') {
      return NextResponse.json([]);
    }

    // DexScreener returns object with token addresses as keys
    // Each key contains an object with a pairs array
    const allPairs: any[] = [];
    Object.values(data).forEach((tokenData: any) => {
      if (tokenData?.pairs && Array.isArray(tokenData.pairs)) {
        allPairs.push(...tokenData.pairs);
      } else if (Array.isArray(tokenData)) {
        allPairs.push(...tokenData);
      }
    });

    if (allPairs.length === 0) {
      return NextResponse.json([]);
    }

    // Map to token format
    let tokens = allPairs
      .filter((p: any) => p && p.chainId === 'solana' && p.baseToken && p.baseToken.address)
      .map(mapPairToToken)
      .filter((t: any) => t.mint && t.price > 0);

    // Remove duplicates
    const seen = new Set();
    tokens = tokens.filter((t: any) => {
      if (seen.has(t.mint)) return false;
      seen.add(t.mint);
      return true;
    });

    // Fetch holder counts from Helius (optional - only if key exists)
    const heliusKey = process.env.HELIUS_API_KEY || process.env.NEXT_PUBLIC_RPC_URL?.split('api-key=')[1];
    
    if (heliusKey) {
      // Fetch holders for first 10 tokens (to avoid rate limits)
      const holdersPromises = tokens.slice(0, 10).map(async (token: any) => {
        const holders = await fetchHolderCount(token.mint, heliusKey);
        return { ...token, holders };
      });
      
      const tokensWithHolders = await Promise.all(holdersPromises);
      tokens = [...tokensWithHolders, ...tokens.slice(10)];
    }

    // Sort by category
    const sorted = sortTokens(tokens, category);

    return NextResponse.json(sorted.slice(0, limit));
  } catch (error: any) {
    console.error('Trending error:', error);
    return NextResponse.json([]);
  }
}
