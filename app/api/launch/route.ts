import { NextResponse } from 'next/server';
import { Connection, Keypair, Transaction, PublicKey, SystemProgram } from '@solana/web3.js';
import { TOKEN_PROGRAM_ID, createInitializeMintInstruction, MintLayout, createMintToInstruction, createAssociatedTokenAccountInstruction, getAssociatedTokenAddress } from '@solana/spl-token';
import { createCreateMetadataAccountV3Instruction } from '@metaplex-foundation/mpl-token-metadata';
import bs58 from 'bs58';

const METADATA_PROGRAM_ID = new PublicKey('metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s');

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

        console.log('Creating token transaction:', { name, symbol, userWallet });

        const connection = new Connection(
            process.env.NEXT_PUBLIC_RPC_URL || 'https://api.mainnet-beta.solana.com',
            'confirmed'
        );

        const platformWallet = getPlatformWallet();
        const mintKeypair = Keypair.generate();
        const userWalletPubkey = new PublicKey(userWallet);

        console.log('Mint address:', mintKeypair.publicKey.toString());

        const transaction = new Transaction();
        const mintRent = await connection.getMinimumBalanceForRentExemption(MintLayout.span);

        // Create mint account (platform pays rent)
        transaction.add(
            SystemProgram.createAccount({
                fromPubkey: platformWallet.publicKey,
                newAccountPubkey: mintKeypair.publicKey,
                lamports: mintRent,
                space: MintLayout.span,
                programId: TOKEN_PROGRAM_ID
            })
        );

        // Initialize mint - user is mint authority
        transaction.add(
            createInitializeMintInstruction(
                mintKeypair.publicKey,
                9,
                userWalletPubkey,
                null
            )
        );

        // Create metadata
        const [metadataPDA] = PublicKey.findProgramAddressSync(
            [
                Buffer.from('metadata'),
                METADATA_PROGRAM_ID.toBuffer(),
                mintKeypair.publicKey.toBuffer()
            ],
            METADATA_PROGRAM_ID
        );

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
                        data: {
                            name: name.substring(0, 32),
                            symbol: symbol.substring(0, 10),
                            uri: image || '',
                            sellerFeeBasisPoints: 0,
                            creators: [{ address: userWalletPubkey, verified: false, share: 100 }],
                            collection: null,
                            uses: null
                        },
                        isMutable: true,
                        collectionDetails: null
                    }
                }
            )
        );

        // Create user's token account
        const userATA = await getAssociatedTokenAddress(
            mintKeypair.publicKey,
            userWalletPubkey
        );

        transaction.add(
            createAssociatedTokenAccountInstruction(
                platformWallet.publicKey,
                userATA,
                userWalletPubkey,
                mintKeypair.publicKey
            )
        );

        // Mint initial supply to user
        const INITIAL_SUPPLY = BigInt(1_000_000_000) * BigInt(10 ** 9); // 1 billion tokens

        transaction.add(
            createMintToInstruction(
                mintKeypair.publicKey,
                userATA,
                userWalletPubkey, // User must sign as mint authority
                INITIAL_SUPPLY
            )
        );

        // Set transaction properties
        const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
        transaction.recentBlockhash = blockhash;
        transaction.feePayer = platformWallet.publicKey;

        // Partial sign (platform + mint keypair)
        // User will sign on frontend
        transaction.partialSign(platformWallet, mintKeypair);

        // Serialize for frontend
        const serializedTransaction = transaction.serialize({
            requireAllSignatures: false,
            verifySignatures: false
        }).toString('base64');

        return NextResponse.json({
            success: true,
            transaction: serializedTransaction,
            mint: mintKeypair.publicKey.toString(),
            name,
            symbol,
            description,
            image,
            twitter,
            telegram,
            website,
        });

    } catch (error: any) {
        console.error('Token creation failed:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to create token' },
            { status: 500 }
        );
    }
}
