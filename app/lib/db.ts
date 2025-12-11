import { neon } from '@neondatabase/serverless';

// Get SQL client for Neon database
export function getDb() {
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
        throw new Error('DATABASE_URL environment variable is not set');
    }
    return neon(databaseUrl);
}

// Token type definitions
export interface Token {
    mint: string;
    name: string;
    symbol: string;
    description: string | null;
    image: string | null;
    twitter: string | null;
    telegram: string | null;
    website: string | null;
    bonding_curve: string | null;
    deployed_by: string;
    creator_wallet: string;
    platform: string;
    signature: string | null;
    graduated: boolean;
    raydium_pool: string | null;
    market_cap: number;
    liquidity: number;
    volume_24h: number;
    holders: number;
    txns_24h: number;
    price: number;
    price_24h_ago: number;
    created_at: Date;
    graduated_at: Date | null;
}

export interface Trade {
    id: number;
    token_mint: string;
    trader_wallet: string;
    type: 'buy' | 'sell';
    amount_in: number;
    amount_out: number;
    price: number;
    referral_earned: number;
    signature: string | null;
    created_at: Date;
}

export interface PlatformStats {
    total_volume: number;
    total_tokens: number;
    graduated_tokens: number;
    our_tokens: number;
}

// Database operations
export async function getTokenByMint(mint: string): Promise<Token | null> {
    const sql = getDb();
    const result = await sql`SELECT * FROM tokens WHERE mint = ${mint}`;
    return result[0] as Token || null;
}

export async function getTrendingTokens(limit = 50): Promise<Token[]> {
    const sql = getDb();
    const result = await sql`SELECT * FROM trending_tokens LIMIT ${limit}`;
    return result as Token[];
}

export async function getPlatformStats(): Promise<PlatformStats> {
    const sql = getDb();
    const result = await sql`SELECT * FROM platform_stats`;
    return result[0] as PlatformStats || {
        total_volume: 0,
        total_tokens: 0,
        graduated_tokens: 0,
        our_tokens: 0
    };
}

export async function getTradesForToken(tokenMint: string, limit = 50): Promise<Trade[]> {
    const sql = getDb();
    const result = await sql`
    SELECT * FROM trades 
    WHERE token_mint = ${tokenMint} 
    ORDER BY created_at DESC 
    LIMIT ${limit}
  `;
    return result as Trade[];
}

export async function insertTrade(trade: Omit<Trade, 'id' | 'created_at'>): Promise<void> {
    const sql = getDb();
    await sql`
    INSERT INTO trades (token_mint, trader_wallet, type, amount_in, amount_out, price, referral_earned, signature)
    VALUES (${trade.token_mint}, ${trade.trader_wallet}, ${trade.type}, ${trade.amount_in}, ${trade.amount_out}, ${trade.price}, ${trade.referral_earned}, ${trade.signature})
  `;
}
