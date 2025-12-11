import { PublicKey } from '@solana/web3.js';

// Platform Configuration
export const PLATFORM_NAME = 'Space Lab';
export const PLATFORM_FEE_BPS = 100; // 1% trading fee (same as Pump.fun)

// Solana Constants
export const SOL_MINT = 'So11111111111111111111111111111111111111112';
export const TOKEN_DECIMALS = 9;
export const LAMPORTS_PER_SOL = 1_000_000_000;

// PumpFun Compatible Bonding Curve Parameters
export const BONDING_CURVE_PARAMS = {
  virtualSolReserves: 30 * LAMPORTS_PER_SOL, // 30 SOL
  virtualTokenReserves: 1_073_000_000 * Math.pow(10, TOKEN_DECIMALS),
  initialRealSolReserves: 0,
  initialRealTokenReserves: 793_100_000 * Math.pow(10, TOKEN_DECIMALS),
  tokenTotalSupply: 1_000_000_000 * Math.pow(10, TOKEN_DECIMALS),
  graduationThreshold: 85 * LAMPORTS_PER_SOL, // 85 SOL (~$69k at graduation)
  graduationMarketCap: 69420, // USD
};

// Token Creation
export const TOKEN_CREATION_FEE = 0; // Free to launch
export const MAX_NAME_LENGTH = 32;
export const MAX_SYMBOL_LENGTH = 10;
export const MAX_DESCRIPTION_LENGTH = 500;
export const MAX_IMAGE_SIZE = 2 * 1024 * 1024; // 2MB

// Trading
export const DEFAULT_SLIPPAGE_BPS = 50; // 0.5%
export const MAX_SLIPPAGE_BPS = 1000; // 10%

// API Endpoints
export const JUPITER_QUOTE_API = 'https://quote-api.jup.ag/v6/quote';
export const JUPITER_SWAP_API = 'https://quote-api.jup.ag/v6/swap';
export const JUPITER_REFERRAL_DASHBOARD = 'https://station.jup.ag/referral';

// External Links
export const PUMP_FUN_URL = 'https://pump.fun';
export const DEXSCREENER_URL = 'https://dexscreener.com/solana';
export const SOLSCAN_URL = 'https://solscan.io';

// Trending Categories
export const TRENDING_CATEGORIES = [
  { id: 'hot', label: '🔥 Hot', description: 'Trending now' },
  { id: 'new', label: '🆕 New', description: 'Just launched' },
  { id: 'graduating', label: '🎓 Graduating', description: 'About to hit Raydium' },
  { id: 'gainers', label: '📈 Top Gainers', description: '24h top performers' },
  { id: 'volume', label: '💎 High Volume', description: 'Most traded' },
] as const;

// Quick Buy Amounts (in SOL)
export const QUICK_BUY_AMOUNTS = [0.1, 0.5, 1];

// Program IDs (Example - Update with actual addresses)
export const PROGRAM_IDS = {
  bondingCurve: '6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwFc1',
  metadata: 'metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s',
};

// Color Theme
export const THEME = {
  primary: '#7C3AED',
  primaryHover: '#6D28D9',
  background: '#0A0A0B',
  cardBg: '#131314',
  border: '#1F1F22',
  textPrimary: '#FFFFFF',
  textSecondary: '#9CA3AF',
  success: '#10B981',
  danger: '#EF4444',
  warning: '#F59E0B',
};
