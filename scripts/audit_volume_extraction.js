process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

function extractVolumeNumber(title, fileKey) {
  const str = `${fileKey} ${title}`;
  // 1. Matches like "vol 12", "vol. 12", "vol12", "v12", "volume 12", "volume12"
  const volMatch = str.match(/(?:vol(?:ume)?\.?|v)\s*(\d+)/i);
  if (volMatch) return parseInt(volMatch[1], 10);

  // 2. Matches years for Complete Peanuts: "1950-1952" -> convert to year or chronological index
  const yearMatch = str.match(/(?:19|20)\d{2}/);
  if (yearMatch) return parseInt(yearMatch[0], 10);

  // 3. Matches trailing number before extension: e.g. "something_05.cbz" or "something05.pdf"
  const endNumMatch = fileKey.match(/[_-](\d+)\.[a-z0-9]+$/i) || fileKey.match(/(\d+)\.[a-z0-9]+$/i);
  if (endNumMatch) return parseInt(endNumMatch[1], 10);

  return null;
}

async function auditVolumeExtraction() {
  const { data: books, error } = await supabase
    .from('trophy_books')
    .select('id, title, series, issue_number, volume_number, file_key')
    .order('series', { ascending: true });

  if (error) {
    console.error(error);
    return;
  }

  let totalBooks = books.length;
  let stuckAtOne = 0;
  let canBeExtracted = 0;
  const seriesToFix = new Map();

  books.forEach((b) => {
    if (b.series && b.series !== 'Standalone') {
      const extracted = extractVolumeNumber(b.title, b.file_key);
      const currentIssue = Number(b.issue_number) || 0;
      if (currentIssue <= 1 && extracted && extracted > 1) {
        stuckAtOne++;
        if (!seriesToFix.has(b.series)) seriesToFix.set(b.series, []);
        seriesToFix.get(b.series).push({
          id: b.id,
          title: b.title,
          file_key: b.file_key,
          current: currentIssue,
          extracted,
        });
      }
    }
  });

  console.log(`Total books: ${totalBooks}`);
  console.log(`Books in series stuck with issue_number <= 1 where volume is in file_key/title: ${stuckAtOne}`);
  console.log(`Number of series affected: ${seriesToFix.size}`);

  console.log('\nTop affected series:');
  Array.from(seriesToFix.entries())
    .sort((a, b) => b[1].length - a[1].length)
    .slice(0, 15)
    .forEach(([sName, items]) => {
      console.log(`- ${sName}: ${items.length} volumes need updating`);
      console.log(`    Sample: ${items[0].file_key} -> extracted Vol: ${items[0].extracted} (currently: ${items[0].current})`);
    });
}

auditVolumeExtraction();
