'use client';

import { TokenCard } from './TokenCard';

interface TokenGridProps {
  tokens: any[];
  loading?: boolean;
}

export function TokenGrid({ tokens, loading }: TokenGridProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(9)].map((_, i) => (
          <TokenCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (!tokens || tokens.length === 0) {
    return (
      <div className="text-center py-20">
        <div className="text-gray-500 text-6xl mb-4">🔍</div>
        <p className="text-gray-400 text-lg">No tokens found</p>
        <p className="text-gray-500 text-sm mt-2">Be the first to launch one!</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {tokens.map((token, index) => (
        <TokenCard key={token.mint} token={token} rank={index + 1} />
      ))}
    </div>
  );
}

function TokenCardSkeleton() {
  return (
    <div className="bg-[#131314] border border-[#1F1F22] rounded-2xl p-6 animate-pulse">
      {/* Chart skeleton */}
      <div className="h-16 bg-[#1F1F22] rounded-xl mb-4" />
      
      {/* Header skeleton */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#1F1F22]" />
          <div>
            <div className="h-4 w-24 bg-[#1F1F22] rounded mb-2" />
            <div className="h-3 w-16 bg-[#1F1F22] rounded" />
          </div>
        </div>
        <div className="h-4 w-16 bg-[#1F1F22] rounded" />
      </div>
      
      {/* Stats skeleton */}
      <div className="space-y-3 mb-4">
        <div className="flex justify-between">
          <div className="h-3 w-12 bg-[#1F1F22] rounded" />
          <div className="h-3 w-20 bg-[#1F1F22] rounded" />
        </div>
        <div className="flex justify-between">
          <div className="h-3 w-12 bg-[#1F1F22] rounded" />
          <div className="h-3 w-16 bg-[#1F1F22] rounded" />
        </div>
        <div className="flex justify-between">
          <div className="h-3 w-12 bg-[#1F1F22] rounded" />
          <div className="h-3 w-14 bg-[#1F1F22] rounded" />
        </div>
      </div>
      
      {/* Progress bar skeleton */}
      <div className="mb-4">
        <div className="flex justify-between mb-1">
          <div className="h-3 w-14 bg-[#1F1F22] rounded" />
          <div className="h-3 w-10 bg-[#1F1F22] rounded" />
        </div>
        <div className="h-2 w-full bg-[#1F1F22] rounded-full" />
      </div>
      
      {/* Footer skeleton */}
      <div className="pt-3 border-t border-[#1F1F22]">
        <div className="h-3 w-full bg-[#1F1F22] rounded" />
      </div>
    </div>
  );
}
