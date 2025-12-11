import { NextResponse } from 'next/server';

const JUPITER_QUOTE_API = 'https://quote-api.jup.ag/v6/quote';
const PLATFORM_FEE_BPS = 50; // 0.5%

export async function POST(request: Request) {
  try {
    const { inputMint, outputMint, amount, slippageBps = 50 } = await request.json();

    if (!inputMint || !outputMint || !amount) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const quoteUrl = new URL(JUPITER_QUOTE_API);
    quoteUrl.searchParams.set('inputMint', inputMint);
    quoteUrl.searchParams.set('outputMint', outputMint);
    quoteUrl.searchParams.set('amount', amount.toString());
    quoteUrl.searchParams.set('slippageBps', slippageBps.toString());
    quoteUrl.searchParams.set('platformFeeBps', PLATFORM_FEE_BPS.toString());

    const response = await fetch(quoteUrl.toString());
    const quote = await response.json();

    if (!response.ok || quote.error) {
      throw new Error(quote.error || 'Failed to get quote');
    }

    return NextResponse.json({
      inputMint: quote.inputMint,
      outputMint: quote.outputMint,
      inAmount: quote.inAmount,
      outAmount: quote.outAmount,
      priceImpactPct: parseFloat(quote.priceImpactPct) || 0,
      route: quote.routePlan?.map((r: any) => r.swapInfo?.label).filter(Boolean).join(' → ') || 'Direct',
      platformFee: (parseInt(quote.inAmount) * PLATFORM_FEE_BPS) / 10000,
    });
  } catch (error: any) {
    console.error('Quote failed:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to get quote' },
      { status: 500 }
    );
  }
}
