import { createClient } from './supabase/client';

export interface Subscriber {
  id?: string;
  email: string;
  created_at?: string;
  status?: string;
}

export interface DispatchEmailOptions {
  title: string;
  slug: string;
  kicker?: string;
  excerpt?: string;
  contentHtml?: string;
  publishedAt?: string;
  readingTime?: number;
  baseUrl?: string;
}

export interface SendEmailResult {
  success: boolean;
  id?: string;
  error?: string;
}

export async function fetchSubscribers(): Promise<Subscriber[]> {
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('subscribers')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('Error fetching subscribers from Supabase:', error);
      return [];
    }
    return data || [];
  } catch (e) {
    console.warn('fetchSubscribers exception:', e);
    return [];
  }
}

export function generateDispatchEmailHtml(opts: DispatchEmailOptions): string {
  const baseUrl = opts.baseUrl || 'https://rockthewesternworld.com';
  const articleUrl = `${baseUrl}/${opts.slug}`;
  const dateFormatted = opts.publishedAt
    ? new Date(opts.publishedAt).toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      })
    : new Date().toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      });
  const kicker = opts.kicker || 'EDITORIAL DISPATCH';
  const readingTime = opts.readingTime || 4;

  const previewContent = opts.excerpt
    ? `<p style="font-size: 16px; line-height: 1.7; color: #2C2825; font-style: italic; margin-bottom: 24px; padding-left: 16px; border-left: 3px solid #B45309;">${opts.excerpt}</p>`
    : '';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${opts.title}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #F3EFEA; font-family: Georgia, 'Times New Roman', serif; color: #1C1917; -webkit-font-smoothing: antialiased;">
  <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #F3EFEA; padding: 30px 10px;">
    <tr>
      <td align="center">
        <!-- Main Email Container -->
        <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 620px; background-color: #FAF8F5; border: 1px solid #DDD5C7; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
          
          <!-- Top Ornamental Bar -->
          <tr>
            <td style="background-color: #1C1917; padding: 6px 0; text-align: center;">
              <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0">
                <tr>
                  <td align="center" style="color: #D4AF37; font-size: 10px; letter-spacing: 0.25em; text-transform: uppercase; font-family: 'Cinzel', 'Trajan Pro', Georgia, serif; font-weight: bold;">
                    ◆ &nbsp; THE DISPATCH &nbsp; ◆ &nbsp; LEXINGTON, KY &nbsp; ◆
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Broadsheet Masthead Header -->
          <tr>
            <td style="padding: 32px 30px 20px 30px; text-align: center; border-bottom: 2px double #DDD5C7;">
              <a href="${baseUrl}" style="text-decoration: none; color: #1C1917;" target="_blank">
                <h1 style="margin: 0 0 6px 0; font-family: 'Cinzel', 'Times New Roman', Georgia, serif; font-size: 26px; font-weight: 800; letter-spacing: 0.15em; text-transform: uppercase; color: #1C1917; line-height: 1.2;">
                  ROCK THE WESTERN WORLD
                </h1>
              </a>
              <p style="margin: 0; font-size: 11px; font-style: italic; color: #66615C; letter-spacing: 0.05em;">
                A Broadsheet of Culture, Politics, and Critical Inquiries
              </p>
            </td>
          </tr>

          <!-- Article Content Section -->
          <tr>
            <td style="padding: 36px 32px 30px 32px;">
              
              <!-- Kicker & Date Tag -->
              <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-bottom: 14px;">
                <tr>
                  <td style="font-size: 11px; font-weight: bold; text-transform: uppercase; letter-spacing: 0.18em; color: #B45309; font-family: Arial, sans-serif;">
                    ${kicker}
                  </td>
                  <td align="right" style="font-size: 11px; color: #78716C; font-family: Arial, sans-serif;">
                    ${dateFormatted}
                  </td>
                </tr>
              </table>

              <!-- Main Title -->
              <h2 style="margin: 0 0 16px 0; font-family: 'Cinzel', Georgia, serif; font-size: 24px; font-weight: 700; line-height: 1.3; color: #1C1917;">
                <a href="${articleUrl}" style="color: #1C1917; text-decoration: none;" target="_blank">
                  ${opts.title}
                </a>
              </h2>

              <!-- Metadata / Byline -->
              <p style="margin: 0 0 24px 0; font-size: 12px; color: #78716C; font-family: Arial, sans-serif;">
                By <strong style="color: #1C1917;">Dan</strong> &nbsp;•&nbsp; ${readingTime} min read
              </p>

              <!-- Excerpt / Pullquote -->
              ${previewContent}

              <!-- Body Excerpt if provided -->
              ${opts.contentHtml ? `
                <div style="font-size: 15px; line-height: 1.75; color: #332F2B; margin-bottom: 28px;">
                  ${opts.contentHtml}
                </div>
              ` : `
                <p style="font-size: 15px; line-height: 1.75; color: #332F2B; margin-bottom: 28px;">
                  A new piece has just been published on the public broadsheet. You can read the complete essay, citations, and archival discussion on the publication website.
                </p>
              `}

              <!-- Primary CTA Button (Art Deco Royal Blue & Gold) -->
              <table role="presentation" border="0" cellspacing="0" cellpadding="0" style="margin: 32px 0 16px 0;" align="center">
                <tr>
                  <td align="center" style="background-color: #1E40AF; border-radius: 2px;">
                    <a href="${articleUrl}" target="_blank" style="display: inline-block; padding: 14px 28px; font-family: Arial, sans-serif; font-size: 12px; font-weight: bold; color: #FAF8F5; text-decoration: none; text-transform: uppercase; letter-spacing: 0.18em;">
                      Read Full Piece on Broadsheet &rarr;
                    </a>
                  </td>
                </tr>
              </table>

            </td>
          </tr>

          <!-- Ornamental Divider -->
          <tr>
            <td align="center" style="padding: 10px 32px 20px 32px;">
              <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0">
                <tr>
                  <td style="border-top: 1px solid #DDD5C7; text-align: center;">
                    <span style="background-color: #FAF8F5; padding: 0 10px; color: #B45309; font-size: 12px; position: relative; top: -7px;">
                      ◆
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #F2ECE1; padding: 24px 30px; text-align: center; border-top: 1px solid #DDD5C7;">
              <p style="margin: 0 0 8px 0; font-family: 'Cinzel', Georgia, serif; font-size: 13px; font-weight: bold; letter-spacing: 0.1em; color: #1C1917; text-transform: uppercase;">
                Rock The Western World
              </p>
              <p style="margin: 0 0 12px 0; font-size: 11px; line-height: 1.5; color: #66615C; font-family: Arial, sans-serif;">
                Delivered directly from the Lexington drafting desk. You received this dispatch because you subscribed at <a href="${baseUrl}" style="color: #1E40AF; text-decoration: underline;" target="_blank">rockthewesternworld.com</a>.
              </p>
              <p style="margin: 0; font-size: 10px; color: #9C9589; font-family: Arial, sans-serif;">
                &copy; ${new Date().getFullYear()} Rock The Western World. All rights reserved.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export async function sendResendEmail({
  apiKey,
  from,
  to,
  subject,
  html,
}: {
  apiKey?: string;
  from?: string;
  to: string | string[];
  subject: string;
  html: string;
}): Promise<SendEmailResult> {
  const cleanKey = (apiKey || process.env.NEXT_PUBLIC_RESEND_API_KEY || '').trim();
  if (!cleanKey) {
    return { success: false, error: 'Resend API key is required. Please set it in Settings.' };
  }

  const sender = (from || '').trim() || 'Rock The Western World <onboarding@resend.dev>';

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${cleanKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: sender,
        to: Array.isArray(to) ? to : [to],
        subject,
        html,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      return {
        success: false,
        error: data.message || `Resend error: ${res.statusText}`,
      };
    }

    return {
      success: true,
      id: data.id,
    };
  } catch (err: any) {
    return {
      success: false,
      error: err.message || 'Failed to connect to Resend API.',
    };
  }
}
