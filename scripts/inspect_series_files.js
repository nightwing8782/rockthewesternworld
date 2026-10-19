process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function inspectSeriesFiles() {
  const targetSeries = [
    'The Drops of God',
    'Space Brothers',
    'The Complete Peanuts',
    'Lone Wolf and Cub',
    'Hellboy',
    'B.P.R.D.',
    'Witch Hat Atelier',
    'Blue Period',
    'Vinland Saga'
  ];

  const { data: books, error } = await supabase
    .from('trophy_books')
    .select('id, title, series, issue_number, volume_number, file_key')
    .in('series', targetSeries);

  if (error) {
    console.error(error);
    return;
  }

  targetSeries.forEach((sName) => {
    const sBooks = books.filter((b) => b.series === sName);
    console.log(`\n========================================`);
    console.log(`SERIES: ${sName} (${sBooks.length} books)`);
    console.log(`========================================`);
    sBooks.forEach((b) => {
      console.log(`id: ${b.id.slice(0, 8)} | issue_num: ${b.issue_number} | vol_num: ${b.volume_number} | title: "${b.title}" | file_key: "${b.file_key}"`);
    });
  });
}

inspectSeriesFiles();
