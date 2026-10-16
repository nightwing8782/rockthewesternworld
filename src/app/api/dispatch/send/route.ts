import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

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

    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'RESEND_API_KEY is not configured on the server.' },
        { status: 500 }
      );
    }

    const body = await req.json();
    const { from, to, subject, html } = body;

    if (!to || !subject || !html) {
      return NextResponse.json(
        { error: 'Missing required email fields (to, subject, html)' },
        { status: 400 }
      );
    }

    const sender = (from || '').trim() || 'Rock The Western World <onboarding@resend.dev>';
    const recipients = Array.isArray(to) ? to : [to];

    const resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey.trim()}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: sender,
        to: recipients,
        subject,
        html,
      }),
    });

    const data = await resendResponse.json();

    if (!resendResponse.ok) {
      return NextResponse.json(
        { error: data.message || `Resend error: ${resendResponse.statusText}` },
        { status: resendResponse.status }
      );
    }

    return NextResponse.json({ success: true, id: data.id });
  } catch (err: any) {
    console.error('[API /api/dispatch/send Error]:', err);
    return NextResponse.json(
      { error: err.message || 'Internal server error while sending email' },
      { status: 500 }
    );
  }
}
