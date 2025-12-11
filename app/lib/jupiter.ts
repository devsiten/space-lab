import { JUPITER_QUOTE_API, JUPITER_SWAP_API, PLATFORM_FEE_BPS, SOL_MINT } from './constants';

interface QuoteParams {
  inputMint: string;
  outputMint: string;
  amount: number;
  slippageBps?: number;
}

interface QuoteResponse {
  inputMint: string;
  outputMint: string;
  inAmount: string;
  outAmount: string;
  priceImpactPct: number;
  routePlan: any[];
  error?: string;
}

interface SwapParams {
  quoteResponse: QuoteResponse;
  userPublicKey: string;
  referralAccount?: string;
}

interface SwapResponse {
  swapTransaction: string;
  error?: string;
}

/**
 * Get quote from Jupiter
 */
export async function getJupiterQuote(params: QuoteParams): Promise<QuoteResponse> {
  const { inputMint, outputMint, amount, slippageBps = 50 } = params;
  
  const url = new URL(JUPITER_QUOTE_API);
  url.searchParams.set('inputMint', inputMint);
  url.searchParams.set('outputMint', outputMint);
  url.searchParams.set('amount', amount.toString());
  url.searchParams.set('slippageBps', slippageBps.toString());
  url.searchParams.set('platformFeeBps', PLATFORM_FEE_BPS.toString());
  
  const response = await fetch(url.toString());
  const data = await response.json();
  
  if (!response.ok || data.error) {
    throw new Error(data.error || 'Failed to get Jupiter quote');
  }
  
  return data;
}

/**
 * Get swap transaction from Jupiter with referral
 */
export async function getJupiterSwapTransaction(params: SwapParams): Promise<SwapResponse> {
  const { quoteResponse, userPublicKey, referralAccount } = params;
  
  const body: any = {
    quoteResponse,
    userPublicKey,
    wrapAndUnwrapSol: true,
    dynamicComputeUnitLimit: true,
    prioritizationFeeLamports: 'auto',
  };
  
  // Add referral account if configured
  if (referralAccount) {
    body.feeAccount = referralAccount;
  }
  
  const response = await fetch(JUPITER_SWAP_API, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  
  const data = await response.json();
  
  if (!response.ok || data.error) {
    throw new Error(data.error || 'Failed to get Jupiter swap transaction');
  }
  
  return data;
}

/**
 * Get buy quote (SOL -> Token)
 */
export async function getBuyQuote(
  tokenMint: string,
  solAmount: number,
  slippageBps?: number
): Promise<QuoteResponse> {
  return getJupiterQuote({
    inputMint: SOL_MINT,
    outputMint: tokenMint,
    amount: solAmount,
    slippageBps,
  });
}

/**
 * Get sell quote (Token -> SOL)
 */
export async function getSellQuote(
  tokenMint: string,
  tokenAmount: number,
  slippageBps?: number
): Promise<QuoteResponse> {
  return getJupiterQuote({
    inputMint: tokenMint,
    outputMint: SOL_MINT,
    amount: tokenAmount,
    slippageBps,
  });
}

/**
 * Calculate referral earning from trade amount
 */
export function calculateReferralEarning(amount: number): number {
  return (amount * PLATFORM_FEE_BPS) / 10000;
}

/**
 * Format Jupiter route for display
 */
export function formatRoute(routePlan: any[]): string {
  if (!routePlan || routePlan.length === 0) return 'Direct';
  
  return routePlan
    .map((step) => step.swapInfo?.label || 'Unknown')
    .join(' → ');
}
