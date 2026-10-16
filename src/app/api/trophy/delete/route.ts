import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { deleteR2Object } from '@/lib/trophy/s3';

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
    const { fileKey } = body;

    if (!fileKey || typeof fileKey !== 'string') {
      return NextResponse.json({ error: 'fileKey is required' }, { status: 400 });
    }

    const cleanKey = fileKey.replace(/^\/+/, '');
    if (!cleanKey.startsWith('books/') && !cleanKey.startsWith('covers/')) {
      return NextResponse.json({ error: 'Invalid file key' }, { status: 400 });
    }

    await deleteR2Object(cleanKey);

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('[API /api/trophy/delete Error]:', err);
    return NextResponse.json(
      { error: err.message || 'Internal server error deleting object' },
      { status: 500 }
    );
  }
}
