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
        className="relative bg-[#131314] border border-[#1F1F22] rounded-2xl p-6 hover:border-purple-600 transition-all cursor-pointer group"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Rank Badge */}
        {rank && rank <= 3 && (
          <div className="absolute -top-3 -right-3 z-10">
            <div className={`
              px-3 py-1 rounded-full text-xs font-bold
              ${rank === 1 ? 'bg-yellow-500 text-black' : ''}
              ${rank === 2 ? 'bg-gray-400 text-black' : ''}
              ${rank === 3 ? 'bg-orange-600 text-white' : ''}
            `}>
              #{rank}
            </div>
          </div>
        )}

        {/* Graduating Badge */}
        {isGraduating && (
          <div className="absolute top-4 right-4 bg-green-500/20 text-green-400 text-xs px-2 py-1 rounded-full">
            🎓 Graduating Soon
          </div>
        )}

        {/* Mini Chart */}
        <div className="h-16 mb-4 -mx-2">
          <svg className="w-full h-full" viewBox="0 0 200 60" preserveAspectRatio="none">
            <defs>
              <linearGradient id={`gradient-${token.mint}`} x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor={priceChange >= 0 ? '#10B981' : '#EF4444'} stopOpacity="0.3" />
                <stop offset="100%" stopColor={priceChange >= 0 ? '#10B981' : '#EF4444'} stopOpacity="0" />
              </linearGradient>
            </defs>
            
            {sparklineData.length > 0 && (
              <>
                {/* Area under the line */}
                <path
                  d={`M 0,60 L 0,${60 - (sparklineData[0] / Math.max(...sparklineData)) * 50} ${
                    sparklineData.map((price, i) => 
                      `L ${(i / (sparklineData.length - 1)) * 200},${60 - (price / Math.max(...sparklineData)) * 50}`
                    ).join(' ')
                  } L 200,60 Z`}
                  fill={`url(#gradient-${token.mint})`}
                />
                
                {/* Line */}
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
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="relative">
              {token.image ? (
                <img 
                  src={token.image} 
                  alt={token.name}
                  className="w-10 h-10 rounded-xl object-cover"
                />
              ) : (
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-600 to-purple-400 flex items-center justify-center">
                  <span className="text-white font-bold">{token.symbol.charAt(0)}</span>
                </div>
              )}
              {token.verified && (
                <div className="absolute -bottom-1 -right-1 bg-blue-500 rounded-full p-0.5">
                  <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" />
                  </svg>
                </div>
              )}
            </div>
            <div>
              <h3 className="text-white font-semibold text-sm line-clamp-1">{token.name}</h3>
              <p className="text-gray-500 text-xs">${token.symbol}</p>
            </div>
          </div>
          <div className="text-right">
            <span className={`text-sm font-semibold ${priceChange >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              {priceChange >= 0 ? '↑' : '↓'} {Math.abs(priceChange).toFixed(2)}%
            </span>
          </div>
        </div>

        {/* Price & Market Cap */}
        <div className="space-y-2 mb-4">
          <div className="flex justify-between items-center">
            <span className="text-gray-500 text-xs">Price</span>
            <span className="text-white text-sm font-mono">${formatPrice(livePrice)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-500 text-xs">MCap</span>
            <span className="text-white text-sm">${formatNumber(token.marketCap)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-500 text-xs">24h Vol</span>
            <span className="text-white text-sm">${formatNumber(token.volume24h)}</span>
          </div>
        </div>

        {/* Graduation Progress */}
        {!token.graduated && (
          <div className="mb-4">
            <div className="flex justify-between items-center mb-1">
              <span className="text-gray-500 text-xs">Progress</span>
              <span className="text-purple-400 text-xs">{progressToGraduation.toFixed(1)}%</span>
            </div>
            <div className="w-full bg-[#0A0A0B] rounded-full h-2">
              <div 
                className={`h-2 rounded-full transition-all ${
                  isGraduating 
                    ? 'bg-gradient-to-r from-green-500 to-green-400 animate-pulse' 
                    : 'bg-gradient-to-r from-purple-600 to-purple-400'
                }`}
                style={{ width: `${progressToGraduation}%` }}
              />
            </div>
            {isGraduating && (
              <p className="text-xs text-green-400 mt-1">
                ${formatNumber(BONDING_CURVE_PARAMS.graduationMarketCap - token.marketCap)} to Raydium!
              </p>
            )}
          </div>
        )}

        {/* Stats Row */}
        <div className="flex items-center justify-between text-xs mb-4">
          <div className="flex items-center gap-4">
            <span className="text-gray-500">
              <span className="text-white">{token.holders}</span> holders
            </span>
            {token.txns24h !== undefined && (
              <span className="text-gray-500">
                <span className="text-white">{token.txns24h}</span> txns
              </span>
            )}
          </div>
          {token.platform === 'Space Lab' && (
            <span className="text-purple-400 text-xs">✨ Space Lab</span>
          )}
        </div>

        {/* Quick Actions (visible on hover) */}
        <div className={`grid grid-cols-2 gap-2 transition-all duration-200 ${isHovered ? 'opacity-100' : 'opacity-0'}`}>
          <button 
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              window.open(`/token/${token.mint}?action=buy`, '_blank');
            }}
            className="bg-green-600/20 hover:bg-green-600/30 text-green-400 py-2 rounded-lg text-xs font-semibold transition-all"
          >
            Quick Buy
          </button>
          <button 
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              window.open(`/token/${token.mint}`, '_blank');
            }}
            className="bg-purple-600/20 hover:bg-purple-600/30 text-purple-400 py-2 rounded-lg text-xs font-semibold transition-all"
          >
            View Chart
          </button>
        </div>

        {/* Created time */}
        <div className="mt-3 pt-3 border-t border-[#1F1F22]">
          <p className="text-xs text-gray-500">
            Created {getTimeAgo(token.createdAt)} • by {shortenAddress(token.creatorWallet)}
          </p>
        </div>
      </div>
    </Link>
  );
}
