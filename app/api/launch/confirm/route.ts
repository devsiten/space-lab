import { NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { mint, name, symbol, description, image, twitter, telegram, website, userWallet, signature } = body;

        if (!mint || !signature || !userWallet) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }

        // Save to database
        const sql = neon(process.env.DATABASE_URL!);

        await sql`
      INSERT INTO tokens (
        mint, name, symbol, description, image,
        twitter, telegram, website,
        deployed_by, creator_wallet, platform, signature,
        price, market_cap, liquidity, volume_24h, holders, txns_24h,
        created_at
      ) VALUES (
        ${mint},
        ${name},
        ${symbol},
        ${description || ''},
        ${image || null},
        ${twitter || null},
        ${telegram || null},
        ${website || null},
        ${userWallet},
        ${userWallet},
        'Space Lab',
        ${signature},
        0.000001,
        0,
        0,
        0,
        1,
        0,
        NOW()
      )
    `;

        console.log('Token saved to database:', mint);

        return NextResponse.json({
            success: true,
            mint,
            signature,
        });

    } catch (error: any) {
        console.error('Failed to save token:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to save token' },
            { status: 500 }
        );
    }
}
