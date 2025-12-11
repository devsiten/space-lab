import { Keypair } from '@solana/web3.js';
import bs58 from 'bs58';

/**
 * Generate a Solana keypair with address ending in specified suffix
 * @param suffix - The suffix to match (case-insensitive)
 * @param maxAttempts - Maximum attempts before giving up
 * @returns Keypair with matching address or null
 */
export async function generateVanityKeypair(
    suffix: string = 'lab',
    maxAttempts: number = 1000000
): Promise<Keypair | null> {
    const lowerSuffix = suffix.toLowerCase();

    console.log(`Grinding for address ending with "${suffix}"...`);
    const startTime = Date.now();

    for (let i = 0; i < maxAttempts; i++) {
        const keypair = Keypair.generate();
        const address = keypair.publicKey.toBase58();

        // Check if address ends with suffix (case-insensitive)
        if (address.toLowerCase().endsWith(lowerSuffix)) {
            const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
            console.log(`Found vanity address after ${i + 1} attempts (${elapsed}s): ${address}`);
            return keypair;
        }

        // Log progress every 10000 attempts
        if (i > 0 && i % 10000 === 0) {
            console.log(`Tried ${i} keypairs...`);
        }
    }

    console.log(`Could not find address ending with "${suffix}" after ${maxAttempts} attempts`);
    return null;
}

/**
 * Generate vanity keypair with timeout
 * @param suffix - The suffix to match
 * @param timeoutMs - Timeout in milliseconds
 * @returns Keypair or null if timeout
 */
export async function generateVanityKeypairWithTimeout(
    suffix: string = 'lab',
    timeoutMs: number = 30000 // 30 seconds default
): Promise<Keypair | null> {
    const lowerSuffix = suffix.toLowerCase();
    const startTime = Date.now();

    console.log(`Grinding for address ending with "${suffix}" (timeout: ${timeoutMs}ms)...`);

    let attempts = 0;
    while (Date.now() - startTime < timeoutMs) {
        const keypair = Keypair.generate();
        const address = keypair.publicKey.toBase58();
        attempts++;

        if (address.toLowerCase().endsWith(lowerSuffix)) {
            const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
            console.log(`Found vanity address after ${attempts} attempts (${elapsed}s): ${address}`);
            return keypair;
        }
    }

    console.log(`Timeout reached after ${attempts} attempts`);
    return null;
}

/**
 * Encode keypair secret key to base64 for storage
 */
export function encodeKeypair(keypair: Keypair): string {
    return Buffer.from(keypair.secretKey).toString('base64');
}

/**
 * Decode keypair from base64 or bs58
 */
export function decodeKeypair(encoded: string): Keypair {
    try {
        return Keypair.fromSecretKey(Buffer.from(encoded, 'base64'));
    } catch {
        return Keypair.fromSecretKey(bs58.decode(encoded));
    }
}

// Platform suffix - all tokens will end with this
export const PLATFORM_SUFFIX = 'lab';

// Pre-generated vanity keypairs pool (optional, for instant deployment)
// These would be pre-computed and stored securely
export const VANITY_KEYPAIR_POOL: string[] = [];
