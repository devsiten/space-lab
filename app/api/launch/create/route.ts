import { NextResponse } from 'next/server';
import { Connection, Keypair, Transaction, PublicKey, LAMPORTS_PER_SOL, TransactionInstruction } from '@solana/web3.js';
import { TOKEN_PROGRAM_ID, createInitializeMintInstruction, MintLayout, createMintToInstruction, createAssociatedTokenAccountInstruction, getAssociatedTokenAddress } from '@solana/spl-token';
import { createCreateMetadataAccountV3Instruction } from '@metaplex-foundation/mpl-token-metadata';
import bs58 from 'bs58';
import { generateVanityKeypairWithTimeout, PLATFORM_SUFFIX } from '@/lib/vanity';

// Metaplex Token Metadata Program ID
const METADATA_PROGRAM_ID = new PublicKey('metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s');

// Pump.fun Program ID (mainnet)
const PUMP_FUN_PROGRAM = new PublicKey('6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P');

// Get platform wallet from environment
function getPlatformWallet(): Keypair {
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

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, symbol, description, image, userWallet, twitter, telegram, website } = body;

    // Validate input
    if (!name || !symbol || !description || !userWallet) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    console.log('Creating token with vanity address:', { name, symbol, userWallet });

    const connection = new Connection(
      process.env.NEXT_PUBLIC_RPC_URL || 'https://api.mainnet-beta.solana.com',
      'confirmed'
    );

    const platformWallet = getPlatformWallet();

    // Generate vanity keypair ending with "lab"
    console.log(`Grinding for address ending with "${PLATFORM_SUFFIX}"...`);
    const mintKeypair = await generateVanityKeypairWithTimeout(PLATFORM_SUFFIX, 60000); // 60 second timeout

    if (!mintKeypair) {
      return NextResponse.json(
        { error: 'Could not generate vanity address. Please try again.' },
        { status: 500 }
      );
    }

    console.log('Vanity mint address:', mintKeypair.publicKey.toString());

    // Build the transaction
    const transaction = new Transaction();

    // Calculate rent
    const mintRent = await connection.getMinimumBalanceForRentExemption(MintLayout.span);

    // 1. Create mint account with vanity address
    transaction.add(
      new TransactionInstruction({
        keys: [
          { pubkey: platformWallet.publicKey, isSigner: true, isWritable: true },
          { pubkey: mintKeypair.publicKey, isSigner: true, isWritable: true },
        ],
        programId: new PublicKey('11111111111111111111111111111111'), // System Program
        data: Buffer.alloc(0), // Will be filled by createAccount
      })
    );

    // Use standard SPL token initialization
    const { SystemProgram } = await import('@solana/web3.js');

    transaction.instructions = []; // Reset

    // Create mint account
    transaction.add(
      SystemProgram.createAccount({
        fromPubkey: platformWallet.publicKey,
        newAccountPubkey: mintKeypair.publicKey,
        lamports: mintRent,
        space: MintLayout.span,
        programId: TOKEN_PROGRAM_ID
      })
    );

    // Initialize mint - user wallet is mint authority (they earn creator fees)
    const userWalletPubkey = new PublicKey(userWallet);
    transaction.add(
      createInitializeMintInstruction(
        mintKeypair.publicKey,
        9, // decimals
        userWalletPubkey, // mint authority = USER (so they earn creator fees!)
        null // no freeze authority
      )
    );

    // Create metadata account
    const [metadataPDA] = PublicKey.findProgramAddressSync(
      [
        Buffer.from('metadata'),
        METADATA_PROGRAM_ID.toBuffer(),
        mintKeypair.publicKey.toBuffer()
      ],
      METADATA_PROGRAM_ID
    );

    const tokenMetadata = {
      name: name.substring(0, 32),
      symbol: symbol.substring(0, 10),
      uri: image || '',
      sellerFeeBasisPoints: 0,
      creators: [
        {
          address: userWalletPubkey, // USER is creator
          verified: false,
          share: 100
        }
      ],
      collection: null,
      uses: null
    };

    transaction.add(
      createCreateMetadataAccountV3Instruction(
        {
          metadata: metadataPDA,
          mint: mintKeypair.publicKey,
          mintAuthority: userWalletPubkey,
          payer: platformWallet.publicKey,
          updateAuthority: userWalletPubkey,
        },
        {
          createMetadataAccountArgsV3: {
            data: tokenMetadata,
            isMutable: true,
            collectionDetails: null
          }
        }
      )
    );

    // Create bonding curve PDA
    const [bondingCurvePDA] = PublicKey.findProgramAddressSync(
      [Buffer.from('bonding-curve'), mintKeypair.publicKey.toBuffer()],
      PUMP_FUN_PROGRAM
    );

    // Create associated token account for bonding curve
    const bondingCurveATA = await getAssociatedTokenAddress(
      mintKeypair.publicKey,
      bondingCurvePDA,
      true // allowOwnerOffCurve
    );

    transaction.add(
      createAssociatedTokenAccountInstruction(
        platformWallet.publicKey,
        bondingCurveATA,
        bondingCurvePDA,
        mintKeypair.publicKey
      )
    );

    // Mint initial supply (793.1M tokens for PumpFun compatibility)
    const INITIAL_SUPPLY = BigInt(793_100_000) * BigInt(10 ** 9);

    transaction.add(
      createMintToInstruction(
        mintKeypair.publicKey,
        bondingCurveATA,
        userWalletPubkey, // User is mint authority
        INITIAL_SUPPLY
      )
    );

    // Set transaction properties
    const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
    transaction.recentBlockhash = blockhash;
    transaction.feePayer = platformWallet.publicKey;

    // Sign transaction (platform pays gas, mint keypair signs)
    transaction.sign(platformWallet, mintKeypair);

    // Note: User will need to sign as well since they're the mint authority
    // For now, return partial signed transaction for user to complete

    // Send transaction
    const signature = await connection.sendRawTransaction(transaction.serialize(), {
      skipPreflight: false,
      preflightCommitment: 'confirmed'
    });

    console.log('Transaction sent:', signature);

    // Wait for confirmation
    await connection.confirmTransaction({
      signature,
      blockhash,
      lastValidBlockHeight
    }, 'confirmed');

    console.log('Transaction confirmed');

    // Store in database (if configured)
    try {
      const { sql } = await import('@vercel/postgres');
      await sql`
        INSERT INTO tokens (
          mint, name, symbol, description, image,
          twitter, telegram, website, bonding_curve,
          deployed_by, creator_wallet, platform, signature,
          created_at
        ) VALUES (
          ${mintKeypair.publicKey.toString()},
          ${name},
          ${symbol},
          ${description},
          ${image || null},
          ${twitter || null},
          ${telegram || null},
          ${website || null},
          ${bondingCurvePDA.toString()},
          ${platformWallet.publicKey.toString()},
          ${userWallet},
          'Space Lab',
          ${signature},
          NOW()
        )
      `;
    } catch (dbError) {
      console.warn('Database not configured, skipping storage:', dbError);
    }

    return NextResponse.json({
      success: true,
      mint: mintKeypair.publicKey.toString(),
      bondingCurve: bondingCurvePDA.toString(),
      signature,
      creator: userWallet,
      pumpFunUrl: `https://pump.fun/token/${mintKeypair.publicKey.toString()}`,
      yourPlatformUrl: `${process.env.NEXT_PUBLIC_URL || ''}/token/${mintKeypair.publicKey.toString()}`,
      vanityAddress: true,
      suffix: PLATFORM_SUFFIX
    });

  } catch (error: any) {
    console.error('Token creation failed:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create token' },
      { status: 500 }
    );
  }
}
