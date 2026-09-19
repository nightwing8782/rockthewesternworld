import { NextRequest, NextResponse } from 'next/server';
import { getPresignedUploadUrl } from '@/lib/trophy/s3';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { fileName, fileType, format, isCover } = body;

    if (!fileName) {
      return NextResponse.json({ error: 'fileName is required' }, { status: 400 });
    }

    const cleanName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
    const folder = isCover ? 'covers' : `books/${format || 'cbz'}`;
    const fileKey = `${folder}/${cleanName}`;

    const contentType = fileType || (isCover ? 'image/jpeg' : 'application/octet-stream');
    const uploadUrl = await getPresignedUploadUrl(fileKey, contentType, 3600); // 1 hour

    return NextResponse.json({
      uploadUrl,
      fileKey,
    });
  } catch (err: any) {
    console.error('[API upload-url] Error:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to generate upload URL' },
      { status: 500 }
    );
  }
}
