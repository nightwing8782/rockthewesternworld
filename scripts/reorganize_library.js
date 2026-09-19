require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

function toTitleCase(str) {
  if (!str) return '';
  return str
    .toLowerCase()
    .split(' ')
    .map((word) => {
      if (['a', 'an', 'the', 'and', 'but', 'or', 'for', 'nor', 'on', 'at', 'to', 'by', 'of', 'in'].includes(word)) {
        return word;
      }
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(' ')
    .replace(/^([a-z])/, (m) => m.toUpperCase());
}

function cleanMetadata(book) {
  let title = book.title || '';
  let series = (book.series || '').trim();
  let issueNumber = book.issue_number || 1;

  // Clean raw extensions or bracket junk
  title = title.replace(/\.(cbz|cbr|zip|epub|pdf)$/i, '');
  title = title.replace(/\[.*?\]/g, '').replace(/\((?!19\d\d|20\d\d).*?\)/g, '').trim();

  // 1. Fix Series
  if (!series || series === '.' || series === 'Ebooks' || series === 'Comics' || series === 'Standalone') {
    // Try to detect series from title (e.g. "Pretty Deadly Vol 1" -> Series: "Pretty Deadly")
    const volMatch = title.match(/^(.+?)\s*(?:[-_:]|\bv(?:ol)?\.?\s*(\d+)|\b#\s*(\d+))/i);
    if (volMatch && volMatch[1] && volMatch[1].trim().length > 2) {
      series = volMatch[1].trim();
    } else {
      series = 'Standalone';
    }
  }

  // 2. Parse Issue / Volume Number
  const numMatch =
    title.match(/\bvol(?:ume)?\.?\s*(\d+(?:\.\d+)?)/i) ||
    title.match(/\bv(\d+(?:\.\d+)?)\b/i) ||
    title.match(/#\s*(\d+(?:\.\d+)?)/) ||
    title.match(/\b(?:issue|bk|book)\.?\s*(\d+)/i) ||
    title.match(/(?:^|\s)(\d{1,3})(?:\s*[-_:]|\s*$)/);

  if (numMatch && numMatch[1]) {
    const parsedNum = parseFloat(numMatch[1]);
    if (!isNaN(parsedNum) && parsedNum < 1900) {
      issueNumber = parsedNum;
    }
  }

  // Format Series Name nicely
  if (series !== 'Standalone') {
    series = series.replace(/[-_]+/g, ' ').replace(/\s+/g, ' ').trim();
    series = toTitleCase(series);
  }

  // Format Title Name nicely
  title = title.replace(/[-_]+/g, ' ').replace(/\s+/g, ' ').trim();
  title = toTitleCase(title);

  return {
    id: book.id,
    title,
    series,
    issue_number: issueNumber,
  };
}

async function main() {
  console.log('Fetching books from Supabase...');

  // Fetch all books
  let books = [];
  let from = 0;
  const pageSize = 1000;

  while (true) {
    const { data, error } = await supabase
      .from('trophy_books')
      .select('id, title, series, issue_number, file_key')
      .range(from, from + pageSize - 1);

    if (error) {
      console.error('Error querying books:', error);
      break;
    }
    if (!data || data.length === 0) break;
    books = books.concat(data);
    if (data.length < pageSize) break;
    from += pageSize;
  }

  console.log(`Found ${books.length} books. Analyzing and reorganizing...`);

  let updatedCount = 0;
  for (const b of books) {
    const cleaned = cleanMetadata(b);
    if (
      cleaned.title !== b.title ||
      cleaned.series !== b.series ||
      cleaned.issue_number !== b.issue_number
    ) {
      const { error: updateErr } = await supabase
        .from('trophy_books')
        .update({
          title: cleaned.title,
          series: cleaned.series,
          issue_number: cleaned.issue_number,
        })
        .eq('id', b.id);

      if (!updateErr) {
        updatedCount++;
      }
    }
  }

  console.log(`✓ Successfully updated & organized ${updatedCount} books!`);
}

main().catch(console.error);
