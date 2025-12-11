import { NextResponse } from 'next/server';

const SOL_MINT = 'So11111111111111111111111111111111111111112';
const JUPITER_QUOTE_API = 'https://quote-api.jup.ag/v6/quote';
const JUPITER_SWAP_API = 'https://quote-api.jup.ag/v6/swap';
const PLATFORM_FEE_BPS = 50;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { tokenAddress, amount, userWallet } = body;

    if (!tokenAddress || !amount || !userWallet) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Get quote (SOL -> Token)
    const quoteUrl = `${JUPITER_QUOTE_API}?inputMint=${SOL_MINT}&outputMint=${tokenAddress}&amount=${amount}&slippageBps=100&platformFeeBps=${PLATFORM_FEE_BPS}`;

    const quoteResponse = await fetch(quoteUrl, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
    });

    if (!quoteResponse.ok) {
      console.error('Jupiter quote error:', await quoteResponse.text());
      return NextResponse.json(
        { error: 'Failed to get quote' },
        { status: 502 }
      );
    }

    const quote = await quoteResponse.json();

    if (quote.error) {
      return NextResponse.json({ error: quote.error }, { status: 400 });
    }

    // Get swap transaction
    const swapResponse = await fetch(JUPITER_SWAP_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        quoteResponse: quote,
        userPublicKey: userWallet,
        wrapAndUnwrapSol: true,
        dynamicComputeUnitLimit: true,
        prioritizationFeeLamports: 'auto',
      }),
    });

    if (!swapResponse.ok) {
      console.error('Jupiter swap error:', await swapResponse.text());
      return NextResponse.json(
        { error: 'Failed to create transaction' },
        { status: 502 }
      );
    }

    const swapData = await swapResponse.json();

    if (swapData.error) {
      return NextResponse.json({ error: swapData.error }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      transaction: swapData.swapTransaction,
      expectedOutput: quote.outAmount,
      priceImpact: quote.priceImpactPct,
    });
  } catch (error: any) {
    console.error('Buy failed:', error.message);
    return NextResponse.json(
      { error: 'Failed to create buy transaction' },
      { status: 500 }
    );
  }
}
