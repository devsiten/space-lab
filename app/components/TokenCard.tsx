'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { formatNumber, formatPrice, getTimeAgo, shortenAddress, generateSparklineData, calculateChange } from '@/lib/utils';
import { BONDING_CURVE_PARAMS } from '@/lib/constants';

interface TokenCardProps {
  token: {
    mint: string;
    name: string;
    symbol: string;
    image?: string;
    price: number;
    price24hAgo: number;
    marketCap: number;
    volume24h: number;
    holders: number;
    txns24h?: number;
    createdAt: string;
    creatorWallet: string;
    platform?: string;
    graduated?: boolean;
    verified?: boolean;
  };
  rank?: number;
}

export function TokenCard({ token, rank }: TokenCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [sparklineData, setSparklineData] = useState<number[]>([]);
  const [livePrice, setLivePrice] = useState(token.price);

  useEffect(() => {
    // Generate sparkline data
    setSparklineData(generateSparklineData(token.price, 20, 0.1));

    // WebSocket for real-time price updates
    if (typeof window !== 'undefined' && process.env.NEXT_PUBLIC_WS_URL) {
      try {
        const ws = new WebSocket(`${process.env.NEXT_PUBLIC_WS_URL}/token/${token.mint}`);
        ws.onmessage = (event) => {
          const data = JSON.parse(event.data);
          if (data.price) {
            setLivePrice(data.price);
          }
        };
        return () => ws.close();
      } catch (e) {
        // WebSocket not available
      }
    }
  }, [token.mint, token.price]);

  const priceChange = calculateChange(livePrice, token.price24hAgo);
  const progressToGraduation = Math.min(
    (token.marketCap / BONDING_CURVE_PARAMS.graduationMarketCap) * 100,
    100
  );
  const isGraduating = progressToGraduation > 80 && !token.graduated;

  return (
    <Link href={`/token/${token.mint}`}>
      <div
        className="glass-card relative rounded-2xl p-6 group h-full flex flex-col"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Hover Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-violet-600/5 to-blue-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl pointer-events-none" />

        {/* Rank Badge */}
        {rank && rank <= 3 && (
          <div className="absolute -top-3 -right-3 z-10 scale-100 group-hover:scale-110 transition-transform">
            <div className={`
              px-3 py-1 rounded-full text-xs font-bold shadow-lg
              ${rank === 1 ? 'bg-gradient-to-r from-yellow-400 to-yellow-600 text-black shadow-yellow-500/20' : ''}
              ${rank === 2 ? 'bg-gradient-to-r from-gray-300 to-gray-500 text-black shadow-gray-500/20' : ''}
              ${rank === 3 ? 'bg-gradient-to-r from-orange-400 to-orange-600 text-white shadow-orange-500/20' : ''}
            `}>
              #{rank}
            </div>
          </div>
        )}

        {/* Graduating Badge */}
        {isGraduating && (
          <div className="absolute top-4 right-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs px-3 py-1 rounded-full backdrop-blur-md shadow-[0_0_10px_rgba(16,185,129,0.2)] animate-pulse">
            🎓 Graduating Soon
          </div>
        )}

        {/* Mini Chart */}
        <div className="h-24 mb-6 -mx-6 mt-[-1rem] relative opacity-60 group-hover:opacity-100 transition-opacity">
          <svg className="w-full h-full" viewBox="0 0 200 60" preserveAspectRatio="none">
            <defs>
              <linearGradient id={`gradient-${token.mint}`} x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor={priceChange >= 0 ? '#10B981' : '#EF4444'} stopOpacity="0.2" />
                <stop offset="100%" stopColor={priceChange >= 0 ? '#10B981' : '#EF4444'} stopOpacity="0" />
              </linearGradient>
            </defs>

            {sparklineData.length > 0 && (
              <>
                <path
                  d={`M 0,60 L 0,${60 - (sparklineData[0] / Math.max(...sparklineData)) * 50} ${sparklineData.map((price, i) =>
                    `L ${(i / (sparklineData.length - 1)) * 200},${60 - (price / Math.max(...sparklineData)) * 50}`
                  ).join(' ')
                    } L 200,60 Z`}
                  fill={`url(#gradient-${token.mint})`}
                />

                <polyline
                  fill="none"
                  stroke={priceChange >= 0 ? '#10B981' : '#EF4444'}
                  strokeWidth="2"
                  points={sparklineData.map((price, i) =>
                    `${(i / (sparklineData.length - 1)) * 200},${60 - (price / Math.max(...sparklineData)) * 50}`
                  ).join(' ')}
                />
              </>
            )}
          </svg>
        </div>

        {/* Token Info */}
        <div className="flex items-start justify-between mb-4 relative z-10">
          <div className="flex items-center gap-4">
            <div className="relative group/image">
              {token.image ? (
                <img
                  src={token.image}
                  alt={token.name}
                  className="w-12 h-12 rounded-xl object-cover ring-2 ring-white/5 group-hover/image:ring-violet-500/50 transition-all shadow-lg"
                />
              ) : (
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center ring-2 ring-white/5 shadow-lg shadow-violet-600/20">
                  <span className="text-white font-bold text-lg">{token.symbol.charAt(0)}</span>
                </div>
              )}
              {token.verified && (
                <div className="absolute -bottom-1 -right-1 bg-blue-500 rounded-full p-0.5 border-2 border-black">
                  <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" />
                  </svg>
                </div>
              )}
            </div>
            <div>
              <h3 className="text-white font-bold text-base line-clamp-1 group-hover:text-violet-400 transition-colors">{token.name}</h3>
              <p className="text-gray-400 text-xs font-medium">${token.symbol}</p>
            </div>
          </div>
          <div className="text-right">
            <span className={`text-sm font-bold ${priceChange >= 0 ? 'text-emerald-400' : 'text-rose-400'} flex items-center justify-end gap-1`}>
              {priceChange >= 0 ? '↑' : '↓'} {Math.abs(priceChange).toFixed(2)}%
            </span>
          </div>
        </div>

        {/* Price & Market Cap */}
        <div className="space-y-3 mb-6 relative z-10 flex-1">
          <div className="flex justify-between items-center p-2 rounded-lg hover:bg-white/5 transition-colors">
            <span className="text-gray-500 text-xs font-medium">Price</span>
            <span className="text-white text-sm font-mono tracking-wide">${formatPrice(livePrice)}</span>
          </div>
          <div className="flex justify-between items-center p-2 rounded-lg hover:bg-white/5 transition-colors">
            <span className="text-gray-500 text-xs font-medium">MCap</span>
            <span className="text-white text-sm font-bold">${formatNumber(token.marketCap)}</span>
          </div>
          <div className="flex justify-between items-center p-2 rounded-lg hover:bg-white/5 transition-colors">
            <span className="text-gray-500 text-xs font-medium">Volume (24h)</span>
            <span className="text-white text-sm">${formatNumber(token.volume24h)}</span>
          </div>
        </div>

        {/* Graduation Progress */}
        {!token.graduated && (
          <div className="mb-6 relative z-10">
            <div className="flex justify-between items-center mb-2">
              <span className="text-gray-500 text-xs font-medium">Bonding Curve</span>
              <span className="text-violet-400 text-xs font-bold">{progressToGraduation.toFixed(1)}%</span>
            </div>
            <div className="w-full bg-white/5 rounded-full h-2 overflow-hidden border border-white/5">
              <div
                className={`h-full rounded-full transition-all duration-1000 ease-out ${isGraduating
                    ? 'bg-gradient-to-r from-emerald-500 to-emerald-400 animate-pulse'
                    : 'bg-gradient-to-r from-violet-600 to-blue-500'
                  }`}
                style={{ width: `${progressToGraduation}%` }}
              />
            </div>
            {isGraduating && (
              <p className="text-xs text-emerald-400 mt-2 font-medium text-center animate-pulse">
                ${formatNumber(BONDING_CURVE_PARAMS.graduationMarketCap - token.marketCap)} to Raydium!
              </p>
            )}
          </div>
        )}

        {/* Stats Row */}
        <div className="flex items-center justify-between text-xs mb-4 relative z-10 px-1">
          <div className="flex items-center gap-4">
            <span className="text-gray-500 flex items-center gap-1">
              <span className="text-white font-bold">{token.holders}</span> holders
            </span>
          </div>
          {token.platform === 'Space Lab' && (
            <span className="text-violet-400 text-xs font-medium flex items-center gap-1 bg-violet-500/10 px-2 py-0.5 rounded-full border border-violet-500/20">
              ✨ Space Lab
            </span>
          )}
        </div>

        {/* Quick Actions (visible on hover) */}
        <div className={`grid grid-cols-2 gap-3 transition-all duration-300 transform ${isHovered ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-0'} relative z-20`}>
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              window.open(`/token/${token.mint}?action=buy`, '_blank');
            }}
            className="bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 hover:text-emerald-300 py-2.5 rounded-xl text-xs font-bold transition-all border border-emerald-500/20 hover:border-emerald-500/40"
          >
            Quick Buy
          </button>
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              window.open(`/token/${token.mint}`, '_blank');
            }}
            className="bg-violet-600/20 hover:bg-violet-600/30 text-violet-400 hover:text-violet-300 py-2.5 rounded-xl text-xs font-bold transition-all border border-violet-500/20 hover:border-violet-500/40"
          >
            View Chart
          </button>
        </div>

        {/* Footer info */}
        <div className="mt-4 pt-3 border-t border-white/5 relative z-10 flex justify-between items-center">
          <p className="text-xs text-gray-500">
            Created {getTimeAgo(token.createdAt)}
          </p>
          <p className="text-xs text-gray-600 font-mono">
            by {shortenAddress(token.creatorWallet)}
          </p>
        </div>
      </div>
    </Link>
  );
}
