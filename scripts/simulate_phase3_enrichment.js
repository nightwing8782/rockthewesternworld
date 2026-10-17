const fs = require('fs');
const path = require('path');
const JSZip = require('jszip');

// Canonical series mappings
const CANONICAL_SERIES_IMPRINTS = {
  'The Complete Peanuts': { author: 'Charles M. Schulz', publisher: 'Fantagraphics Books' },
  'Strangers in Paradise': { author: 'Terry Moore', publisher: 'Abstract Studios' },
  'Echo': { author: 'Terry Moore', publisher: 'Abstract Studios' },
  'Rachel Rising': { author: 'Terry Moore', publisher: 'Abstract Studios' },
  'Motor Girl': { author: 'Terry Moore', publisher: 'Abstract Studios' },
  'Five Years': { author: 'Terry Moore', publisher: 'Abstract Studios' },
  'Hellboy': { author: 'Mike Mignola', publisher: 'Dark Horse Comics' },
  'B.P.R.D.': { author: 'Mike Mignola & John Arcudi', publisher: 'Dark Horse Comics' },
  'Usagi Yojimbo': { author: 'Stan Sakai', publisher: 'Dark Horse Comics' },
  'Lone Wolf and Cub': { author: 'Kazuo Koike & Goseki Kojima', publisher: 'Dark Horse Comics' },
  'Path of the Assassin': { author: 'Kazuo Koike & Goseki Kojima', publisher: 'Dark Horse Comics' },
  'Love and Rockets': { author: 'Gilbert Hernandez & Jaime Hernandez', publisher: 'Fantagraphics Books' },
  'EC Comics Library': { publisher: 'Fantagraphics Books' },
  'Cerebus': { author: 'Dave Sim & Gerhard', publisher: 'Aardvark-Vanaheim' },
  'Adams 101 Reference Series': { publisher: 'Adams Media' },
  'Williams-Sonoma Culinary Collection': { publisher: 'Weldon Owen' },
  'For Dummies Reference': { publisher: 'Wiley' },
  '5-Minute Therapy Series': { author: 'Dr. Faith G. Harper', publisher: 'Microcosm Publishing' },
  'The Drops of God': { author: 'Tadashi Agi & Shu Okimoto', publisher: 'Kodansha' },
  'Space Brothers': { author: 'Chuya Koyama', publisher: 'Kodansha' },
  'Blue Period': { author: 'Tsubasa Yamaguchi', publisher: 'Kodansha' },
  'Vinland Saga': { author: 'Makoto Yukimura', publisher: 'Kodansha' },
  'To Your Eternity': { author: 'Yoshitoki Oima', publisher: 'Kodansha' },
  'Kounodori: Dr. Stork': { author: 'You Suzunoki', publisher: 'Kodansha' },
  'Witch Hat Atelier': { author: 'Kamome Shirahama', publisher: 'Kodansha' },
  'A Condition Called Love': { author: 'Megumi Morino', publisher: 'Kodansha' },
  'What Did You Eat Yesterday?': { author: 'Fumi Yoshinaga', publisher: 'Kodansha' },
  'Shangri-La Frontier': { author: 'Katarina & Ryosuke Fuji', publisher: 'Kodansha' },
  'Bloom County': { author: 'Berkeley Breathed', publisher: 'IDW Publishing' },
  'Transformers': { publisher: 'IDW Publishing' },
  'Astro City': { author: 'Kurt Busiek & Brent Anderson', publisher: 'Image Comics' },
  'Radiant Black': { author: 'Kyle Higgins & Marcelo Costa', publisher: 'Image Comics' },
  'Autumnlands': { author: 'Kurt Busiek & Benjamin Dewey', publisher: 'Image Comics' },
  'Black Science': { author: 'Rick Remender & Matteo Scalera', publisher: 'Image Comics' },
  'Judge Dredd': { author: 'John Wagner', publisher: 'Rebellion' },
  'Criminal': { author: 'Ed Brubaker & Sean Phillips', publisher: 'Image Comics' },
  "Absolute Obedience: If You Don't Obey Me": { author: 'Saki Sakimoto', publisher: 'Media Soft' },
};

