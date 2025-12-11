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
    <div className="min-h-screen bg-[#0A0A0B]">
      {/* Hero Section with Gradient */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-transparent to-transparent" />
        <div className="absolute inset-0">
          <div className="absolute top-20 left-10 w-72 h-72 bg-purple-600/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-10 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 py-16">
          <div className="text-center mb-12">
            <h1 className="text-5xl md:text-6xl font-bold text-white mb-4 bg-gradient-to-r from-white to-purple-400 bg-clip-text text-transparent">
              Launch fair, safe memecoins
            </h1>
            <p className="text-xl text-gray-400 mb-8 max-w-2xl mx-auto">
              No presale, no team tokens, no bullsh*t. Launch a coin that's tradeable instantly.
            </p>

            {/* Search Bar */}
            <form onSubmit={handleSearch} className="max-w-2xl mx-auto mb-8">
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by token name, symbol, or address..."
                  className="w-full bg-[#131314]/80 backdrop-blur border border-[#1F1F22] rounded-2xl px-6 py-4 text-white text-lg focus:border-purple-600 focus:outline-none transition-all pr-32 pl-12"
                />
                <svg
                  className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <button
                  type="submit"
                  className="absolute right-2 top-1/2 -translate-y-1/2 bg-purple-600 hover:bg-purple-700 text-white px-6 py-2.5 rounded-xl font-semibold transition-all"
                >
                  Search
                </button>
              </div>
            </form>

            {/* CTA Buttons */}
            <div className="flex items-center justify-center gap-4 flex-wrap">
              <Link
                href="/create"
                className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-4 rounded-xl font-semibold text-lg transition-all transform hover:scale-105 flex items-center gap-2"
              >
                <span>🚀</span> Launch Token
              </Link>
              <button
                onClick={() => router.push('/how-it-works')}
                className="bg-[#131314] border border-[#1F1F22] hover:border-purple-600 text-white px-8 py-4 rounded-xl font-semibold text-lg transition-all"
              >
                How it Works
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="border-y border-[#1F1F22] bg-[#131314]/50 backdrop-blur">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div>
              <p className="text-gray-500 text-sm mb-1">24h Volume</p>
              <p className="text-2xl font-bold text-white">${formatNumber(stats.totalVolume)}</p>
              <p className={`text-sm ${stats.volumeChange >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {stats.volumeChange >= 0 ? '+' : ''}{stats.volumeChange.toFixed(2)}%
              </p>
            </div>
            <div>
              <p className="text-gray-500 text-sm mb-1">Tokens Launched</p>
              <p className="text-2xl font-bold text-white">{formatNumber(stats.totalTokens)}</p>
              <p className="text-sm text-gray-400">All time</p>
            </div>
            <div>
              <p className="text-gray-500 text-sm mb-1">Active Traders</p>
              <p className="text-2xl font-bold text-white">{formatNumber(stats.totalTraders)}</p>
              <p className="text-sm text-gray-400">Last 24h</p>
            </div>
            <div>
              <p className="text-gray-500 text-sm mb-1">Platform Earnings</p>
              <p className="text-2xl font-bold text-purple-400">${formatNumber(stats.totalEarnings)}</p>
              <p className="text-sm text-gray-400">0.5% on all trades</p>
            </div>
          </div>
        </div>
      </div>

      {/* Featured Token Banner */}
      {tokens.length > 0 && activeTab === 'hot' && (
        <div className="max-w-7xl mx-auto px-4 mt-8">
          <div className="bg-gradient-to-r from-purple-900/30 to-purple-600/20 border border-purple-600/30 rounded-2xl p-6">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="relative">
                  {tokens[0].image ? (
                    <img
                      src={tokens[0].image}
                      alt={tokens[0].name}
                      className="w-16 h-16 rounded-xl object-cover"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-purple-600 to-purple-400 flex items-center justify-center">
                      <span className="text-white font-bold text-2xl">{tokens[0].symbol?.charAt(0)}</span>
                    </div>
                  )}
                  <div className="absolute -top-2 -right-2 bg-yellow-500 text-black text-xs px-2 py-1 rounded-full font-bold">
                    #1
                  </div>
                </div>
                <div>
                  <p className="text-sm text-purple-400 mb-1">🔥 Trending #1</p>
                  <h3 className="text-2xl font-bold text-white">{tokens[0].name}</h3>
                  <p className="text-gray-400">${tokens[0].symbol} • MCap: ${formatNumber(tokens[0].marketCap)}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold text-white">${tokens[0].price?.toFixed(9)}</p>
                <p className={`text-lg ${tokens[0].priceChange24h >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {tokens[0].priceChange24h >= 0 ? '+' : ''}{tokens[0].priceChange24h?.toFixed(2)}%
                </p>
                <Link
                  href={`/token/${tokens[0].mint}`}
                  className="inline-block mt-2 bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg font-semibold transition-all"
                >
                  Trade Now
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Category Tabs */}
        <div className="flex items-center gap-2 mb-8 overflow-x-auto pb-2">
          {TRENDING_CATEGORIES.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-6 py-3 rounded-xl font-semibold transition-all whitespace-nowrap ${activeTab === tab.id
                  ? 'bg-purple-600 text-white'
                  : 'bg-[#131314] text-gray-400 hover:text-white border border-[#1F1F22] hover:border-purple-600'
                }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Active Tab Description */}
        <div className="mb-6">
          <p className="text-gray-400">
            {TRENDING_CATEGORIES.find(t => t.id === activeTab)?.description}
          </p>
        </div>

        {/* Token Grid */}
        <TokenGrid tokens={tokens} loading={loading} />

        {/* Load More Button */}
        {tokens.length >= 30 && (
          <div className="text-center mt-12">
            <button
              onClick={() => {/* Load more logic */ }}
              className="bg-[#131314] border border-[#1F1F22] hover:border-purple-600 text-white px-8 py-3 rounded-xl font-semibold transition-all"
            >
              Load More
            </button>
          </div>
        )}
      </div>

      {/* Footer Section */}
      <div className="border-t border-[#1F1F22] mt-20">
        <div className="max-w-7xl mx-auto px-4 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h4 className="text-white font-semibold mb-4">Platform</h4>
              <ul className="space-y-2">
                <li><Link href="/create" className="text-gray-400 hover:text-purple-400 transition-colors">Launch Token</Link></li>
                <li><Link href="/tokens" className="text-gray-400 hover:text-purple-400 transition-colors">All Tokens</Link></li>
                <li><Link href="/graduating" className="text-gray-400 hover:text-purple-400 transition-colors">Graduating Soon</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Learn</h4>
              <ul className="space-y-2">
                <li><Link href="/how-it-works" className="text-gray-400 hover:text-purple-400 transition-colors">How it Works</Link></li>
                <li><Link href="/faq" className="text-gray-400 hover:text-purple-400 transition-colors">FAQ</Link></li>
                <li><Link href="/docs" className="text-gray-400 hover:text-purple-400 transition-colors">Documentation</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Community</h4>
              <ul className="space-y-2">
                <li><a href="#" className="text-gray-400 hover:text-purple-400 transition-colors">Twitter</a></li>
                <li><a href="#" className="text-gray-400 hover:text-purple-400 transition-colors">Telegram</a></li>
                <li><a href="#" className="text-gray-400 hover:text-purple-400 transition-colors">Discord</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Stats</h4>
              <div className="space-y-2 text-sm">
                <p className="text-gray-400">Total Volume: <span className="text-white">${formatNumber(stats.totalVolume)}</span></p>
                <p className="text-gray-400">Tokens Created: <span className="text-white">{formatNumber(stats.totalTokens)}</span></p>
                <p className="text-gray-400">Platform Earnings: <span className="text-purple-400">${formatNumber(stats.totalEarnings)}</span></p>
              </div>
            </div>
          </div>

          <div className="mt-12 pt-8 border-t border-[#1F1F22] text-center">
            <p className="text-gray-500 text-sm">
              © 2024 Space Lab. Launch tokens with YOUR authority • Trade on Jupiter • Earn 0.5% referral
            </p>
          </div>
        </div>
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
