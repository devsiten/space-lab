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
      const res = await fetch(`/api/tokens/${address}`);
      if (res.ok) {
        const data = await res.json();
        setToken(data);
      } else {
        // Use mock data for demo
        setToken(generateMockToken(address));
      }
    } catch (error) {
      setToken(generateMockToken(address));
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
        setRecentTrades(generateMockTrades());
      }
    } catch {
      setRecentTrades(generateMockTrades());
    }
  };

  const handleCopyAddress = async () => {
    const success = await copyToClipboard(address);
    if (success) {
      toast.success('Address copied!');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <svg className="animate-spin h-12 w-12 text-purple-500" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      </div>
    );
  }

  if (!token) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <h1 className="text-2xl font-bold text-white mb-4">Token not found</h1>
        <Link href="/" className="text-purple-400 hover:text-purple-300">
          ← Back to home
        </Link>
      </div>
    );
  }

  const priceChange = token.price24hAgo ? ((token.price - token.price24hAgo) / token.price24hAgo) * 100 : 0;
  const progressToGraduation = Math.min((token.marketCap / BONDING_CURVE_PARAMS.graduationMarketCap) * 100, 100);

  return (
    <div className="min-h-screen pb-12">
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Breadcrumb */}
        <div className="mb-6">
          <Link href="/" className="text-gray-400 hover:text-white transition-colors">
            ← Back to tokens
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Chart & Trading */}
          <div className="lg:col-span-2 space-y-6">
            {/* Token Header */}
            <div className="bg-[#131314] border border-[#1F1F22] rounded-2xl p-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  {token.image ? (
                    <img 
                      src={token.image} 
                      alt={token.name}
                      className="w-16 h-16 rounded-xl object-cover"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-purple-600 to-purple-400 flex items-center justify-center">
                      <span className="text-white font-bold text-2xl">{token.symbol?.charAt(0)}</span>
                    </div>
                  )}
                  <div>
                    <h1 className="text-2xl font-bold text-white">{token.name}</h1>
                    <p className="text-gray-400">${token.symbol}</p>
                    <div className="flex items-center gap-4 mt-2">
                      {token.twitter && (
                        <a href={token.twitter} target="_blank" rel="noopener noreferrer" className="text-purple-400 hover:text-purple-300 text-sm">
                          Twitter
                        </a>
                      )}
                      {token.telegram && (
                        <a href={token.telegram} target="_blank" rel="noopener noreferrer" className="text-purple-400 hover:text-purple-300 text-sm">
                          Telegram
                        </a>
                      )}
                      {token.website && (
                        <a href={token.website} target="_blank" rel="noopener noreferrer" className="text-purple-400 hover:text-purple-300 text-sm">
                          Website
                        </a>
                      )}
                    </div>
                  </div>
                </div>
                <div className="text-left sm:text-right">
                  <p className="text-3xl font-bold text-white">${formatPrice(token.price)}</p>
                  <p className={`text-lg ${priceChange >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {priceChange >= 0 ? '+' : ''}{priceChange.toFixed(2)}%
                  </p>
                </div>
              </div>
            </div>

            {/* Price Chart */}
            <PriceChart tokenAddress={address} height={400} />

            {/* Trading Panel (Mobile) */}
            <div className="lg:hidden">
              <TradingPanel token={token} />
            </div>

            {/* Recent Trades */}
            <div className="bg-[#131314] border border-[#1F1F22] rounded-2xl p-6">
              <h3 className="text-white font-semibold mb-4">Recent Trades</h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-gray-500 text-xs border-b border-[#1F1F22]">
                      <th className="text-left pb-3">Type</th>
                      <th className="text-left pb-3">Amount</th>
                      <th className="text-left pb-3">Price</th>
                      <th className="text-left pb-3">Time</th>
                      <th className="text-left pb-3">Wallet</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentTrades.map((trade, i) => (
                      <tr key={i} className="border-b border-[#1F1F22] last:border-0">
                        <td className={`py-3 ${trade.type === 'buy' ? 'text-green-500' : 'text-red-500'}`}>
                          {trade.type === 'buy' ? '↑ Buy' : '↓ Sell'}
                        </td>
                        <td className="py-3 text-white">{formatNumber(trade.amount)} {token.symbol}</td>
                        <td className="py-3 text-white">${formatPrice(trade.price)}</td>
                        <td className="py-3 text-gray-400">{getTimeAgo(trade.timestamp)}</td>
                        <td className="py-3 text-gray-400">
                          <a 
                            href={`${SOLSCAN_URL}/account/${trade.wallet}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hover:text-purple-400"
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
            <div className="hidden lg:block">
              <TradingPanel token={token} />
            </div>

            {/* Graduation Progress */}
            {!token.graduated && (
              <div className="bg-[#131314] border border-[#1F1F22] rounded-2xl p-6">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-white font-semibold">Graduation Progress</h3>
                  <span className="text-purple-400">{progressToGraduation.toFixed(1)}%</span>
                </div>
                <div className="w-full bg-[#0A0A0B] rounded-full h-3 mb-3">
                  <div 
                    className={`h-3 rounded-full transition-all ${
                      progressToGraduation > 80 
                        ? 'bg-gradient-to-r from-green-500 to-green-400 animate-pulse' 
                        : 'bg-gradient-to-r from-purple-600 to-purple-400'
                    }`}
                    style={{ width: `${progressToGraduation}%` }}
                  />
                </div>
                <p className="text-gray-400 text-sm">
                  ${formatNumber(BONDING_CURVE_PARAMS.graduationMarketCap - token.marketCap)} until graduation to Raydium
                </p>
              </div>
            )}

            {/* Token Stats */}
            <div className="bg-[#131314] border border-[#1F1F22] rounded-2xl p-6">
              <h3 className="text-white font-semibold mb-4">Token Info</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-400">Market Cap</span>
                  <span className="text-white">${formatNumber(token.marketCap)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Liquidity</span>
                  <span className="text-white">${formatNumber(token.liquidity)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">24h Volume</span>
                  <span className="text-white">${formatNumber(token.volume24h)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Holders</span>
                  <span className="text-white">{token.holders}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Total Supply</span>
                  <span className="text-white">1B</span>
                </div>
              </div>
              
              {/* Contract Address */}
              <div className="mt-4 pt-4 border-t border-[#1F1F22]">
                <p className="text-gray-400 text-sm mb-2">Contract Address</p>
                <div className="flex items-center gap-2">
                  <code className="text-xs text-purple-400 break-all flex-1">
                    {address}
                  </code>
                  <button 
                    onClick={handleCopyAddress}
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Platform Badge */}
              {token.platform === 'Space Lab' && (
                <div className="mt-4 pt-4 border-t border-[#1F1F22]">
                  <div className="bg-purple-900/20 border border-purple-600/30 rounded-lg p-3">
                    <p className="text-sm text-purple-300">
                      ✨ Launched on Space Lab
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      Deployed by: {shortenAddress(token.deployedBy)}
                    </p>
                  </div>
                </div>
              )}

              {/* External Links */}
              <div className="mt-4 space-y-2">
                <a 
                  href={`${PUMP_FUN_URL}/token/${address}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full text-center bg-[#0A0A0B] hover:bg-[#1F1F22] text-purple-400 py-2 rounded-lg text-sm transition-colors"
                >
                  View on Pump.fun →
                </a>
                <a 
                  href={`${DEXSCREENER_URL}/${address}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full text-center bg-[#0A0A0B] hover:bg-[#1F1F22] text-purple-400 py-2 rounded-lg text-sm transition-colors"
                >
                  View on DexScreener →
                </a>
                <a 
                  href={`${SOLSCAN_URL}/token/${address}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full text-center bg-[#0A0A0B] hover:bg-[#1F1F22] text-purple-400 py-2 rounded-lg text-sm transition-colors"
                >
                  View on Solscan →
                </a>
              </div>
            </div>

            {/* Description */}
            {token.description && (
              <div className="bg-[#131314] border border-[#1F1F22] rounded-2xl p-6">
                <h3 className="text-white font-semibold mb-3">About</h3>
                <p className="text-gray-400 text-sm">{token.description}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function generateMockToken(address: string) {
  return {
    mint: address,
    name: 'Demo Token',
    symbol: 'DEMO',
    description: 'This is a demo token for testing purposes.',
    image: null,
    price: Math.random() * 0.0001,
    price24hAgo: Math.random() * 0.0001,
    marketCap: Math.random() * 50000 + 5000,
    liquidity: Math.random() * 10000,
    volume24h: Math.random() * 50000,
    holders: Math.floor(Math.random() * 200) + 20,
    createdAt: new Date(Date.now() - Math.random() * 86400000 * 3).toISOString(),
    creatorWallet: 'Demo' + Math.random().toString(36).substring(2, 10),
    deployedBy: 'Platform' + Math.random().toString(36).substring(2, 10),
    platform: 'Space Lab',
    graduated: false,
    twitter: null,
    telegram: null,
    website: null,
  };
}

function generateMockTrades() {
  return Array(10).fill(null).map((_, i) => ({
    type: Math.random() > 0.5 ? 'buy' : 'sell',
    amount: Math.random() * 1000000,
    price: Math.random() * 0.0001,
    timestamp: new Date(Date.now() - i * 60000 * Math.random() * 30).toISOString(),
    wallet: 'Demo' + Math.random().toString(36).substring(2, 12),
  }));
}