async function simulate() {
  const backupFiles = fs.readdirSync('backups').filter(f => f.startsWith('trophy_books_backup_')).sort();
  const latestBackup = backupFiles[backupFiles.length - 1];
  console.log(`Loading backup: backups/${latestBackup}`);
  const books = JSON.parse(fs.readFileSync(path.join('backups', latestBackup), 'utf8'));

  let coversToUpdate = 0;
  let authorsEnriched = 0;
  let publishersEnriched = 0;
  let rtlEnforced = 0;
  let dotSeriesFixed = 0;

  // Scan local files
  const localDir = 'C:\\Users\\danbi\\OneDrive\\Documents\\Ebooks';
  const localMap = new Map();
  function scan(dir) {
    for (const f of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, f.name);
      if (f.isDirectory()) scan(full);
      else {
        const sanitized = f.name.replace(/[^a-zA-Z0-9._-]/g, '_');
        localMap.set(sanitized.toLowerCase(), full);
        localMap.set(f.name.toLowerCase(), full);
      }
    }
  }
  scan(localDir);

  for (const b of books) {
    // 1. Cover
    if (!b.cover_url && !b.cover_key) {
      coversToUpdate++;
    }

    // 2. Series Dot Fix
    if (b.series === '.' || b.series === '..') {
      dotSeriesFixed++;
    }

    // 3. Manga RTL
    if (b.medium === 'manga' && b.reading_direction !== 'rtl') {
      rtlEnforced++;
    }

    // 4. Imprints
    const imprint = CANONICAL_SERIES_IMPRINTS[b.series];
    let newAuthor = b.author;
    let newPublisher = b.publisher;

    if (imprint) {
      if (!newAuthor && imprint.author) {
        newAuthor = imprint.author;
        authorsEnriched++;
      }
      if (!newPublisher && imprint.publisher) {
        newPublisher = imprint.publisher;
        publishersEnriched++;
      }
    }

    // 5. EPUB Embedded fallback
    if ((!newAuthor || !newPublisher) && b.format === 'epub') {
      const base = path.basename(b.file_key).toLowerCase();
      const localPath = localMap.get(base);
      if (localPath) {
        try {
          const data = fs.readFileSync(localPath);
          const zip = await JSZip.loadAsync(data);
          const opfKey = Object.keys(zip.files).find(k => k.endsWith('.opf'));
          if (opfKey) {
            const opf = await zip.files[opfKey].async('text');
            if (!newAuthor) {
              const cMatch = opf.match(/<dc:creator[^>]*>([^<]+)<\/dc:creator>/i);
              if (cMatch && cMatch[1].trim()) {
                authorsEnriched++;
                newAuthor = cMatch[1].trim();
              }
            }
            if (!newPublisher) {
              const pMatch = opf.match(/<dc:publisher[^>]*>([^<]+)<\/dc:publisher>/i);
              if (pMatch && pMatch[1].trim()) {
                publishersEnriched++;
                newPublisher = pMatch[1].trim();
              }
            }
          }
        } catch (e) {}
      }
    }
  }

  console.log('--- SIMULATION RESULTS ---');
  console.log(`Total Books: ${books.length}`);
  console.log(`Covers to Recover: ${coversToUpdate} (100% of missing)`);
  console.log(`Authors Enriched: ${authorsEnriched}`);
  console.log(`Publishers Enriched: ${publishersEnriched}`);
  console.log(`Manga RTL Enforced: ${rtlEnforced}`);
  console.log(`Series '.' Fixed to Standalone: ${dotSeriesFixed}`);

  const postAuthorCount = books.length - (books.filter(b => !b.author).length - authorsEnriched);
  const postPubCount = books.length - (books.filter(b => !b.publisher).length - publishersEnriched);
  console.log(`Projected Author Coverage: ${postAuthorCount} / ${books.length} (${(postAuthorCount / books.length * 100).toFixed(1)}%)`);
  console.log(`Projected Publisher Coverage: ${postPubCount} / ${books.length} (${(postPubCount / books.length * 100).toFixed(1)}%)`);
}

simulate().catch(console.error);
