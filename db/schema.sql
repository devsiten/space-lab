-- Space Lab Database Schema for Neon PostgreSQL
-- Run this in Neon SQL Editor to set up your database

-- Drop existing tables (if you want to start fresh)
DROP VIEW IF EXISTS trending_tokens;
DROP VIEW IF EXISTS platform_stats;
DROP TABLE IF EXISTS referral_claims;
DROP TABLE IF EXISTS trades;
DROP TABLE IF EXISTS tokens;

-- Tokens table
CREATE TABLE tokens (
  mint VARCHAR(44) PRIMARY KEY,
  name VARCHAR(32) NOT NULL,
  symbol VARCHAR(10) NOT NULL,
  description TEXT,
  image TEXT,
  twitter VARCHAR(255),
  telegram VARCHAR(255),
  website VARCHAR(255),
  bonding_curve VARCHAR(44),
  deployed_by VARCHAR(44) NOT NULL,
  creator_wallet VARCHAR(44) NOT NULL,
  platform VARCHAR(32) DEFAULT 'Space Lab',
  signature VARCHAR(88),
  graduated BOOLEAN DEFAULT false,
  raydium_pool VARCHAR(44),
  market_cap NUMERIC(20, 2) DEFAULT 0,
  liquidity NUMERIC(20, 2) DEFAULT 0,
  volume_24h NUMERIC(20, 2) DEFAULT 0,
  holders INTEGER DEFAULT 0,
  txns_24h INTEGER DEFAULT 0,
  price NUMERIC(30, 18) DEFAULT 0,
  price_24h_ago NUMERIC(30, 18) DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  graduated_at TIMESTAMP
);

-- Trades table
CREATE TABLE trades (
  id SERIAL PRIMARY KEY,
  token_mint VARCHAR(44) REFERENCES tokens(mint),
  trader_wallet VARCHAR(44) NOT NULL,
  type VARCHAR(4) NOT NULL,
  amount_in NUMERIC(30, 9),
  amount_out NUMERIC(30, 9),
  price NUMERIC(30, 18),
  referral_earned NUMERIC(20, 9) DEFAULT 0,
  signature VARCHAR(88),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Referral claims table
CREATE TABLE referral_claims (
  id SERIAL PRIMARY KEY,
  amount_usd NUMERIC(20, 2),
  tokens_claimed JSONB,
  signature VARCHAR(88),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_tokens_created ON tokens(created_at DESC);
CREATE INDEX idx_tokens_market_cap ON tokens(market_cap DESC);
CREATE INDEX idx_tokens_volume ON tokens(volume_24h DESC);
CREATE INDEX idx_tokens_graduated ON tokens(graduated);
CREATE INDEX idx_tokens_platform ON tokens(platform);
CREATE INDEX idx_trades_token ON trades(token_mint);
CREATE INDEX idx_trades_created ON trades(created_at DESC);
CREATE INDEX idx_trades_trader ON trades(trader_wallet);

-- Views for common queries
CREATE VIEW trending_tokens AS
SELECT 
  t.*,
  CASE WHEN t.price_24h_ago > 0 
    THEN ((t.price - t.price_24h_ago) / t.price_24h_ago) * 100 
    ELSE 0 
  END as price_change_24h,
  (t.market_cap / 69420.0) * 100 as graduation_progress
FROM tokens t
WHERE t.graduated = false
ORDER BY t.volume_24h DESC, t.market_cap DESC;

CREATE VIEW platform_stats AS
SELECT
  COALESCE(SUM(volume_24h), 0) as total_volume,
  COUNT(*) as total_tokens,
  COUNT(CASE WHEN graduated = true THEN 1 END) as graduated_tokens,
  COUNT(CASE WHEN platform = 'Space Lab' THEN 1 END) as our_tokens
FROM tokens;
