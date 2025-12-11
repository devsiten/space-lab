import { Connection, Keypair, PublicKey, Transaction, VersionedTransaction } from '@solana/web3.js';
import bs58 from 'bs58';

let connectionInstance: Connection | null = null;

/**
 * Get Solana connection (singleton)
 */
export function getConnection(): Connection {
  if (!connectionInstance) {
    const rpcUrl = process.env.NEXT_PUBLIC_RPC_URL || 'https://api.mainnet-beta.solana.com';
    connectionInstance = new Connection(rpcUrl, {
      commitment: 'confirmed',
      confirmTransactionInitialTimeout: 60000,
    });
  }
  return connectionInstance;
}

/**
 * Get platform wallet keypair (server-side only)
 */
export function getPlatformWallet(): Keypair {
  const key = process.env.PLATFORM_WALLET_KEY;
  if (!key) {
    throw new Error('PLATFORM_WALLET_KEY not configured');
  }

  try {
    return Keypair.fromSecretKey(Buffer.from(key, 'base64'));
  } catch {
    return Keypair.fromSecretKey(bs58.decode(key));
  }
}

/**
 * Find metadata PDA for a token mint
 */
export function findMetadataPDA(mint: PublicKey): PublicKey {
  const METADATA_PROGRAM_ID = new PublicKey('metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s');

  const [pda] = PublicKey.findProgramAddressSync(
    [
      Buffer.from('metadata'),
      METADATA_PROGRAM_ID.toBuffer(),
      mint.toBuffer(),
    ],
    METADATA_PROGRAM_ID
  );

  return pda;
}

/**
 * Find bonding curve PDA
 */
export function findBondingCurvePDA(mint: PublicKey, programId: PublicKey): PublicKey {
  const [pda] = PublicKey.findProgramAddressSync(
    [Buffer.from('curve'), mint.toBuffer()],
    programId
  );

  return pda;
}

/**
 * Get token balance for a wallet
 */
export async function getTokenBalance(
  wallet: PublicKey,
  mint: PublicKey
): Promise<number> {
  try {
    const connection = getConnection();
    const tokenAccounts = await connection.getParsedTokenAccountsByOwner(wallet, {
      mint,
    });

    if (tokenAccounts.value.length === 0) return 0;

    return tokenAccounts.value[0].account.data.parsed.info.tokenAmount.uiAmount || 0;
  } catch {
    return 0;
  }
}

/**
 * Get SOL balance for a wallet
 */
export async function getSOLBalance(wallet: PublicKey): Promise<number> {
  try {
    const connection = getConnection();
    const balance = await connection.getBalance(wallet);
    return balance / 1e9;
  } catch {
    return 0;
  }
}

/**
 * Send and confirm transaction with retries
 */
export async function sendAndConfirmTransaction(
  transaction: Transaction | VersionedTransaction,
  signers?: Keypair[]
): Promise<string> {
  const connection = getConnection();
  let signature: string;

  if (transaction instanceof VersionedTransaction) {
    signature = await connection.sendTransaction(transaction, {
      skipPreflight: false,
      maxRetries: 3,
    });
  } else {
    if (signers && signers.length > 0) {
      transaction.sign(...signers);
    }
    signature = await connection.sendRawTransaction(transaction.serialize(), {
      skipPreflight: false,
      maxRetries: 3,
    });
  }

  // Wait for confirmation with timeout
  const latestBlockhash = await connection.getLatestBlockhash();
  await connection.confirmTransaction({
    signature,
    blockhash: latestBlockhash.blockhash,
    lastValidBlockHeight: latestBlockhash.lastValidBlockHeight,
  }, 'confirmed');

  return signature;
}

/**
 * Get recent blockhash
 */
export async function getRecentBlockhash(): Promise<{
  blockhash: string;
  lastValidBlockHeight: number;
}> {
  const connection = getConnection();
  return connection.getLatestBlockhash();
}

/**
 * Check if address is valid Solana address
 */
export function isValidPublicKey(address: string): boolean {
  try {
    new PublicKey(address);
    return true;
  } catch {
    return false;
  }
}
