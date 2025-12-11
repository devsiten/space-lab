import { NextResponse } from 'next/server';
import { Connection, Keypair, Transaction, SystemProgram, PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { TOKEN_PROGRAM_ID, createInitializeMintInstruction, MintLayout, createMintToInstruction, createAssociatedTokenAccountInstruction, getAssociatedTokenAddress } from '@solana/spl-token';
import { createCreateMetadataAccountV3Instruction, PROGRAM_ID as METADATA_PROGRAM_ID } from '@metaplex-foundation/mpl-token-metadata';
import bs58 from 'bs58';

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

// PumpFun compatible bonding curve program
const BONDING_CURVE_PROGRAM = new PublicKey(
  process.env.BONDING_CURVE_PROGRAM || '6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwFc1'
);

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

    console.log('Creating token:', { name, symbol, userWallet });
    
    const connection = new Connection(
      process.env.NEXT_PUBLIC_RPC_URL || 'https://api.mainnet-beta.solana.com',
      'confirmed'
    );
    
    const platformWallet = getPlatformWallet();
    
    // Generate mint keypair
    const mintKeypair = Keypair.generate();
    console.log('Mint address:', mintKeypair.publicKey.toString());
    
    // Build the transaction
    const transaction = new Transaction();
    
    // Calculate rent
    const mintRent = await connection.getMinimumBalanceForRentExemption(MintLayout.span);
    
    // 1. Create mint account
    transaction.add(
      SystemProgram.createAccount({
        fromPubkey: platformWallet.publicKey,
        newAccountPubkey: mintKeypair.publicKey,
        lamports: mintRent,
        space: MintLayout.span,
        programId: TOKEN_PROGRAM_ID
      })
    );
    
    // 2. Initialize mint with platform authority
    transaction.add(
      createInitializeMintInstruction(
        mintKeypair.publicKey,
        9, // decimals
        platformWallet.publicKey, // mint authority
        platformWallet.publicKey  // freeze authority
      )
    );
    
    // 3. Create metadata account
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
          address: platformWallet.publicKey,
          verified: true,
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
          mintAuthority: platformWallet.publicKey,
          payer: platformWallet.publicKey,
          updateAuthority: platformWallet.publicKey,
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
    
    // 4. Create bonding curve PDA
    const [bondingCurvePDA] = PublicKey.findProgramAddressSync(
      [Buffer.from('curve'), mintKeypair.publicKey.toBuffer()],
      BONDING_CURVE_PROGRAM
    );
    
    // 5. Create associated token account for bonding curve
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
    
    // 6. Mint initial supply (793.1M tokens for PumpFun compatibility)
    const INITIAL_SUPPLY = BigInt(793_100_000) * BigInt(10 ** 9);
    
    transaction.add(
      createMintToInstruction(
        mintKeypair.publicKey,
        bondingCurveATA,
        platformWallet.publicKey,
        INITIAL_SUPPLY
      )
    );
    
    // Set transaction properties
    const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
    transaction.recentBlockhash = blockhash;
    transaction.feePayer = platformWallet.publicKey;
    
    // Sign transaction
    transaction.sign(platformWallet, mintKeypair);
    
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
      deployedBy: platformWallet.publicKey.toString(),
      pumpFunUrl: `https://pump.fun/token/${mintKeypair.publicKey.toString()}`,
      yourPlatformUrl: `${process.env.NEXT_PUBLIC_URL || ''}/token/${mintKeypair.publicKey.toString()}`
    });
    
  } catch (error: any) {
    console.error('Token creation failed:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create token' },
      { status: 500 }
    );
  }
}
