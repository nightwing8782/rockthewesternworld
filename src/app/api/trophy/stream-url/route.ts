import { NextRequest, NextResponse } from 'next/server';
import { getPresignedDownloadUrl } from '@/lib/trophy/s3';

export async function POST(req: NextRequest) {
  try {
    const { fileKey } = await req.json();

    if (!fileKey) {
      return NextResponse.json({ error: 'fileKey is required' }, { status: 400 });
    }

    const streamUrl = await getPresignedDownloadUrl(fileKey, 86400); // 24 hours

    return NextResponse.json({
      streamUrl,
    });
  } catch (err: any) {
    console.error('Error generating presigned stream URL:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to generate stream URL' },
      { status: 500 }
    );
  }
}
