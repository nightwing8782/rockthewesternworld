import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getPresignedUploadUrl } from '@/lib/trophy/s3';

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { fileKey, contentType } = body;

    if (!fileKey || typeof fileKey !== 'string') {
      return NextResponse.json({ error: 'fileKey is required' }, { status: 400 });
    }

    // Restrict upload destinations to approved directory prefixes
    const cleanKey = fileKey.replace(/^\/+/, '');
    if (!cleanKey.startsWith('books/') && !cleanKey.startsWith('covers/')) {
      return NextResponse.json({ error: 'Invalid destination directory' }, { status: 400 });
    }

    const type = contentType || 'application/octet-stream';
    const uploadUrl = await getPresignedUploadUrl(cleanKey, type, 3600);

    return NextResponse.json({ uploadUrl });
  } catch (err: any) {
    console.error('[API /api/trophy/presign-upload Error]:', err);
    return NextResponse.json(
      { error: err.message || 'Internal server error generating upload URL' },
      { status: 500 }
    );
  }
}
