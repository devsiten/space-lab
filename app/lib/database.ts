import { sql } from '@vercel/postgres';

// Token interface
export interface Token {
  mint: string;
  name: string;
  symbol: string;
  description?: string;
  image?: string;
  twitter?: string;
  telegram?: string;
  website?: string;
  bondingCurve?: string;
  deployedBy: string;
  creatorWallet: string;
  platform: string;
  signature?: string;
  graduated: boolean;
  raydiumPool?: string;
  marketCap: number;
  liquidity: number;
  volume24h: number;
  holders: number;
  price: number;
  price24hAgo: number;
  txns24h: number;
  createdAt: Date;
  graduatedAt?: Date;
}

// Trade interface
export interface Trade {
  id: number;
  tokenMint: string;
  traderWallet: string;
  type: 'buy' | 'sell';
  amountIn: number;
  amountOut: number;
  price: number;
  referralEarned: number;
  signature: string;
  createdAt: Date;
}

/**
 * Get tokens by category
 */
export async function getTokensByCategory(
  category: string,
  limit: number = 30
): Promise<Token[]> {
  let query;
  
  switch (category) {
    case 'hot':
      query = sql`
        SELECT * FROM tokens 
        WHERE graduated = false 
        ORDER BY volume_24h DESC, market_cap DESC 
        LIMIT ${limit}
      `;
      break;
    case 'new':
      query = sql`
        SELECT * FROM tokens 
        ORDER BY created_at DESC 
        LIMIT ${limit}
      `;
      break;
    case 'graduating':
      query = sql`
        SELECT * FROM tokens 
        WHERE graduated = false 
        AND market_cap >= 50000 
        ORDER BY market_cap DESC 
        LIMIT ${limit}
      `;
      break;
    case 'gainers':
      query = sql`
        SELECT *, 
          CASE WHEN price_24h_ago > 0 
            THEN ((price - price_24h_ago) / price_24h_ago) * 100 
            ELSE 0 
          END as change_24h
        FROM tokens 
        WHERE price_24h_ago > 0 
        ORDER BY change_24h DESC 
        LIMIT ${limit}
      `;
      break;
    case 'volume':
      query = sql`
        SELECT * FROM tokens 
        ORDER BY volume_24h DESC 
        LIMIT ${limit}
      `;
      break;
    default:
      query = sql`
        SELECT * FROM tokens 
        ORDER BY market_cap DESC 
        LIMIT ${limit}
      `;
  }
  
  const result = await query;
  return result.rows as Token[];
}

/**
 * Get token by mint address
 */
export async function getTokenByMint(mint: string): Promise<Token | null> {
  const result = await sql`
    SELECT * FROM tokens WHERE mint = ${mint}
  `;
  
  return result.rows[0] as Token || null;
}

/**
 * Create new token
 */
export async function createToken(token: Partial<Token>): Promise<void> {
  await sql`
    INSERT INTO tokens (
      mint, name, symbol, description, image,
      twitter, telegram, website, bonding_curve,
      deployed_by, creator_wallet, platform, signature,
      created_at
    ) VALUES (
      ${token.mint},
      ${token.name},
      ${token.symbol},
      ${token.description || null},
      ${token.image || null},
      ${token.twitter || null},
      ${token.telegram || null},
      ${token.website || null},
      ${token.bondingCurve || null},
      ${token.deployedBy},
      ${token.creatorWallet},
      ${token.platform || 'Space Lab'},
      ${token.signature || null},
      NOW()
    )
  `;
}

/**
 * Record a trade
 */
export async function recordTrade(trade: Partial<Trade>): Promise<void> {
  await sql`
    INSERT INTO trades (
      token_mint, trader_wallet, type,
      amount_in, amount_out, price,
      referral_earned, signature, created_at
    ) VALUES (
      ${trade.tokenMint},
      ${trade.traderWallet},
      ${trade.type},
      ${trade.amountIn},
      ${trade.amountOut},
      ${trade.price || 0},
      ${trade.referralEarned || 0},
      ${trade.signature || null},
      NOW()
    )
  `;
}

/**
 * Update token price and stats
 */
export async function updateTokenStats(
  mint: string,
  stats: Partial<Token>
): Promise<void> {
  await sql`
    UPDATE tokens SET
      price = COALESCE(${stats.price}, price),
      market_cap = COALESCE(${stats.marketCap}, market_cap),
      volume_24h = COALESCE(${stats.volume24h}, volume_24h),
      holders = COALESCE(${stats.holders}, holders),
      liquidity = COALESCE(${stats.liquidity}, liquidity)
    WHERE mint = ${mint}
  `;
}

/**
 * Get recent trades for a token
 */
export async function getRecentTrades(
  tokenMint: string,
  limit: number = 50
): Promise<Trade[]> {
  const result = await sql`
    SELECT * FROM trades 
    WHERE token_mint = ${tokenMint}
    ORDER BY created_at DESC
    LIMIT ${limit}
  `;
  
  return result.rows as Trade[];
}

/**
 * Search tokens by name or symbol
 */
export async function searchTokens(
  query: string,
  limit: number = 20
): Promise<Token[]> {
  const searchPattern = `%${query}%`;
  
  const result = await sql`
    SELECT * FROM tokens 
    WHERE name ILIKE ${searchPattern} 
    OR symbol ILIKE ${searchPattern}
    OR mint = ${query}
    ORDER BY market_cap DESC
    LIMIT ${limit}
  `;
  
  return result.rows as Token[];
}

/**
 * Get platform statistics
 */
export async function getPlatformStats(): Promise<{
  totalVolume: number;
  totalTokens: number;
  totalTraders: number;
  totalEarnings: number;
  volumeChange: number;
}> {
  const [volumeResult, tokenResult, traderResult, earningsResult] = await Promise.all([
    sql`SELECT COALESCE(SUM(volume_24h), 0) as total FROM tokens`,
    sql`SELECT COUNT(*) as total FROM tokens`,
    sql`SELECT COUNT(DISTINCT trader_wallet) as total FROM trades WHERE created_at > NOW() - INTERVAL '24 hours'`,
    sql`SELECT COALESCE(SUM(referral_earned), 0) as total FROM trades`,
  ]);
  
  return {
    totalVolume: Number(volumeResult.rows[0]?.total || 0),
    totalTokens: Number(tokenResult.rows[0]?.total || 0),
    totalTraders: Number(traderResult.rows[0]?.total || 0),
    totalEarnings: Number(earningsResult.rows[0]?.total || 0),
    volumeChange: 0, // Calculate from historical data
  };
}
