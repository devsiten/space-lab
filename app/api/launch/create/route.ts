import { NextResponse } from 'next/server';
import { Connection, Keypair, Transaction, PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { TOKEN_PROGRAM_ID, createInitializeMintInstruction, MintLayout, createMintToInstruction, createAssociatedTokenAccountInstruction, getAssociatedTokenAddress } from '@solana/spl-token';
import { createCreateMetadataAccountV3Instruction } from '@metaplex-foundation/mpl-token-metadata';
import bs58 from 'bs58';
import { neon } from '@neondatabase/serverless';

const METADATA_PROGRAM_ID = new PublicKey('metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s');
const PUMP_FUN_PROGRAM = new PublicKey('6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P');

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
    const mintKeypair = Keypair.generate();

    console.log('Mint address:', mintKeypair.publicKey.toString());

    const transaction = new Transaction();
    const mintRent = await connection.getMinimumBalanceForRentExemption(MintLayout.span);
    const { SystemProgram } = await import('@solana/web3.js');

    transaction.add(
      SystemProgram.createAccount({
        fromPubkey: platformWallet.publicKey,
        newAccountPubkey: mintKeypair.publicKey,
        lamports: mintRent,
        space: MintLayout.span,
        programId: TOKEN_PROGRAM_ID
      })
    );

    const userWalletPubkey = new PublicKey(userWallet);
    transaction.add(
      createInitializeMintInstruction(
        mintKeypair.publicKey,
        9,
        userWalletPubkey,
        null
      )
    );

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
          address: userWalletPubkey,
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

    const [bondingCurvePDA] = PublicKey.findProgramAddressSync(
      [Buffer.from('bonding-curve'), mintKeypair.publicKey.toBuffer()],
      PUMP_FUN_PROGRAM
    );

    const bondingCurveATA = await getAssociatedTokenAddress(
      mintKeypair.publicKey,
      bondingCurvePDA,
      true
    );

    transaction.add(
      createAssociatedTokenAccountInstruction(
        platformWallet.publicKey,
        bondingCurveATA,
        bondingCurvePDA,
        mintKeypair.publicKey
      )
    );

    const INITIAL_SUPPLY = BigInt(793_100_000) * BigInt(10 ** 9);

    transaction.add(
      createMintToInstruction(
        mintKeypair.publicKey,
        bondingCurveATA,
        userWalletPubkey,
        INITIAL_SUPPLY
      )
    );

    const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
    transaction.recentBlockhash = blockhash;
    transaction.feePayer = platformWallet.publicKey;

    transaction.sign(platformWallet, mintKeypair);

    const signature = await connection.sendRawTransaction(transaction.serialize(), {
      skipPreflight: false,
      preflightCommitment: 'confirmed'
    });

    console.log('Transaction sent:', signature);

    await connection.confirmTransaction({
      signature,
      blockhash,
      lastValidBlockHeight
    }, 'confirmed');

    console.log('Transaction confirmed');

    // Save to Neon database
    try {
      const sql = neon(process.env.DATABASE_URL!);
      
      await sql`
        INSERT INTO tokens (
          mint, name, symbol, description, image,
          twitter, telegram, website, bonding_curve,
          deployed_by, creator_wallet, platform, signature,
          price, market_cap, created_at
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
          0.000001,
          0,
          NOW()
        )
      `;
      
      console.log('Token saved to database');
    } catch (dbError: any) {
      console.error('Database error:', dbError.message);
    }

    return NextResponse.json({
      success: true,
      mint: mintKeypair.publicKey.toString(),
      bondingCurve: bondingCurvePDA.toString(),
      signature,
      creator: userWallet,
    });

  } catch (error: any) {
    console.error('Token creation failed:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create token' },
      { status: 500 }
    );
  }
}
