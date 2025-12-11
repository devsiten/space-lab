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
    <div className="glass-card rounded-2xl p-6 animate-pulse relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-50" />

      {/* Chart skeleton */}
      <div className="h-24 bg-white/5 rounded-xl mb-6 backdrop-blur-sm" />

      {/* Header skeleton */}
      <div className="flex items-start justify-between mb-6 relative">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/5" />
          <div>
            <div className="h-5 w-24 bg-white/5 rounded mb-2" />
            <div className="h-3 w-16 bg-white/5 rounded" />
          </div>
        </div>
        <div className="h-5 w-20 bg-white/5 rounded-lg" />
      </div>

      {/* Stats skeleton */}
      <div className="space-y-4 mb-6">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="flex justify-between items-center">
            <div className="h-3 w-16 bg-white/5 rounded" />
            <div className="h-3 w-24 bg-white/5 rounded" />
          </div>
        ))}
      </div>

      {/* Progress bar skeleton */}
      <div className="mb-6">
        <div className="flex justify-between mb-2">
          <div className="h-3 w-20 bg-white/5 rounded" />
          <div className="h-3 w-12 bg-white/5 rounded" />
        </div>
        <div className="h-2 w-full bg-white/5 rounded-full" />
      </div>

      {/* Footer skeleton */}
      <div className="pt-4 border-t border-white/5 flex gap-2">
        <div className="h-3 w-full bg-white/5 rounded" />
      </div>
    </div>
  );
}
