import { NextResponse } from 'next/server';

const SOL_MINT = 'So11111111111111111111111111111111111111112';
const JUPITER_QUOTE_API = 'https://quote-api.jup.ag/v6/quote';
const JUPITER_SWAP_API = 'https://quote-api.jup.ag/v6/swap';
const PLATFORM_FEE_BPS = 50; // 0.5%

export async function POST(request: Request) {
  try {
    const { tokenAddress, amount, userWallet } = await request.json();
    
    if (!tokenAddress || !amount || !userWallet) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    // Get quote from Jupiter
    const quoteUrl = new URL(JUPITER_QUOTE_API);
    quoteUrl.searchParams.set('inputMint', SOL_MINT);
    quoteUrl.searchParams.set('outputMint', tokenAddress);
    quoteUrl.searchParams.set('amount', amount.toString());
    quoteUrl.searchParams.set('slippageBps', '50');
    quoteUrl.searchParams.set('platformFeeBps', PLATFORM_FEE_BPS.toString());
    
    const quoteResponse = await fetch(quoteUrl.toString());
    const quote = await quoteResponse.json();
    
    if (!quoteResponse.ok || quote.error) {
      throw new Error(quote.error || 'Failed to get quote from Jupiter');
    }
    
    // Build swap request
    const swapBody: any = {
      quoteResponse: quote,
      userPublicKey: userWallet,
      wrapAndUnwrapSol: true,
      dynamicComputeUnitLimit: true,
      prioritizationFeeLamports: 'auto',
    };
    
    // Add referral account if configured
    const referralAccount = process.env.JUPITER_REFERRAL_ACCOUNT;
    if (referralAccount) {
      swapBody.feeAccount = referralAccount;
    }
    
    // Get swap transaction
    const swapResponse = await fetch(JUPITER_SWAP_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(swapBody),
    });
    
    const swapData = await swapResponse.json();
    
    if (!swapResponse.ok || swapData.error) {
      throw new Error(swapData.error || 'Failed to create swap transaction');
    }
    
    // Calculate referral earning
    const referralEarning = (amount * PLATFORM_FEE_BPS) / 10000 / 1e9; // Convert to SOL
    
    // Record trade (if database configured)
    try {
      const { sql } = await import('@vercel/postgres');
      await sql`
        INSERT INTO trades (
          token_mint, trader_wallet, type,
          amount_in, amount_out, referral_earned
        ) VALUES (
          ${tokenAddress},
          ${userWallet},
          'buy',
          ${amount},
          ${quote.outAmount},
          ${referralEarning}
        )
      `;
    } catch (dbError) {
      console.warn('Database not configured:', dbError);
    }
    
    return NextResponse.json({
      success: true,
      transaction: swapData.swapTransaction,
      expectedOutput: quote.outAmount,
      priceImpact: quote.priceImpactPct,
      referralEarning,
      route: quote.routePlan?.map((r: any) => r.swapInfo?.label).join(' → ') || 'Direct',
    });
    
  } catch (error: any) {
    console.error('Buy trade failed:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create buy transaction' },
      { status: 500 }
    );
  }
}
