import Masthead from '@/components/navigation/Masthead';
import BroadsheetFeed from '@/components/home/BroadsheetFeed';
import { createClient } from '@/lib/supabase/server';
import { Entry } from '@/types/database';
import Link from 'next/link';
import fs from 'fs';
import path from 'path';

async function getPublishedEntries(): Promise<Entry[]> {
  const map = new Map<string, Entry>();

  // 1. Fetch published entries from Supabase
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('entries')
      .select('*')
      .eq('status', 'published')
      .order('published_at', { ascending: false });

    if (!error && data) {
      data.forEach((item) => {
        const s = item.slug || item.id;
        if (s) map.set(s, item as Entry);
      });
    }
  } catch (err) {}

  // 2. Load and merge WordPress historical archive
  try {
    const archivePath = path.join(process.cwd(), 'public', 'archive', 'imported-entries.json');
    if (fs.existsSync(archivePath)) {
      const parsed: Entry[] = JSON.parse(fs.readFileSync(archivePath, 'utf8'));
      parsed.forEach((e, idx) => {
        const s = e.slug || e.id || `wp-${idx}`;
        if (s && !map.has(s) && (e.status === 'published' || !e.status)) {
          map.set(s, { ...e, id: e.id || s });
        }
      });
    }
  } catch (e) {}

  return Array.from(map.values()).sort((a, b) => {
    const timeA = new Date(a.published_at || a.created_at || '').getTime() || 0;
    const timeB = new Date(b.published_at || b.created_at || '').getTime() || 0;
    return timeB - timeA;
  });
}

export default async function HomePage() {
  const allEntries = await getPublishedEntries();

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-[#242120] flex flex-col selection:bg-[#1E40AF] selection:text-white">
      <Masthead />
      <BroadsheetFeed initialEntries={allEntries} />
      {/* Footer */}
      <footer className="w-full bg-[#FAF8F5] border-t-2 border-[#1C1917] mt-16 py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-8 lg:px-12 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-serif text-[#44403C]">
          <div>
            <span className="font-display font-bold uppercase tracking-wider text-[#1C1917]">
              Rock The Western World
            </span>{' '}
            — An occasional journal of essays, culture, and records by Dan Billings.
          </div>
          <div className="flex items-center gap-4 text-xs font-display uppercase tracking-wider font-semibold">
            <Link href="/journal" className="hover:text-[#1E40AF] transition-colors">
              Studio Login
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
