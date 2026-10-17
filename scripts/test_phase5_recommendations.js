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

async function testRecommendations() {
  const { data: books } = await supabase.from('trophy_books').select('*');
  const { data: progress } = await supabase.from('trophy_progress').select('*');

  // Let's test "Because you read Blue Period"
  const bluePeriod = books.find(b => b.series === 'Blue Period');
  console.log('Target book:', bluePeriod.title, 'Series:', bluePeriod.series, 'Author:', bluePeriod.author, 'Pub:', bluePeriod.publisher);

  function getRecommendations(sourceBook, allBooks, limit = 5) {
    const scores = [];
    allBooks.forEach(b => {
      if (b.id === sourceBook.id || (sourceBook.series && b.series === sourceBook.series)) {
        return; // Don't recommend the same series
      }
      let score = 0;
      let reasons = [];

      // 1. Same Author / Creator (+50)
      if (sourceBook.author && b.author && (sourceBook.author.toLowerCase() === b.author.toLowerCase() || (b.author.length > 5 && sourceBook.author.includes(b.author)))) {
        score += 50;
        reasons.push(`Creator: ${b.author}`);
      }

      // 2. Same Franchise / Universe (+40)
      if (sourceBook.franchise && b.franchise && sourceBook.franchise.toLowerCase() === b.franchise.toLowerCase()) {
        score += 40;
        reasons.push(`Franchise: ${b.franchise}`);
      }

      // 3. Same Publisher + Same Medium (+30)
      if (sourceBook.publisher && b.publisher && sourceBook.publisher.toLowerCase() === b.publisher.toLowerCase()) {
        if (sourceBook.medium && b.medium && sourceBook.medium === b.medium) {
          score += 30;
          reasons.push(`Same Publisher (${b.publisher}) & Medium (${b.medium})`);
        } else {
          score += 15;
          reasons.push(`Same Publisher (${b.publisher})`);
        }
      }

      // 4. Same Primary Shelf / Medium (+10)
      if (sourceBook.medium && b.medium && sourceBook.medium === b.medium) {
        score += 10;
      }

      // 5. Shared tags / genres (+5 each)
      if (Array.isArray(sourceBook.genres) && Array.isArray(b.genres)) {
        const shared = sourceBook.genres.filter(g => b.genres.includes(g));
        if (shared.length > 0) {
          score += shared.length * 5;
          reasons.push(`Shared Genres: ${shared.join(', ')}`);
        }
      }

      if (score > 0) {
        scores.push({ book: b, score, reasons });
      }
    });

    // Group by series if applicable so we recommend distinct series
    const seriesSeen = new Set();
    const distinct = [];
    scores.sort((a, b) => b.score - a.score);
    for (const item of scores) {
      const s = item.book.series || item.book.title;
      if (!seriesSeen.has(s)) {
        seriesSeen.add(s);
        distinct.push(item);
      }
      if (distinct.length >= limit) break;
    }
    return distinct;
  }

  console.log('\n--- RECOMMENDATIONS: "Because you read Blue Period" ---');
  const bpRecs = getRecommendations(bluePeriod, books, 5);
  bpRecs.forEach(r => {
    console.log(`[Score: ${r.score}] ${r.book.title} (Series: ${r.book.series || 'N/A'}) - By ${r.book.author} [${r.book.publisher}]`);
    console.log(`  Reasons: ${r.reasons.join('; ')}`);
  });

  // Hellboy recommendations
  const hellboy = books.find(b => b.series === 'Hellboy');
  console.log('\n--- RECOMMENDATIONS: "Because you read Hellboy" ---');
  const hbRecs = getRecommendations(hellboy, books, 5);
  hbRecs.forEach(r => {
    console.log(`[Score: ${r.score}] ${r.book.title} (Series: ${r.book.series || 'N/A'}) - By ${r.book.author} [${r.book.publisher}]`);
    console.log(`  Reasons: ${r.reasons.join('; ')}`);
  });
}

testRecommendations();
