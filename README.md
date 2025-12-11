# Space Lab - Token Launchpad

A complete PumpFun-style token launchpad built with Next.js 14, Solana, and Jupiter. Launch tokens with YOUR authority that appear on PumpFun, and earn 0.5% referral fees on all trades through Jupiter.

## Features

- 🚀 **Token Creation** - Deploy tokens with YOUR platform wallet as authority
- 🔄 **Jupiter Integration** - All trades routed through Jupiter with referral fees
- 📊 **Real-time Charts** - Live price charts using lightweight-charts
- 💰 **Revenue Model** - Earn 0.5% on ALL trading volume
- 🎓 **Graduation Tracking** - Visual progress towards Raydium listing
- 📱 **Mobile Responsive** - Works perfectly on all devices
- 🌙 **Dark Theme** - Beautiful PumpFun-inspired UI with purple accent

## Tech Stack

- **Frontend**: Next.js 14, TypeScript, Tailwind CSS
- **Blockchain**: Solana Web3.js, SPL Token, Metaplex
- **Trading**: Jupiter API v6 with referral program
- **Database**: Vercel Postgres
- **Cache**: Vercel KV (Redis)
- **Deployment**: Vercel

## Quick Start

### 1. Clone and Install

```bash
git clone <your-repo-url>
cd space-lab
npm install
```

### 2. Set Up Environment Variables

Copy `.env.example` to `.env.local` and fill in your values:

```bash
cp .env.example .env.local
```

Required variables:
- `PLATFORM_WALLET_KEY` - Base64 encoded keypair for deploying tokens
- `JUPITER_REFERRAL_ACCOUNT` - Your Jupiter referral account (create at https://station.jup.ag/referral)
- `NEXT_PUBLIC_RPC_URL` - Solana RPC endpoint

### 3. Create Jupiter Referral Account

1. Go to https://station.jup.ag/referral
2. Connect your wallet
3. Create a referral account
4. Copy the account public key to `JUPITER_REFERRAL_ACCOUNT`

### 4. Generate Platform Wallet

```bash
# Install Solana CLI if needed
sh -c "$(curl -sSfL https://release.solana.com/v1.17.0/install)"

# Generate new keypair
solana-keygen new --outfile platform-wallet.json

# Get base64 encoded key
cat platform-wallet.json | base64 -w 0
```

Copy the base64 output to `PLATFORM_WALLET_KEY`.

### 5. Set Up Database

1. Create a Vercel Postgres database in your Vercel dashboard
2. Copy the connection strings to your environment
3. Run the schema:

```sql
-- Copy contents of app/lib/schema.sql and run in Vercel Postgres console
```

### 6. Run Locally

```bash
npm run dev
```

Visit http://localhost:3000

### 7. Deploy to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

## Project Structure

```
space-lab/
├── app/
│   ├── api/
│   │   ├── launch/          # Token creation endpoints
│   │   ├── trade/           # Buy/sell with Jupiter
│   │   ├── tokens/          # Token data endpoints
│   │   └── cron/            # Price update jobs
│   ├── components/          # React components
│   ├── lib/                 # Utilities and constants
│   ├── create/              # Token creation page
│   └── token/[address]/     # Token detail page
├── public/                  # Static assets
├── vercel.json             # Vercel config with crons
└── package.json
```

## Revenue Model

1. **Launch Fees**: 0.02 SOL per token (configurable)
2. **Trading Referrals**: 0.5% on ALL volume through Jupiter
3. **Premium Features** (optional): Trending spots, promoted tokens

### Example Revenue Calculation

- Daily volume: $1,000,000
- Your referral cut: $5,000/day (0.5%)
- Monthly projection: ~$150,000

## Key Configurations

### Token Creation Parameters (lib/constants.ts)

```typescript
export const BONDING_CURVE_PARAMS = {
  virtualSolReserves: 30 * LAMPORTS_PER_SOL,
  tokenTotalSupply: 1_000_000_000 * 10**9,
  graduationMarketCap: 69420, // USD
};
```

### Jupiter Integration (api/trade/buy/route.ts)

```typescript
const PLATFORM_FEE_BPS = 50; // 0.5% referral fee (max allowed)
const referralAccount = process.env.JUPITER_REFERRAL_ACCOUNT;
```

## Important Notes

1. **Token Authority**: All tokens are deployed with YOUR platform wallet as the mint authority
2. **PumpFun Visibility**: Tokens appear on pump.fun if bonding curve is compatible
3. **Jupiter Referrals**: Fees accumulate in your referral account, claim via station.jup.ag
4. **Database Optional**: App works with mock data if database not configured

## Claiming Referral Fees

```bash
# Via CLI
npm install -g @jup-ag/referral-cli
jupiter-referral claim --keypair ~/.config/solana/id.json

# Or via Jupiter Station dashboard
# https://station.jup.ag/referral
```

## Security Considerations

- Never expose `PLATFORM_WALLET_KEY` publicly
- Use environment variables for all secrets
- Consider using a dedicated wallet for the platform
- Monitor wallet balance for gas fees

## License

MIT License - See LICENSE file

## Support

- Twitter: @yourplatform
- Telegram: t.me/yourplatform
- Discord: discord.gg/yourplatform
