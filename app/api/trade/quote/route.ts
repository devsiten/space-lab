import { NextResponse } from 'next/server';

const JUPITER_QUOTE_API = 'https://quote-api.jup.ag/v6/quote';
const PLATFORM_FEE_BPS = 50;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { inputMint, outputMint, amount, slippageBps = 100 } = body;

    if (!inputMint || !outputMint || !amount) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const quoteUrl = `${JUPITER_QUOTE_API}?inputMint=${inputMint}&outputMint=${outputMint}&amount=${amount}&slippageBps=${slippageBps}&platformFeeBps=${PLATFORM_FEE_BPS}`;

    const response = await fetch(quoteUrl, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Jupiter quote error:', errorText);
      return NextResponse.json(
        { error: 'Failed to get quote' },
        { status: 502 }
      );
    }

    const quote = await response.json();

    if (quote.error) {
      return NextResponse.json({ error: quote.error }, { status: 400 });
    }

    return NextResponse.json({
      inputMint: quote.inputMint,
      outputMint: quote.outputMint,
      inAmount: quote.inAmount,
      outAmount: quote.outAmount,
      priceImpactPct: parseFloat(quote.priceImpactPct) || 0,
      route: quote.routePlan?.map((r: any) => r.swapInfo?.label).filter(Boolean).join(' → ') || 'Direct',
    });
  } catch (error: any) {
    console.error('Quote failed:', error.message);
    return NextResponse.json(
      { error: 'Failed to get quote' },
      { status: 500 }
    );
  }
}
