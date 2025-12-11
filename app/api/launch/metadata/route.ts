import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }
    
    // Check file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'File too large. Max size is 2MB' },
        { status: 400 }
      );
    }
    
    // Check file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Allowed: JPEG, PNG, GIF, WebP' },
        { status: 400 }
      );
    }
    
    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    
    // Try Pinata first (if configured)
    if (process.env.PINATA_API_KEY && process.env.PINATA_SECRET_KEY) {
      try {
        const pinataFormData = new FormData();
        pinataFormData.append('file', new Blob([buffer]), file.name);
        
        const pinataResponse = await fetch(
          'https://api.pinata.cloud/pinning/pinFileToIPFS',
          {
            method: 'POST',
            headers: {
              'pinata_api_key': process.env.PINATA_API_KEY,
              'pinata_secret_api_key': process.env.PINATA_SECRET_KEY,
            },
            body: pinataFormData,
          }
        );
        
        if (pinataResponse.ok) {
          const { IpfsHash } = await pinataResponse.json();
          const imageUrl = `https://gateway.pinata.cloud/ipfs/${IpfsHash}`;
          
          return NextResponse.json({ imageUrl });
        }
      } catch (e) {
        console.warn('Pinata upload failed, trying fallback');
      }
    }
    
    // Fallback: Return base64 data URL (not recommended for production)
    // In production, you should use a proper storage solution
    const base64 = buffer.toString('base64');
    const dataUrl = `data:${file.type};base64,${base64}`;
    
    console.warn('Using base64 fallback - configure PINATA keys for production');
    
    return NextResponse.json({ 
      imageUrl: dataUrl,
      warning: 'Using base64 fallback. Configure storage service for production.'
    });
    
  } catch (error: any) {
    console.error('Metadata upload failed:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to upload metadata' },
      { status: 500 }
    );
  }
}
