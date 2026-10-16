import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data, error } = await supabase
      .from('subscribers')
      .select('id, email, status, created_at')
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ subscribers: data || [] });
  } catch (err: any) {
    console.error('[API /api/dispatch/subscribers Error]:', err);
    return NextResponse.json(
      { error: err.message || 'Internal server error fetching subscribers' },
      { status: 500 }
    );
  }
}
