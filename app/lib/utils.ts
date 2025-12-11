import { LAMPORTS_PER_SOL } from '@solana/web3.js';

/**
 * Format a number with K, M, B suffixes
 */
export function formatNumber(num: number): string {
  if (num === null || num === undefined || isNaN(num)) return '0';
  
  if (num >= 1_000_000_000) {
    return (num / 1_000_000_000).toFixed(2) + 'B';
  }
  if (num >= 1_000_000) {
    return (num / 1_000_000).toFixed(2) + 'M';
  }
  if (num >= 1_000) {
    return (num / 1_000).toFixed(2) + 'K';
  }
  return num.toFixed(2);
}

/**
 * Format SOL amount from lamports
 */
export function formatSOL(lamports: number): string {
  return (lamports / LAMPORTS_PER_SOL).toFixed(4);
}

/**
 * Shorten an address for display
 */
export function shortenAddress(address: string, chars = 4): string {
  if (!address) return '';
  return `${address.slice(0, chars)}...${address.slice(-chars)}`;
}

/**
 * Get time ago string from timestamp
 */
export function getTimeAgo(timestamp: string | Date): string {
  const seconds = Math.floor((Date.now() - new Date(timestamp).getTime()) / 1000);
  
  if (seconds < 60) return `${seconds}s ago`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
  return `${Math.floor(seconds / 604800)}w ago`;
}

/**
 * Format price with appropriate decimals
 */
export function formatPrice(price: number): string {
  if (price === 0) return '0';
  if (price < 0.000001) return price.toExponential(2);
  if (price < 0.01) return price.toFixed(9);
  if (price < 1) return price.toFixed(6);
  if (price < 1000) return price.toFixed(4);
  return formatNumber(price);
}

/**
 * Calculate percentage change
 */
export function calculateChange(current: number, previous: number): number {
  if (!previous || previous === 0) return 0;
  return ((current - previous) / previous) * 100;
}

/**
 * Format percentage
 */
export function formatPercentage(value: number): string {
  const formatted = Math.abs(value).toFixed(2);
  return value >= 0 ? `+${formatted}%` : `-${formatted}%`;
}

/**
 * Sleep utility for async operations
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Validate Solana address
 */
export function isValidSolanaAddress(address: string): boolean {
  try {
    if (address.length < 32 || address.length > 44) return false;
    const decoded = new TextEncoder().encode(address);
    return decoded.length === address.length;
  } catch {
    return false;
  }
}

/**
 * Copy to clipboard
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

/**
 * Debounce function
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}
