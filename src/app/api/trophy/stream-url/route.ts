import { NextRequest, NextResponse } from 'next/server';
import { getPresignedDownloadUrl } from '@/lib/trophy/s3';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { fileKey } = body;

    if (!fileKey) {
      return NextResponse.json({ error: 'fileKey parameter is required' }, { status: 400 });
    }

    const streamUrl = await getPresignedDownloadUrl(fileKey, 86400); // 24 hours

    return NextResponse.json({
      streamUrl,
    });
  } catch (err: any) {
    console.error('[API stream-url] Error:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to generate presigned stream URL from Cloudflare R2' },
      { status: 500 }
    );
  }
}
