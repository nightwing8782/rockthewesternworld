const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const envFile = fs.readFileSync('.env.local', 'utf8');
const env = {};
envFile.split('\n').forEach(line => {
  const parts = line.trim().split('=');
  const k = parts[0];
  const v = parts.slice(1).join('=');
  if (k && v) env[k.trim()] = v.trim().replace(/^['"]|['"]$/g, '');
});

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  const { data: books, error } = await supabase.from('trophy_books').select('*');
  const { data: progress } = await supabase.from('trophy_progress').select('*');
  if (error) {
    console.error('Error fetching books:', error);
    return;
  }
  console.log('Total books:', books.length);
  console.log('Total progress:', progress ? progress.length : 0);

  const progMap = new Map();
  if (progress) {
    progress.forEach(p => progMap.set(p.book_id, p));
  }

  // 1. Series details
  console.log('\n--- KEY SERIES STATS ---');
  const seriesNames = [
    'Blue Period',
    'Hellboy',
    'B.P.R.D.',
    'Love and Rockets',
    'Space Brothers',
    'Vinland Saga',
    'Witch Hat Atelier',
    'The Drops of God',
    'Usagi Yojimbo',
    'The Complete Peanuts',
  ];

  seriesNames.forEach(sName => {
    const sBooks = books.filter(b => b.series === sName);
    sBooks.sort((a, b) => (Number(a.issue_number) || 1) - (Number(b.issue_number) || 1));
    const lead = sBooks[0] || {};
    const withProg = sBooks.filter(b => progMap.has(b.id));
    console.log(JSON.stringify({
      series: sName,
      count: sBooks.length,
      author: lead.author,
      publisher: lead.publisher,
      medium: lead.medium,
      direction: lead.reading_direction,
      activeProgressCount: withProg.length,
      sampleIssues: sBooks.slice(0, 3).map(b => ({ title: b.title, issue: b.issue_number }))
    }, null, 2));
  });

  // 2. Creators
  console.log('\n--- KEY CREATOR STATS ---');
  const creatorNames = [
    'Mike Mignola',
    'Terry Moore',
    'Stan Sakai',
    'Kazuo Koike & Goseki Kojima',
    'Charles M. Schulz',
    'Kamome Shirahama',
    'Tsubasa Yamaguchi',
  ];

  creatorNames.forEach(cName => {
    const cBooks = books.filter(b => b.author && b.author.includes(cName.split(' ')[0]));
    const sSet = new Set(cBooks.map(b => b.series).filter(Boolean));
    const pSet = new Set(cBooks.map(b => b.publisher).filter(Boolean));
    console.log(JSON.stringify({
      creator: cName,
      bookCount: cBooks.length,
      seriesCount: sSet.size,
      seriesList: Array.from(sSet),
      publishers: Array.from(pSet),
    }, null, 2));
  });

  // 3. Publishers
  console.log('\n--- KEY PUBLISHER STATS ---');
  const pubNames = [
    'Kodansha',
    'Dark Horse Comics',
    'Fantagraphics Books',
    'Image Comics',
    'Wiley',
    'Rebellion',
    'Adams Media',
  ];

  pubNames.forEach(pName => {
    const pBooks = books.filter(b => b.publisher && b.publisher.toLowerCase().includes(pName.toLowerCase().split(' ')[0]));
    const sSet = new Set(pBooks.map(b => b.series).filter(Boolean));
    console.log(JSON.stringify({
      publisher: pName,
      bookCount: pBooks.length,
      seriesCount: sSet.size,
      topSeries: Array.from(sSet).slice(0, 5),
    }, null, 2));
  });

  // 4. Reading Continuity Analysis
  console.log('\n--- READING CONTINUITY VERIFICATION ---');
  const activeSeries = new Set();
  progress.forEach(p => {
    const b = books.find(book => book.id === p.book_id);
    if (b && b.series && b.series !== 'Standalone') {
      activeSeries.add(b.series);
    }
  });

  Array.from(activeSeries).forEach(sName => {
    const sBooks = books.filter(b => b.series === sName);
    sBooks.sort((a, b) => (Number(a.issue_number) || 1) - (Number(b.issue_number) || 1));
    
    // Find highest read volume
    let highestReadIssue = 0;
    let currentBook = null;
    let currentProg = null;

    sBooks.forEach(b => {
      const p = progMap.get(b.id);
      if (p && (Number(b.issue_number) || 1) >= highestReadIssue) {
        highestReadIssue = Number(b.issue_number) || 1;
        currentBook = b;
        currentProg = p;
      }
    });

    const nextBook = sBooks.find(b => (Number(b.issue_number) || 1) > highestReadIssue && (!progMap.has(b.id) || !progMap.get(b.id).completed));

    console.log(`Series: "${sName}" | Total Vols: ${sBooks.length}`);
    console.log(`  Current Book: "${currentBook?.title}" (Vol ${highestReadIssue}) - Read: ${currentProg?.percent_read}%`);
    console.log(`  Suggested Next: "${nextBook ? nextBook.title : 'Series Completed!'}" (Vol ${nextBook?.issue_number || 'N/A'})`);
  });
}

run();
