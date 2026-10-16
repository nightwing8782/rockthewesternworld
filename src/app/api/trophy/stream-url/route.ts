import { NextRequest, NextResponse } from 'next/server';
import { getPresignedDownloadUrl } from '@/lib/trophy/s3';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { fileKey, expiresInSeconds } = body;

    if (!fileKey || typeof fileKey !== 'string') {
      return NextResponse.json({ error: 'fileKey is required' }, { status: 400 });
    }

    const cleanKey = fileKey.replace(/^\/+/, '');
    if (!cleanKey.startsWith('books/') && !cleanKey.startsWith('covers/')) {
      return NextResponse.json({ error: 'Invalid file key' }, { status: 400 });
    }

    const expiry = typeof expiresInSeconds === 'number' && expiresInSeconds > 0
      ? Math.min(expiresInSeconds, 604800) // max 7 days
      : 86400; // default 24 hours

    const streamUrl = await getPresignedDownloadUrl(cleanKey, expiry);

    return NextResponse.json({ streamUrl });
  } catch (err: any) {
    console.error('[API /api/trophy/stream-url Error]:', err);
    return NextResponse.json(
      { error: err.message || 'Internal server error generating stream URL' },
      { status: 500 }
    );
  }
}
