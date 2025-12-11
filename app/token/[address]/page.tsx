'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { TradingPanel } from '@/components/TradingPanel';
import { formatNumber, formatPrice } from '@/lib/utils';

interface TokenData {
  mint: string;
  name: string;
  symbol: string;
  image: string | null;
  price: number;
  priceChange24h: number;
  marketCap: number;
  volume24h: number;
  liquidity: number;
  decimals: number;
  pairAddress: string;
  dexId: string;
  txns: {
    buys: number;
    sells: number;
  };
}

export default function TokenPage() {
  const params = useParams();
  const mint = params.address as string;

  const [token, setToken] = useState<TokenData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!mint) return;

    async function fetchToken() {
      setLoading(true);
      setError(null);

      try {
        const res = await fetch(
          `https://api.dexscreener.com/tokens/v1/solana/${mint}`
        );

        if (!res.ok) {
          throw new Error('Failed to fetch token');
        }

        const data = await res.json();

        if (!data || data.length === 0) {
          throw new Error('Token not found');
        }

        // Get the first/best pair
        const pair = data[0];

        setToken({
          mint: pair.baseToken?.address || mint,
          name: pair.baseToken?.name || 'Unknown',
          symbol: pair.baseToken?.symbol || '???',
          image: pair.info?.imageUrl || null,
          price: parseFloat(pair.priceUsd) || 0,
          priceChange24h: pair.priceChange?.h24 || 0,
          marketCap: pair.marketCap || pair.fdv || 0,
          volume24h: pair.volume?.h24 || 0,
          liquidity: pair.liquidity?.usd || 0,
          decimals: 6,
          pairAddress: pair.pairAddress || '',
          dexId: pair.dexId || '',
          txns: {
            buys: pair.txns?.h24?.buys || 0,
            sells: pair.txns?.h24?.sells || 0,
          },
        });
      } catch (err: any) {
        console.error('Failed to fetch token:', err);
        setError(err.message || 'Failed to load token');
      } finally {
        setLoading(false);
      }
    }

    fetchToken();
  }, [mint]);

  const copyAddress = () => {
    navigator.clipboard.writeText(mint);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A0A0B] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading token data...</p>
        </div>
      </div>
    );
  }

  if (error || !token) {
    return (
      <div className="min-h-screen bg-[#0A0A0B] flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-2">Token Not Found</h1>
          <p className="text-gray-400 mb-4">{error || 'Unable to load token data'}</p>
          <Link href="/" className="text-purple-400 hover:underline">
            ← Back to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0A0B] text-white">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Back Button */}
        <Link href="/" className="inline-flex items-center text-gray-400 hover:text-white mb-6">
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Tokens
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Token Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Token Header */}
            <div className="bg-[#131314] border border-[#1F1F22] rounded-2xl p-6">
              <div className="flex items-center gap-4 mb-6">
                {token.image ? (
                  <img
                    src={token.image}
                    alt={token.name}
                    className="w-16 h-16 rounded-xl object-cover"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center">
                    <span className="text-2xl font-bold">{token.symbol.charAt(0)}</span>
                  </div>
                )}
                <div className="flex-1">
                  <h1 className="text-2xl font-bold">{token.name}</h1>
                  <p className="text-gray-400">${token.symbol}</p>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-bold">${formatPrice(token.price)}</p>
                  <p className={`text-lg font-semibold ${token.priceChange24h >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {token.priceChange24h >= 0 ? '+' : ''}{token.priceChange24h.toFixed(2)}%
                  </p>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-[#0A0A0B] rounded-xl p-4">
                  <p className="text-gray-400 text-sm mb-1">Market Cap</p>
                  <p className="text-white font-bold text-lg">${formatNumber(token.marketCap)}</p>
                </div>
                <div className="bg-[#0A0A0B] rounded-xl p-4">
                  <p className="text-gray-400 text-sm mb-1">Volume (24h)</p>
                  <p className="text-white font-bold text-lg">${formatNumber(token.volume24h)}</p>
                </div>
                <div className="bg-[#0A0A0B] rounded-xl p-4">
                  <p className="text-gray-400 text-sm mb-1">Liquidity</p>
                  <p className="text-white font-bold text-lg">${formatNumber(token.liquidity)}</p>
                </div>
                <div className="bg-[#0A0A0B] rounded-xl p-4">
                  <p className="text-gray-400 text-sm mb-1">Txns (24h)</p>
                  <p className="text-white font-bold text-lg">
                    <span className="text-green-400">{token.txns.buys}</span>
                    {' / '}
                    <span className="text-red-400">{token.txns.sells}</span>
                  </p>
                </div>
              </div>
            </div>

            {/* Contract Address */}
            <div className="bg-[#131314] border border-[#1F1F22] rounded-2xl p-6">
              <h2 className="text-lg font-bold mb-4">Contract Address</h2>
              <div className="flex items-center gap-3 bg-[#0A0A0B] rounded-xl p-4">
                <code className="text-gray-300 text-sm flex-1 break-all font-mono">{mint}</code>
                <button
                  onClick={copyAddress}
                  className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  {copied ? 'Copied!' : 'Copy'}
                </button>
              </div>

              {/* External Links */}
              <div className="flex flex-wrap gap-3 mt-4">
                <a
                  href={`https://solscan.io/token/${mint}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 bg-[#0A0A0B] hover:bg-[#1a1a1b] px-4 py-2 rounded-lg text-sm text-gray-300 hover:text-white transition-colors"
                >
                  <span>Solscan</span>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
                <a
                  href={`https://dexscreener.com/solana/${mint}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 bg-[#0A0A0B] hover:bg-[#1a1a1b] px-4 py-2 rounded-lg text-sm text-gray-300 hover:text-white transition-colors"
                >
                  <span>DexScreener</span>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
                <a
                  href={`https://birdeye.so/token/${mint}?chain=solana`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 bg-[#0A0A0B] hover:bg-[#1a1a1b] px-4 py-2 rounded-lg text-sm text-gray-300 hover:text-white transition-colors"
                >
                  <span>Birdeye</span>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
                <a
                  href={`https://jup.ag/swap/SOL-${mint}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 bg-[#0A0A0B] hover:bg-[#1a1a1b] px-4 py-2 rounded-lg text-sm text-gray-300 hover:text-white transition-colors"
                >
                  <span>Jupiter</span>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
              </div>
            </div>

            {/* Embedded DexScreener Chart */}
            <div className="bg-[#131314] border border-[#1F1F22] rounded-2xl p-6">
              <h2 className="text-lg font-bold mb-4">Price Chart</h2>
              <div className="w-full h-[400px] rounded-xl overflow-hidden">
                <iframe
                  src={`https://dexscreener.com/solana/${mint}?embed=1&theme=dark&trades=0&info=0`}
                  className="w-full h-full border-0"
                  title="DexScreener Chart"
                />
              </div>
            </div>
          </div>

          {/* Right Column - Trading Panel */}
          <div className="lg:col-span-1">
            <div className="sticky top-8">
              <TradingPanel
                token={{
                  mint: token.mint,
                  symbol: token.symbol,
                  name: token.name,
                  price: token.price,
                  decimals: token.decimals,
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
