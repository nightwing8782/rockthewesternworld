/**
 * IndexNow Submission Utility
 * Run with: npx tsx scripts/submit-indexnow.ts [optional-url]
 */
import fs from 'fs';
import path from 'path';

async function submitToIndexNow(customUrl?: string) {
  const host = 'rockthewesternworld.com';
  const key = process.env.INDEXNOW_KEY || 'rockthewesternworld';
  const keyLocation = `https://${host}/${key}.txt`;

  let urlList: string[] = [];

  if (customUrl) {
    urlList = [customUrl.startsWith('http') ? customUrl : `https://${host}/${customUrl.replace(/^\//, '')}`];
  } else {
    // Read sitemap or imported entries
    urlList = [`https://${host}/`, `https://${host}/journal`, `https://${host}/trophy-room`];
    try {
      const archivePath = path.join(process.cwd(), 'public', 'archive', 'imported-entries.json');
      if (fs.existsSync(archivePath)) {
        const entries = JSON.parse(fs.readFileSync(archivePath, 'utf8'));
        entries.slice(0, 50).forEach((e: { slug?: string; status?: string }) => {
          if (e.slug && (e.status === 'published' || !e.status)) {
            urlList.push(`https://${host}/${e.slug}`);
          }
        });
      }
    } catch (err) {
      console.warn('Could not read archive:', err);
    }
  }

  const payload = {
    host,
    key,
    keyLocation,
    urlList,
  };

  console.log(`Submitting ${urlList.length} URLs to IndexNow...`);

  try {
    const res = await fetch('https://api.indexnow.org/indexnow', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error(`IndexNow submission failed: ${res.status} ${res.statusText}`, errorText);
    } else {
      console.log('Successfully submitted URLs to IndexNow!');
    }
  } catch (error) {
    console.error('Error pinging IndexNow:', error);
  }
}

const targetUrl = process.argv[2];
submitToIndexNow(targetUrl);
