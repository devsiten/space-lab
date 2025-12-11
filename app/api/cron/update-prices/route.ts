import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  // Verify cron secret (in production)
  const authHeader = request.headers.get('authorization');
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  try {
    const { sql } = await import('@vercel/postgres');
    
    // Get all active tokens
    const tokens = await sql`
      SELECT mint, price FROM tokens 
      WHERE graduated = false 
      ORDER BY created_at DESC 
      LIMIT 100
    `;
    
    let updated = 0;
    
    for (const token of tokens.rows) {
      try {
        // Get current price from Jupiter
        const quoteUrl = `https://quote-api.jup.ag/v6/quote?inputMint=So11111111111111111111111111111111111111112&outputMint=${token.mint}&amount=1000000000`;
        const response = await fetch(quoteUrl);
        
        if (response.ok) {
          const quote = await response.json();
          const newPrice = 1 / (parseInt(quote.outAmount) / 1e9);
          
          // Update price in database
          await sql`
            UPDATE tokens SET
              price_24h_ago = CASE 
                WHEN created_at < NOW() - INTERVAL '24 hours' THEN price 
                ELSE price_24h_ago 
              END,
              price = ${newPrice}
            WHERE mint = ${token.mint}
          `;
          
          updated++;
        }
      } catch (e) {
        console.warn(`Failed to update price for ${token.mint}`);
      }
    }
    
    return NextResponse.json({
      success: true,
      updated,
      total: tokens.rows.length,
    });
    
  } catch (error: any) {
    console.error('Cron job failed:', error);
    return NextResponse.json(
      { error: error.message || 'Cron job failed' },
      { status: 500 }
    );
  }
}
