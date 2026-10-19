process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function checkLargeSeries() {
  const { data: books, error } = await supabase
    .from('trophy_books')
    .select('id, title, series, issue_number, volume_number, file_key, published_year')
    .order('issue_number', { ascending: true });

  if (error) {
    console.error(error);
    return;
  }

  const seriesMap = {};
  books.forEach((b) => {
    const s = b.series || 'Standalone';
    if (!seriesMap[s]) seriesMap[s] = [];
    seriesMap[s].push(b);
  });

  const large = Object.entries(seriesMap)
    .filter(([s, list]) => s !== 'Standalone' && list.length >= 8)
    .sort((a, b) => b[1].length - a[1].length);

  console.log(`Found ${large.length} large series (>= 8 volumes):`);
  large.forEach(([name, list]) => {
    // Check if issue numbers are sequential or unique
    const issues = list.map((b) => Number(b.issue_number) || 0);
    const duplicates = issues.filter((item, index) => issues.indexOf(item) !== index);
    console.log(`- ${name}: ${list.length} volumes | Issues min: ${Math.min(...issues)}, max: ${Math.max(...issues)} | Dups: ${duplicates.length}`);
  });

  console.log('\n--- SAMPLE INSPECTION OF TOP 6 SERIES ---');
  large.slice(0, 6).forEach(([name, list]) => {
    console.log(`\n=== Series: ${name} (${list.length} vols) ===`);
    list.sort((a, b) => (Number(a.issue_number) || 0) - (Number(b.issue_number) || 0));
    list.slice(0, 5).forEach((b) => {
      console.log(`  Issue #${b.issue_number} (Vol ${b.volume_number}): "${b.title}" [${b.file_key}]`);
    });
    if (list.length > 5) {
      const last = list[list.length - 1];
      console.log(`  ... [${list.length - 6} intervening volumes] ...`);
      console.log(`  Issue #${last.issue_number} (Vol ${last.volume_number}): "${last.title}" [${last.file_key}]`);
    }
  });
}

checkLargeSeries();
