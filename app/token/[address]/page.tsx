'use client';

import { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { TradingPanel } from '@/components/TradingPanel';
import { PriceChart } from '@/components/PriceChart';
import { formatNumber, formatPrice, shortenAddress, getTimeAgo, copyToClipboard } from '@/lib/utils';
import { BONDING_CURVE_PARAMS, PUMP_FUN_URL, DEXSCREENER_URL, SOLSCAN_URL } from '@/lib/constants';
import toast from 'react-hot-toast';

export default function TokenPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const address = params.address as string;

  const [token, setToken] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [recentTrades, setRecentTrades] = useState<any[]>([]);

  useEffect(() => {
    if (address) {
      fetchTokenData();
      fetchRecentTrades();

      // WebSocket for real-time updates
      if (typeof window !== 'undefined' && process.env.NEXT_PUBLIC_WS_URL) {
        try {
          const ws = new WebSocket(`${process.env.NEXT_PUBLIC_WS_URL}/token/${address}`);
          ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            setToken((prev: any) => ({ ...prev, ...data }));
          };
          return () => ws.close();
        } catch (e) {
          // WebSocket not available
        }
      }
    }
  }, [address]);

  const fetchTokenData = async () => {
    setLoading(true);
    try {
      // First try our API
      const res = await fetch(`/api/tokens/${address}`);
      if (res.ok) {
        const data = await res.json();
        if (data && data.mint) {
          setToken(data);
          return;
        }
      }

      // Fallback to DexScreener for real token data
      const dexRes = await fetch(`https://api.dexscreener.com/latest/dex/tokens/${address}`);
      if (dexRes.ok) {
        const dexData = await dexRes.json();
        const pairs = dexData.pairs || [];
        const solanaPair = pairs.find((p: any) => p.chainId === 'solana');

        if (solanaPair) {
          const baseToken = solanaPair.baseToken || {};
          const priceUsd = parseFloat(solanaPair.priceUsd) || 0;
          const priceChange24h = solanaPair.priceChange?.h24 || 0;

          setToken({
            mint: baseToken.address || address,
            name: baseToken.name || 'Unknown Token',
            symbol: baseToken.symbol || '???',
            description: null,
            image: solanaPair.info?.imageUrl || null,
            price: priceUsd,
            price24hAgo: priceChange24h !== 0 ? priceUsd / (1 + priceChange24h / 100) : priceUsd,
            marketCap: solanaPair.marketCap || solanaPair.fdv || 0,
            liquidity: solanaPair.liquidity?.usd || 0,
            volume24h: solanaPair.volume?.h24 || 0,
            holders: 0,
            txns24h: (solanaPair.txns?.h24?.buys || 0) + (solanaPair.txns?.h24?.sells || 0),
            createdAt: solanaPair.pairCreatedAt ? new Date(solanaPair.pairCreatedAt).toISOString() : null,
            creatorWallet: '',
            deployedBy: '',
            platform: solanaPair.dexId || 'Unknown',
            graduated: false,
            twitter: solanaPair.info?.socials?.find((s: any) => s.type === 'twitter')?.url || null,
            telegram: solanaPair.info?.socials?.find((s: any) => s.type === 'telegram')?.url || null,
            website: solanaPair.info?.websites?.[0]?.url || null,
          });
          return;
        }
      }

      // No data found
      setToken(null);
    } catch (error) {
      console.error('Failed to fetch token:', error);
      setToken(null);
    } finally {
      setLoading(false);
    }
  };

  const fetchRecentTrades = async () => {
    try {
      const res = await fetch(`/api/tokens/${address}/trades`);
      if (res.ok) {
        const data = await res.json();
        setRecentTrades(data);
      } else {
        // No mock data - just show empty
        setRecentTrades([]);
      }
    } catch {
      setRecentTrades([]);
    }
  };

  const handleCopyAddress = async () => {
    const success = await copyToClipboard(address);
    if (success) {
      toast.success('Address copied!', {
        style: {
          background: '#1F1F22',
          color: '#fff',
          border: '1px solid #333'
        }
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0A0A0B]">
        <div className="relative w-20 h-20">
          <div className="absolute inset-0 border-4 border-violet-600/20 rounded-full animate-ping"></div>
          <div className="absolute inset-0 border-4 border-t-violet-500 rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  if (!token) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#0A0A0B] text-white">
        <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-violet-400 to-indigo-400 bg-clip-text text-transparent">Token not found</h1>
        <Link href="/" className="px-6 py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all font-semibold">
          ← Back to home
        </Link>
      </div>
    );
  }

  const priceChange = token.price24hAgo ? ((token.price - token.price24hAgo) / token.price24hAgo) * 100 : 0;
  const progressToGraduation = Math.min((token.marketCap / BONDING_CURVE_PARAMS.graduationMarketCap) * 100, 100);

  return (
    <div className="min-h-screen pb-20 relative overflow-hidden">
      {/* Background Effects */}
      <div className="fixed top-20 left-10 w-96 h-96 bg-violet-600/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="fixed bottom-20 right-10 w-96 h-96 bg-blue-600/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 py-8 relative z-10">
        {/* Breadcrumb */}
        <div className="mb-8">
          <Link href="/" className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors group">
            <span className="p-1 rounded-lg bg-white/5 group-hover:bg-violet-500/20 transition-colors">←</span>
            Back to tokens
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Chart & Trading */}
          <div className="lg:col-span-2 space-y-8">
            {/* Token Header */}
            <div className="glass-panel p-6 sm:p-8 rounded-3xl">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
                <div className="flex items-center gap-6">
                  {token.image ? (
                    <img
                      src={token.image}
                      alt={token.name}
                      className="w-20 h-20 rounded-2xl object-cover ring-4 ring-white/5 shadow-xl"
                    />
                  ) : (
                    <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-600/20">
                      <span className="text-white font-bold text-3xl">{token.symbol?.charAt(0)}</span>
                    </div>
                  )}
                  <div>
                    <h1 className="text-3xl font-bold text-white tracking-tight mb-1">{token.name}</h1>
                    <div className="flex items-center gap-3">
                      <span className="text-gray-400 px-2 py-0.5 rounded-lg bg-white/5 border border-white/5 uppercase text-sm font-semibold tracking-wider">
                        ${token.symbol}
                      </span>
                      {/* Social Links Mini */}
                      <div className="flex gap-2">
                        {token.twitter && <a href={token.twitter} target="_blank" className="p-1.5 rounded-lg hover:bg-white/10 transition-colors text-gray-400 hover:text-blue-400"><span className="sr-only">Twitter</span>𝕏</a>}
                        {token.telegram && <a href={token.telegram} target="_blank" className="p-1.5 rounded-lg hover:bg-white/10 transition-colors text-gray-400 hover:text-blue-400"><span className="sr-only">Telegram</span>✈️</a>}
                        {token.website && <a href={token.website} target="_blank" className="p-1.5 rounded-lg hover:bg-white/10 transition-colors text-gray-400 hover:text-blue-400"><span className="sr-only">Website</span>🌐</a>}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="text-left sm:text-right w-full sm:w-auto bg-white/5 sm:bg-transparent p-4 sm:p-0 rounded-xl">
                  <p className="text-4xl font-bold text-white tracking-tight mb-1">${formatPrice(token.price)}</p>
                  <p className={`text-lg font-medium flex items-center gap-1 sm:justify-end ${priceChange >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {priceChange >= 0 ? '↑' : '↓'} {Math.abs(priceChange).toFixed(2)}% <span className="text-gray-500 text-sm font-normal">(24h)</span>
                  </p>
                </div>
              </div>
            </div>

            {/* Price Chart */}
            <div className="glass-panel p-1 rounded-3xl overflow-hidden shadow-lg border-white/5">
              <PriceChart tokenAddress={address} height={500} />
            </div>

            {/* Trading Panel (Mobile) */}
            <div className="lg:hidden">
              <TradingPanel token={token} />
            </div>

            {/* Recent Trades */}
            <div className="glass-panel rounded-3xl overflow-hidden">
              <div className="p-6 border-b border-white/10">
                <h3 className="text-white font-bold text-xl">Recent Trades</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-gray-400 text-xs uppercase tracking-wider bg-white/5">
                      <th className="text-left py-4 px-6">Type</th>
                      <th className="text-left py-4 px-6">Amount</th>
                      <th className="text-left py-4 px-6">Price</th>
                      <th className="text-left py-4 px-6">Time</th>
                      <th className="text-left py-4 px-6">Wallet</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {recentTrades.map((trade, i) => (
                      <tr key={i} className="hover:bg-white/5 transition-colors">
                        <td className={`py-4 px-6 font-medium ${trade.type === 'buy' ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {trade.type === 'buy' ? 'BUY' : 'SELL'}
                        </td>
                        <td className="py-4 px-6 text-white font-mono">{formatNumber(trade.amount)}</td>
                        <td className="py-4 px-6 text-gray-300 font-mono text-sm">${formatPrice(trade.price)}</td>
                        <td className="py-4 px-6 text-gray-500 text-sm">{getTimeAgo(trade.timestamp)}</td>
                        <td className="py-4 px-6">
                          <a
                            href={`${SOLSCAN_URL}/account/${trade.wallet}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-violet-400 hover:text-violet-300 font-mono text-xs bg-violet-500/10 px-2 py-1 rounded"
                          >
                            {shortenAddress(trade.wallet)}
                          </a>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Right Column - Info & Trading */}
          <div className="space-y-6">
            {/* Trading Panel (Desktop) */}
            <div className="hidden lg:block sticky top-24 z-20">
              <TradingPanel token={token} />
            </div>

            {/* Graduation Progress */}
            {!token.graduated && (
              <div className="glass-panel p-6 rounded-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10">
                  <span className="text-6xl">🎓</span>
                </div>
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-white font-bold text-lg">Bonding Curve</h3>
                    <span className="text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">{progressToGraduation.toFixed(1)}%</span>
                  </div>
                  <div className="w-full bg-black/40 rounded-full h-4 mb-4 border border-white/5 overflow-hidden p-0.5">
                    <div
                      className={`h-full rounded-full transition-all duration-1000 ease-out bg-gradient-to-r from-violet-600 via-fuchsia-500 to-emerald-400 ${progressToGraduation > 80 ? 'animate-pulse shadow-[0_0_15px_rgba(16,185,129,0.5)]' : ''
                        }`}
                      style={{ width: `${progressToGraduation}%` }}
                    />
                  </div>
                  <p className="text-gray-300 text-sm leading-relaxed">
                    When the market cap reaches <span className="text-white font-bold">${formatNumber(BONDING_CURVE_PARAMS.graduationMarketCap)}</span>,
                    all liquidity is deposited into <span className="text-violet-300 font-semibold">Raydium</span> and burned.
                  </p>
                </div>
              </div>
            )}

            {/* Token Stats */}
            <div className="glass-panel p-6 rounded-2xl">
              <h3 className="text-white font-bold text-lg mb-6 flex items-center gap-2">
                <span className="w-1 h-6 bg-violet-500 rounded-full"></span>
                Token Info
              </h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center pb-3 border-b border-white/5">
                  <span className="text-gray-400">Market Cap</span>
                  <span className="text-white font-mono font-bold">${formatNumber(token.marketCap)}</span>
                </div>
                <div className="flex justify-between items-center pb-3 border-b border-white/5">
                  <span className="text-gray-400">Liquidity</span>
                  <span className="text-white font-mono">${formatNumber(token.liquidity)}</span>
                </div>
                <div className="flex justify-between items-center pb-3 border-b border-white/5">
                  <span className="text-gray-400">24h Volume</span>
                  <span className="text-white font-mono">${formatNumber(token.volume24h)}</span>
                </div>
                <div className="flex justify-between items-center pb-3 border-b border-white/5">
                  <span className="text-gray-400">Holders</span>
                  <span className="text-white font-mono">{token.holders}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Total Supply</span>
                  <span className="text-white font-mono">1,000,000,000</span>
                </div>
              </div>

              {/* Contract Address */}
              <div className="mt-6 pt-6 border-t border-white/10">
                <p className="text-gray-400 text-xs uppercase tracking-wider mb-3 font-semibold">Contract Address</p>
                <div className="flex items-center gap-2 bg-black/40 p-3 rounded-xl border border-white/5 group hover:border-violet-500/30 transition-colors cursor-pointer" onClick={handleCopyAddress}>
                  <code className="text-xs text-violet-300 break-all flex-1 font-mono">
                    {address}
                  </code>
                  <button
                    className="text-gray-500 group-hover:text-white transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"></rect>
                      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"></path>
                    </svg>
                  </button>
                </div>
              </div>

              {/* Platform Badge */}
              {token.platform === 'Space Lab' && (
                <div className="mt-6">
                  <div className="bg-gradient-to-r from-violet-900/40 to-indigo-900/40 border border-violet-500/20 rounded-xl p-4 flex items-start gap-3">
                    <span className="text-xl">✨</span>
                    <div>
                      <p className="text-sm font-bold text-violet-200">
                        Launched on Space Lab
                      </p>
                      <p className="text-xs text-violet-400/70 mt-0.5">
                        Safe, fair, and automatically verified.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* External Links */}
              <div className="mt-6 grid grid-cols-3 gap-2">
                <a
                  href={`${PUMP_FUN_URL}/token/${address}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex flex-col items-center justify-center bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white py-3 rounded-xl text-xs transition-colors border border-white/5 hover:border-green-500/30 gap-1"
                >
                  <span className="text-base">💊</span>
                  Pump.fun
                </a>
                <a
                  href={`${DEXSCREENER_URL}/${address}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex flex-col items-center justify-center bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white py-3 rounded-xl text-xs transition-colors border border-white/5 hover:border-blue-500/30 gap-1"
                >
                  <span className="text-base">🦅</span>
                  DexScreener
                </a>
                <a
                  href={`${SOLSCAN_URL}/token/${address}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex flex-col items-center justify-center bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white py-3 rounded-xl text-xs transition-colors border border-white/5 hover:border-purple-500/30 gap-1"
                >
                  <span className="text-base">🔍</span>
                  Solscan
                </a>
              </div>
            </div>

            {/* Description */}
            {token.description && (
              <div className="glass-panel p-6 rounded-2xl">
                <h3 className="text-white font-bold text-lg mb-4">About</h3>
                <p className="text-gray-300 text-sm leading-relaxed whitespace-pre-wrap">{token.description}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}


