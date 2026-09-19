import { NextRequest, NextResponse } from 'next/server';
import { getPresignedUploadUrl } from '@/lib/trophy/s3';

export async function POST(req: NextRequest) {
  try {
    const { fileName, fileType, format, isCover } = await req.json();

    if (!fileName) {
      return NextResponse.json({ error: 'File name is required' }, { status: 400 });
    }

    const cleanName = fileName.toLowerCase().replace(/[^a-z0-9._-]+/g, '-');
    const timestamp = Date.now();
    const folder = isCover ? 'covers' : `library/${format || 'books'}`;
    const fileKey = `${folder}/${timestamp}-${cleanName}`;

    const uploadUrl = await getPresignedUploadUrl(
      fileKey,
      fileType || 'application/octet-stream',
      3600
    );

    return NextResponse.json({
      uploadUrl,
      fileKey,
    });
  } catch (err: any) {
    console.error('Error generating presigned upload URL:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to generate upload URL' },
      { status: 500 }
    );
  }
}
