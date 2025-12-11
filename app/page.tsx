'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { TokenGrid } from './components/TokenGrid';
import { formatNumber } from './lib/utils';
import { TRENDING_CATEGORIES } from './lib/constants';

interface Token {
  mint: string;
  name: string;
  symbol: string;
  image: string | null;
  price: number;
  price24hAgo: number;
  marketCap: number;
  volume24h: number;
  holders: number;
  txns24h: number;
  createdAt: string;
  creatorWallet: string;
  platform: string;
  graduated: boolean;
  priceChange24h: number;
}

export default function HomePage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('hot');
  const [tokens, setTokens] = useState<Token[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [stats, setStats] = useState({
    totalVolume: 0,
    totalTokens: 0,
    totalTraders: 0,
    totalEarnings: 0,
    volumeChange: 0
  });

  useEffect(() => {
    fetchTokens(activeTab);
    fetchStats();
  }, [activeTab]);

  const fetchTokens = async (category: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/tokens/trending?category=${category}&limit=30`);
      if (res.ok) {
        const data = await res.json();
        setTokens(data);
      }
    } catch (error) {
      console.error('Failed to fetch tokens:', error);
      // Use mock data for demo
      setTokens(generateMockTokens());
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/stats/platform');
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (error) {
      // Use mock stats for demo
      setStats({
        totalVolume: 142500000,
        totalTokens: 8421,
        totalTraders: 52300,
        totalEarnings: 712500,
        volumeChange: 12.5
      });
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  return (
    <div className="min-h-screen">
      {/* Hero Section with Deep Space Gfx */}
      <div className="relative overflow-hidden pt-12 pb-24">
        {/* Background Effects */}
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-20" />
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-violet-600/20 rounded-full blur-[100px] animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-600/20 rounded-full blur-[100px] animate-pulse delay-1000" />

        <div className="relative max-w-7xl mx-auto px-4">
          <div className="text-center max-w-4xl mx-auto">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-md mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
              <span className="flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
              </span>
              <span className="text-sm font-medium text-gray-300">Live on Solana Mainnet</span>
            </div>

            <h1 className="text-6xl md:text-7xl font-bold mb-6 tracking-tight animate-in fade-in slide-in-from-bottom-8 duration-700 delay-100">
              <span className="text-white drop-shadow-lg">Launch fair, safe</span>
              <br />
              <span className="bg-gradient-to-r from-violet-400 via-pink-400 to-blue-400 bg-clip-text text-transparent drop-shadow-lg p-2">memecoins instantly</span>
            </h1>

            <p className="text-xl text-gray-400 mb-12 max-w-2xl mx-auto leading-relaxed animate-in fade-in slide-in-from-bottom-8 duration-700 delay-200">
              No presale, no team tokens, no rug pulls. <br />
              Launch on Space Lab, graduate to <span className="text-green-400 font-bold">Raydium</span>.
            </p>

            {/* Search Bar */}
            <form onSubmit={handleSearch} className="max-w-2xl mx-auto mb-12 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-300 relative z-10">
              <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-violet-600/20 to-blue-600/20 rounded-2xl blur opacity-25 group-hover:opacity-75 transition duration-1000 group-hover:duration-200" />
                <div className="relative">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search tokens by name, symbol, or address..."
                    className="w-full bg-[#131314]/90 backdrop-blur-xl border border-white/10 rounded-2xl px-6 py-5 text-white text-lg focus:border-violet-500 focus:ring-1 focus:ring-violet-500/50 focus:outline-none transition-all pr-32 pl-14 shadow-xl"
                  />
                  <svg
                    className="absolute left-5 top-1/2 -translate-y-1/2 w-6 h-6 text-gray-500 group-hover:text-violet-400 transition-colors"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <button
                    type="submit"
                    className="absolute right-3 top-1/2 -translate-y-1/2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white px-6 py-2.5 rounded-xl font-bold shadow-lg shadow-violet-600/25 transition-all hover:scale-105"
                  >
                    Search
                  </button>
                </div>
              </div>
            </form>

            {/* CTA Buttons */}
            <div className="flex items-center justify-center gap-6 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-400">
              <Link
                href="/create"
                className="group relative inline-flex items-center justify-center gap-3 px-8 py-4 bg-white text-black rounded-2xl font-bold text-lg transition-all hover:scale-105 hover:shadow-[0_0_40px_-10px_rgba(255,255,255,0.3)]"
              >
                <span>🚀 Launch Token</span>
                <div className="absolute inset-0 rounded-2xl ring-2 ring-white/50 group-hover:ring-white/80 transition-all opacity-0 group-hover:opacity-100" />
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Glass Stats Bar */}
      <div className="border-y border-white/5 bg-[#0A0A0B]/50 backdrop-blur-md relative z-20">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 divide-x divide-white/5">
            <div className="px-4 text-center md:text-left">
              <p className="text-gray-500 text-xs uppercase tracking-wider mb-2 font-medium">Total Volume</p>
              <p className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400">${formatNumber(stats.totalVolume)}</p>
            </div>
            <div className="px-4 text-center md:text-left">
              <p className="text-gray-500 text-xs uppercase tracking-wider mb-2 font-medium">Tokens Launched</p>
              <p className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400">{formatNumber(stats.totalTokens)}</p>
            </div>
            <div className="px-4 text-center md:text-left">
              <p className="text-gray-500 text-xs uppercase tracking-wider mb-2 font-medium">Active Traders</p>
              <p className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400">{formatNumber(stats.totalTraders)}</p>
            </div>
            <div className="px-4 text-center md:text-left">
              <p className="text-gray-500 text-xs uppercase tracking-wider mb-2 font-medium">Platform Earnings</p>
              <p className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-fuchsia-400">${formatNumber(stats.totalEarnings)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto px-4 py-16">
        <div className="flex flex-col md:flex-row items-center justify-between mb-8 gap-4">
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <span className="text-2xl">🔥</span> Trending Tokens
          </h2>

          {/* Category Tabs */}
          <div className="flex items-center gap-1 bg-white/5 p-1 rounded-xl backdrop-blur-md border border-white/5 overflow-x-auto max-w-full">
            {TRENDING_CATEGORIES.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-5 py-2.5 rounded-lg font-semibold text-sm transition-all whitespace-nowrap ${activeTab === tab.id
                    ? 'bg-violet-600 text-white shadow-lg shadow-violet-600/20'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Token Grid */}
        <div className="min-h-[600px]">
          <TokenGrid tokens={tokens} loading={loading} />
        </div>

        {/* Load More Button */}
        {tokens.length >= 30 && (
          <div className="text-center mt-16">
            <button
              onClick={() => {/* Load more logic */ }}
              className="glass-panel px-8 py-4 rounded-xl font-bold text-white hover:bg-white/10 hover:scale-105 transition-all shadow-lg border border-white/10"
            >
              Load More Tokens
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// Generate mock tokens for demo
function generateMockTokens() {
  const names = ['DogeMoon', 'CatRocket', 'PepeCash', 'ShibaKing', 'FlokiGold', 'BonkMaster', 'WifHat', 'PopcatSOL', 'MemeKing'];
  return names.map((name, i) => ({
    mint: `mock${i}${Math.random().toString(36).substring(7)}`,
    name,
    symbol: name.substring(0, 4).toUpperCase(),
    image: null,
    price: Math.random() * 0.0001,
    price24hAgo: Math.random() * 0.0001,
    marketCap: Math.random() * 50000 + 1000,
    volume24h: Math.random() * 100000,
    holders: Math.floor(Math.random() * 500) + 10,
    txns24h: Math.floor(Math.random() * 1000),
    createdAt: new Date(Date.now() - Math.random() * 86400000 * 7).toISOString(),
    creatorWallet: 'Demo' + Math.random().toString(36).substring(2, 10),
    platform: i % 3 === 0 ? 'Space Lab' : 'PumpFun',
    graduated: false,
    priceChange24h: (Math.random() - 0.5) * 100,
  }));
}
