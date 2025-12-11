import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Try to fetch from database
    try {
      const { sql } = await import('@vercel/postgres');

      const [volumeResult, tokenResult, traderResult, earningsResult] = await Promise.all([
        sql`SELECT COALESCE(SUM(volume_24h), 0) as total FROM tokens`,
        sql`SELECT COUNT(*) as total FROM tokens`,
        sql`SELECT COUNT(DISTINCT trader_wallet) as total FROM trades WHERE created_at > NOW() - INTERVAL '24 hours'`,
        sql`SELECT COALESCE(SUM(referral_earned), 0) as total FROM trades`,
      ]);

      return NextResponse.json({
        totalVolume: Number(volumeResult.rows[0]?.total || 0),
        totalTokens: Number(tokenResult.rows[0]?.total || 0),
        totalTraders: Number(traderResult.rows[0]?.total || 0),
        totalEarnings: Number(earningsResult.rows[0]?.total || 0),
        volumeChange: 0,
      });

    } catch (dbError) {
      console.warn('Database not configured, returning zero stats');

      // Return zeros - no mock data
      return NextResponse.json({
        totalVolume: 0,
        totalTokens: 0,
        totalTraders: 0,
        totalEarnings: 0,
        volumeChange: 0,
      });
    }

  } catch (error: any) {
    console.error('Failed to fetch platform stats:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch stats' },
      { status: 500 }
    );
  }
}
