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
  const { data: books } = await supabase.from('trophy_books').select('*');
  const { data: progress } = await supabase.from('trophy_progress').select('*');

  console.log(`Loaded ${books.length} books and ${progress.length} progress records.`);

  const progMap = new Map();
  progress.forEach(p => progMap.set(p.book_id, p));

  // 1. Rebalanced Affinity Scoring
  function getRebalancedRecommendations(sourceBook, allBooks, limit = 5) {
    const scores = [];
    const t0 = performance.now();

    allBooks.forEach(b => {
      if (b.id === sourceBook.id || (sourceBook.series && b.series === sourceBook.series)) {
        return; // Exclude current title and same series
      }
      let score = 0;
      let reasons = [];

      // A. Creator: +50
      if (sourceBook.author && b.author && (sourceBook.author.toLowerCase() === b.author.toLowerCase() || (b.author.length > 5 && sourceBook.author.includes(b.author)))) {
        score += 50;
        reasons.push(`Creator: ${b.author}`);
      }

      // B. Franchise / Story Arc: +45
      if (sourceBook.franchise && b.franchise && sourceBook.franchise.toLowerCase() === b.franchise.toLowerCase()) {
        score += 45;
        reasons.push(`Franchise: ${b.franchise}`);
      }

      // C. Primary Shelf / Medium Similarity: +30 (Increased)
      if (sourceBook.medium && b.medium && sourceBook.medium === b.medium) {
        score += 30;
        reasons.push(`Same Shelf/Medium (${b.medium})`);
      }

      // D. Genre Similarity: +15 per matching tag (capped at +45) (Increased)
      if (Array.isArray(sourceBook.genres) && Array.isArray(b.genres)) {
        const shared = sourceBook.genres.filter(g => b.genres.includes(g));
        if (shared.length > 0) {
          const genrePoints = Math.min(45, shared.length * 15);
          score += genrePoints;
          reasons.push(`Shared Genres (+${genrePoints}): ${shared.join(', ')}`);
        }
      }

      // E. Publisher: +15 for Publisher+Medium, +5 for Publisher only (Decreased)
      if (sourceBook.publisher && b.publisher && sourceBook.publisher.toLowerCase() === b.publisher.toLowerCase()) {
        if (sourceBook.medium && b.medium && sourceBook.medium === b.medium) {
          score += 15;
          reasons.push(`Publisher (${b.publisher})`);
        } else {
          score += 5;
          reasons.push(`Publisher Only (${b.publisher})`);
        }
      }

      if (score > 0) {
        scores.push({ book: b, score, reasons });
      }
    });

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
    const t1 = performance.now();
    return { distinct, elapsedMs: t1 - t0 };
  }

  // Benchmark for 1,389 books
  const bp = books.find(b => b.series === 'Blue Period');
  const resBp = getRebalancedRecommendations(bp, books, 5);
  console.log(`\nRebalanced Recommendations for "${bp.title}" (Computed in ${resBp.elapsedMs.toFixed(2)}ms):`);
  resBp.distinct.forEach(r => {
    console.log(`  [Score: ${r.score}] ${r.book.title} (Series: ${r.book.series}) - ${r.reasons.join('; ')}`);
  });

  const hb = books.find(b => b.series === 'Hellboy');
  const resHb = getRebalancedRecommendations(hb, books, 5);
  console.log(`\nRebalanced Recommendations for "${hb.title}" (Computed in ${resHb.elapsedMs.toFixed(2)}ms):`);
  resHb.distinct.forEach(r => {
    console.log(`  [Score: ${r.score}] ${r.book.title} (Series: ${r.book.series}) - ${r.reasons.join('; ')}`);
  });

  // 2. Discovery Insights Modules

  // A. Most Read (active progress sorted by reading time / percent)
  console.log('\n--- INSIGHT 1: MOST READ ---');
  const activeReads = books
    .filter(b => progMap.has(b.id) && progMap.get(b.id).percent_read > 0)
    .map(b => ({
      book: b,
      progress: progMap.get(b.id),
    }))
    .sort((a, b) => (b.progress.reading_time_seconds || 0) - (a.progress.reading_time_seconds || 0) || b.progress.percent_read - a.progress.percent_read);

  activeReads.slice(0, 5).forEach((item, i) => {
    console.log(`  ${i+1}. "${item.book.title}" (${item.book.series}) - ${item.progress.percent_read}% read (${item.progress.reading_time_seconds || 0}s)`);
  });

  // B. Most Completed Series
  console.log('\n--- INSIGHT 2: MOST COMPLETED SERIES ---');
  const seriesMap = new Map();
  books.forEach(b => {
    const s = b.series || 'Standalone';
    if (!seriesMap.has(s)) seriesMap.set(s, []);
    seriesMap.get(s).push(b);
  });

  const completedStats = [];
  seriesMap.forEach((sBooks, sName) => {
    if (sName === 'Standalone') return;
    const completedCount = sBooks.filter(b => progMap.has(b.id) && progMap.get(b.id).completed).length;
    const readCount = sBooks.filter(b => progMap.has(b.id) && progMap.get(b.id).percent_read > 0).length;
    completedStats.push({
      seriesName: sName,
      totalVols: sBooks.length,
      completedCount,
      readCount,
      percentCompleted: Math.round((completedCount / sBooks.length) * 100),
      percentRead: Math.round((readCount / sBooks.length) * 100),
    });
  });
  completedStats.sort((a, b) => b.completedCount - a.completedCount || b.percentCompleted - a.percentCompleted || b.readCount - a.readCount);
  completedStats.slice(0, 5).forEach((s, i) => {
    console.log(`  ${i+1}. ${s.seriesName}: ${s.completedCount}/${s.totalVols} completed (${s.readCount} active)`);
  });

  // C. Hidden Gems (Standalones or rich books with 0% progress)
  console.log('\n--- INSIGHT 3: HIDDEN GEMS (Curated Standalones / Gems) ---');
  const gems = books.filter(b => (!b.series || b.series === 'Standalone') && (!progMap.has(b.id) || progMap.get(b.id).percent_read === 0));
  gems.slice(0, 6).forEach((b, i) => {
    console.log(`  ${i+1}. "${b.title}" by ${b.author} [${b.medium}] - ${b.publisher}`);
  });

  // D. Largest Complete Runs
  console.log('\n--- INSIGHT 4: LARGEST COMPLETE RUNS ---');
  const largestRuns = [];
  seriesMap.forEach((sBooks, sName) => {
    if (sName === 'Standalone') return;
    largestRuns.push({
      seriesName: sName,
      totalVols: sBooks.length,
      medium: sBooks[0].medium,
      publisher: sBooks[0].publisher,
      author: sBooks[0].author,
    });
  });
  largestRuns.sort((a, b) => b.totalVols - a.totalVols);
  largestRuns.slice(0, 8).forEach((r, i) => {
    console.log(`  ${i+1}. ${r.seriesName}: ${r.totalVols} volumes [${r.medium}] - ${r.author} (${r.publisher})`);
  });
}

run();
