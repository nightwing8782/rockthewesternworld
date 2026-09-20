process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function testFetch() {
  const { data, error } = await supabase
    .from('trophy_books')
    .select('*')
    .limit(5);

  console.log('Fetch error:', error);
  console.log('Data returned:', data ? data.length : 0);
  if (data && data.length > 0) {
    console.log('Available keys on record:', Object.keys(data[0]));
  }
}

testFetch();
