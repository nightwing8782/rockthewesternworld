process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Fatal: SUPABASE_SERVICE_ROLE_KEY is required.');
  process.exit(1);
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function executePhase2() {
  const logFile = path.resolve('backups/phase2_execution.log');
  const logStream = fs.createWriteStream(logFile, { flags: 'a' });
  function log(msg) {
    console.log(msg);
    logStream.write(`[${new Date().toISOString()}] ${msg}\n`);
  }

  log('====================================================');
  log('🚀 EXECUTING PHASE 2: SERIES HIERARCHY RECONSTRUCTION');
  log('====================================================\n');

  // Step 1: Load Current Database Catalog & Progress
  log('1. Loading current database records...');
  let books = [];
  let from = 0;
  const pageSize = 1000;
  while (true) {
    const { data, error } = await supabase
      .from('trophy_books')
      .select('*')
      .order('id', { ascending: true })
      .range(from, from + pageSize - 1);
    if (error) throw error;
    if (!data || data.length === 0) break;
    books = books.concat(data);
    if (data.length < pageSize) break;
    from += pageSize;
  }
  log(`✓ Loaded ${books.length} books from trophy_books.`);

  let progress = [];
  from = 0;
  while (true) {
    const { data, error } = await supabase
      .from('trophy_progress')
      .select('*')
      .range(from, from + pageSize - 1);
    if (error) throw error;
    if (!data || data.length === 0) break;
    progress = progress.concat(data);
    if (data.length < pageSize) break;
    from += pageSize;
  }
  log(`✓ Loaded ${progress.length} progress records.\n`);

  // Step 2: Iterate and Apply Reconstructions
  log('2. Processing series hierarchy reconstructions and anomaly fixes...');
  let updatedCount = 0;

  for (const b of books) {
    const fileKey = b.file_key || '';
    const baseName = path.basename(fileKey).replace(/\.(cbz|cbr|epub|pdf|zip)$/i, '').toLowerCase();
    const currentSeries = b.series || 'Standalone';

    let newSeries = currentSeries;
    let newFranchise = b.franchise || null;
    let newMedium = b.medium || 'comic';
    let newDirection = b.reading_direction || 'ltr';
    let newAuthor = b.author || null;
    let newPublisher = b.publisher || null;
    let newAspectRatio = b.aspect_ratio || 'portrait';
    let newTitle = b.title || '';
    let newVol = b.volume_number || b.issue_number || null;

    // === A. FIX CRITICAL COOKBOOK MISCLASSIFICATIONS ===
    if (baseName.includes('blackscience')) {
      newSeries = 'Black Science';
      newMedium = 'comic';
      newAuthor = 'Rick Remender';
      newPublisher = 'Image Comics';
      const m = baseName.match(/vol(\d+)/i);
      if (m) newVol = parseInt(m[1], 10);
      newTitle = `Black Science: Vol. ${newVol || 1}`;
    } else if (baseName.includes('bloodshotreborn')) {
      newSeries = 'Bloodshot Reborn';
      newMedium = 'comic';
      newAuthor = 'Jeff Lemire';
      newPublisher = 'Valiant Entertainment';
      newTitle = 'Bloodshot Reborn: Vol. 1';
      newVol = 1;
    } else if (baseName.includes('cpluspluscrashcourse')) {
      newSeries = 'Standalone';
      newMedium = 'reference';
      newAuthor = 'Josh Lospinoso';
      newPublisher = 'No Starch Press';
      newTitle = 'C++ Crash Course';
    } else if (baseName.includes('sweetintruder')) {
      newSeries = 'Standalone';
      newMedium = 'comic';
      newTitle = 'Sweet Intruder';
    }

    // === B. TERRY MOORE UNIVERSE ===
    else if (baseName.includes('strangersinparadise')) {
      newSeries = 'Strangers in Paradise';
      newFranchise = 'Terry Moore Universe';
      newAuthor = 'Terry Moore';
      newPublisher = 'Abstract Studios';
      newMedium = 'comic';
    } else if (baseName.startsWith('echo') || baseName.includes('echov')) {
      newSeries = 'Echo';
      newFranchise = 'Terry Moore Universe';
      newAuthor = 'Terry Moore';
      newPublisher = 'Abstract Studios';
      newMedium = 'comic';
      const m = baseName.match(/v(\d+)/i);
      if (m) newVol = parseInt(m[1], 10);
    } else if (baseName.includes('rachelrising')) {
      newSeries = 'Rachel Rising';
      newFranchise = 'Terry Moore Universe';
      newAuthor = 'Terry Moore';
      newPublisher = 'Abstract Studios';
      newMedium = 'comic';
    } else if (baseName.includes('motorgirl')) {
      newSeries = 'Motor Girl';
      newFranchise = 'Terry Moore Universe';
      newAuthor = 'Terry Moore';
      newPublisher = 'Abstract Studios';
      newMedium = 'comic';
    } else if (baseName.includes('serial')) {
      newSeries = 'Serial';
      newFranchise = 'Terry Moore Universe';
      newAuthor = 'Terry Moore';
      newPublisher = 'Abstract Studios';
      newMedium = 'comic';
    } else if (baseName.includes('fiveyears')) {
      newSeries = 'Five Years';
      newFranchise = 'Terry Moore Universe';
      newAuthor = 'Terry Moore';
      newPublisher = 'Abstract Studios';
      newMedium = 'comic';
    }

    // === C. MIGNOLAVERSE ===
    else if (baseName.includes('bprdhellonearth')) {
      newSeries = 'B.P.R.D.: Hell on Earth';
      newFranchise = 'Mignolaverse';
      newPublisher = 'Dark Horse Comics';
      newAuthor = 'Mike Mignola & John Arcudi';
      newMedium = 'comic';
    } else if (baseName.includes('bprd')) {
      newSeries = 'B.P.R.D.';
      newFranchise = 'Mignolaverse';
      newPublisher = 'Dark Horse Comics';
      newAuthor = 'Mike Mignola & Guy Davis';
      newMedium = 'comic';
    } else if (baseName.includes('hellboywinterspecial')) {
      newSeries = 'Hellboy: Specials & Anthologies';
      newFranchise = 'Mignolaverse';
      newPublisher = 'Dark Horse Comics';
      newMedium = 'comic';
    } else if (baseName.includes('hellboyweirdtales')) {
      newSeries = 'Hellboy: Weird Tales';
      newFranchise = 'Mignolaverse';
      newPublisher = 'Dark Horse Comics';
      newMedium = 'comic';
    } else if (baseName.includes('hellboy')) {
      newSeries = 'Hellboy';
      newFranchise = 'Mignolaverse';
      newPublisher = 'Dark Horse Comics';
      newAuthor = 'Mike Mignola';
      newMedium = 'comic';
    }

    // === D. TRANSFORMERS (IDW) ===
    else if (baseName.includes('morethanmeetstheeye')) {
      newSeries = 'Transformers: More Than Meets The Eye';
      newFranchise = 'Transformers (IDW)';
      newPublisher = 'IDW Publishing';
      newAuthor = 'James Roberts';
      newMedium = 'comic';
    } else if (baseName.includes('robotsindisguise')) {
      newSeries = 'Transformers: Robots in Disguise';
      newFranchise = 'Transformers (IDW)';
      newPublisher = 'IDW Publishing';
      newAuthor = 'John Barber';
      newMedium = 'comic';
    } else if (baseName.includes('lostlight')) {
      newSeries = 'Transformers: Lost Light';
      newFranchise = 'Transformers (IDW)';
      newPublisher = 'IDW Publishing';
      newAuthor = 'James Roberts';
      newMedium = 'comic';
    } else if (baseName.includes('tillallareone')) {
      newSeries = 'Transformers: Till All Are One';
      newFranchise = 'Transformers (IDW)';
      newPublisher = 'IDW Publishing';
      newAuthor = 'Mairghread Scott';
      newMedium = 'comic';
    } else if (baseName.includes('wreckers') || baseName.includes('sinsofthewreckers') || baseName.includes('laststandof')) {
      newSeries = 'Transformers: The Wreckers Saga';
      newFranchise = 'Transformers (IDW)';
      newPublisher = 'IDW Publishing';
      newAuthor = 'Nick Roche';
      newMedium = 'comic';
    } else if (baseName.includes('unicron')) {
      newSeries = 'Transformers: Unicron';
      newFranchise = 'Transformers (IDW)';
      newPublisher = 'IDW Publishing';
      newAuthor = 'John Barber';
      newMedium = 'comic';
    } else if (baseName.includes('windblade')) {
      newSeries = 'Transformers: Windblade';
      newFranchise = 'Transformers (IDW)';
      newPublisher = 'IDW Publishing';
      newMedium = 'comic';
    } else if (baseName.includes('autocracy') || baseName.includes('monstrosity') || baseName.includes('primacy')) {
      newSeries = 'Transformers: The Cybertron Trilogy';
      newFranchise = 'Transformers (IDW)';
      newPublisher = 'IDW Publishing';
      newMedium = 'comic';
    } else if (baseName.includes('transformers_vol')) {
      newSeries = 'Transformers: Phase 1 Ongoing';
      newFranchise = 'Transformers (IDW)';
      newPublisher = 'IDW Publishing';
      newMedium = 'comic';
    } else if (fileKey.includes('Transformers/')) {
      newSeries = 'Transformers: Miniseries & Events';
      newFranchise = 'Transformers (IDW)';
      newPublisher = 'IDW Publishing';
      newMedium = 'comic';
    }

    // === E. ASTRO CITY CONSOLIDATION ===
    else if (baseName.includes('astrocity') || currentSeries.toLowerCase().includes('astrocity')) {
      newSeries = 'Astro City';
      newAuthor = 'Kurt Busiek';
      newPublisher = 'DC Comics / Image';
      newMedium = 'comic';
      const m = (b.title + ' ' + fileKey).match(/vol\.?\s*(\d+)/i);
      if (m) newVol = parseInt(m[1], 10);
    }

    // === F. USAGI YOJIMBO CONSOLIDATION ===
    else if (fileKey.includes('Usagi/') || baseName.includes('usagiyojimbo') || baseName.includes('spaceusagi')) {
      newSeries = 'Usagi Yojimbo';
      newAuthor = 'Stan Sakai';
      newPublisher = 'Dark Horse Comics';
      newMedium = 'comic';
    }

    // === G. EC COMICS ===
    else if (fileKey.includes('EC Comics/') || baseName.includes('andotherstories')) {
      newSeries = 'EC Comics Library';
      newPublisher = 'Fantagraphics Books';
      newMedium = 'comic';
    }

    // === H. THE COMPLETE PEANUTS ===
    else if (baseName.includes('completepeanuts') || baseName.includes('peanuts')) {
      newSeries = 'The Complete Peanuts';
      newAuthor = 'Charles M. Schulz';
      newPublisher = 'Fantagraphics Books';
      newAspectRatio = 'landscape';
      newMedium = 'comic';
    }

    // === I. LOVE AND ROCKETS ===
    else if (fileKey.includes('Love and Rockets/') || baseName.includes('loveandrockets') || baseName.includes('maggiethemechanic') || baseName.includes('humandiastrophism')) {
      newSeries = 'Love and Rockets';
      newAuthor = 'Gilbert & Jaime Hernandez';
      newPublisher = 'Fantagraphics Books';
      newMedium = 'comic';
    }

    // === J. CEREBUS ===
    else if (fileKey.includes('Cerebus/') || baseName.includes('aardvarkvanaheim')) {
      newSeries = 'Cerebus';
      newAuthor = 'Dave Sim';
      newPublisher = 'Aardvark-Vanaheim';
      newMedium = 'comic';
    }

    // === K. HIDDEN MULTI-VOLUME RUNS FROM STANDALONE ===
    else if (baseName.includes('straybullets_sunshineandroses')) {
      newSeries = 'Stray Bullets: Sunshine and Roses';
      newAuthor = 'David Lapham';
      newPublisher = 'Image Comics';
      newMedium = 'comic';
    } else if (baseName.includes('straybullets')) {
      newSeries = 'Stray Bullets';
      newAuthor = 'David Lapham';
      newPublisher = 'Image Comics';
      newMedium = 'comic';
    } else if (baseName.includes('zenith')) {
      newSeries = 'Zenith';
      newAuthor = 'Grant Morrison';
      newPublisher = '2000 AD';
      newMedium = 'comic';
    } else if (baseName.includes('revival')) {
      newSeries = 'Revival';
      newAuthor = 'Tim Seeley';
      newPublisher = 'Image Comics';
      newMedium = 'comic';
    } else if (baseName.includes('unnatural')) {
      newSeries = 'Unnatural';
      newAuthor = 'Mirka Andolfo';
      newPublisher = 'Image Comics';
      newMedium = 'comic';
    } else if (baseName.includes('zombo')) {
      newSeries = 'Zombo';
      newAuthor = 'Al Ewing';
      newPublisher = '2000 AD';
      newMedium = 'comic';
    } else if (baseName.includes('sexcriminals')) {
      newSeries = 'Sex Criminals';
      newAuthor = 'Matt Fraction & Chip Zdarsky';
      newPublisher = 'Image Comics';
      newMedium = 'comic';
    } else if (baseName.includes('royalcity')) {
      newSeries = 'Royal City';
      newAuthor = 'Jeff Lemire';
      newPublisher = 'Image Comics';
      newMedium = 'comic';
    } else if (baseName.includes('redlands')) {
      newSeries = 'Redlands';
      newAuthor = 'Jordie Bellaire';
      newPublisher = 'Image Comics';
      newMedium = 'comic';
    } else if (baseName.includes('theyrenotlikeus')) {
      newSeries = "They're Not Like Us";
      newAuthor = 'Eric Stephenson';
      newPublisher = 'Image Comics';
      newMedium = 'comic';
    } else if (baseName.includes('snotgirl')) {
      newSeries = 'Snotgirl';
      newAuthor = 'Bryan Lee O\'Malley';
      newPublisher = 'Image Comics';
      newMedium = 'comic';
    }

    // === L. MANGA SQUISH REPAIRS ===
    else if (currentSeries === 'Dropsofgod' || baseName.includes('dropsofgod')) {
      newSeries = 'The Drops of God';
      newMedium = 'manga';
      newDirection = 'rtl';
      newAuthor = 'Tadashi Agi';
    } else if (currentSeries === 'Spacebrothers' || baseName.includes('spacebrothers')) {
      newSeries = 'Space Brothers';
      newMedium = 'manga';
      newDirection = 'rtl';
      newAuthor = 'Chuya Koyama';
    } else if (currentSeries === 'Lonewolfandcub' || baseName.includes('lonewolfandcub')) {
      newSeries = 'Lone Wolf and Cub';
      newMedium = 'manga';
      newDirection = 'rtl';
      newAuthor = 'Kazuo Koike & Goseki Kojima';
    } else if (currentSeries.toLowerCase().includes('absoluteobedience') || baseName.includes('absoluteobedience')) {
      newSeries = "Absolute Obedience: If You Don't Obey Me";
      newMedium = 'manga';
      newDirection = 'rtl';
    } else if (currentSeries.toLowerCase().includes('kounodori') || baseName.includes('kounodori')) {
      newSeries = 'Kounodori: Dr. Stork';
      newMedium = 'manga';
      newDirection = 'rtl';
      newAuthor = 'You Suzunoki';
    } else if (currentSeries.toLowerCase().includes('pathoftheassassin') || baseName.includes('pathoftheassassin')) {
      newSeries = 'Path of the Assassin';
      newMedium = 'manga';
      newDirection = 'rtl';
      newAuthor = 'Kazuo Koike & Goseki Kojima';
    } else if (currentSeries.toLowerCase().includes('toyoureternity') || baseName.includes('toyoureternity')) {
      newSeries = 'To Your Eternity';
      newMedium = 'manga';
      newDirection = 'rtl';
      newAuthor = 'Yoshitoki Oima';
    } else if (currentSeries.toLowerCase().includes('vinland') || baseName.includes('vinland')) {
      newSeries = 'Vinland Saga';
      newMedium = 'manga';
      newDirection = 'rtl';
      newAuthor = 'Makoto Yukimura';
    } else if (currentSeries.toLowerCase().includes('witchhat') || baseName.includes('witchhat')) {
      newSeries = 'Witch Hat Atelier';
      newMedium = 'manga';
      newDirection = 'rtl';
      newAuthor = 'Kamome Shirahama';
    }

    // === M. MANGA CLASSICS IN COMICS FOLDER ===
    else if (baseName.includes('ladysnowblood')) {
      newSeries = 'Lady Snowblood';
      newMedium = 'manga';
      newDirection = 'rtl';
      newAuthor = 'Kazuo Koike & Kazuo Kamimura';
    } else if (baseName.includes('cryingfreeman')) {
      newSeries = 'Crying Freeman';
      newMedium = 'manga';
      newDirection = 'rtl';
      newAuthor = 'Kazuo Koike & Ryoichi Ikegami';
    }

    // === N. ADAMS 101 REFERENCE ===
    else if (fileKey.includes('101s/') || baseName.endsWith('101')) {
      newSeries = 'Adams 101 Reference Series';
      newMedium = 'reference';
      newPublisher = 'Adams Media';
    }

    // === O. WILLIAMS-SONOMA COOKBOOKS ===
    else if (baseName.includes('williams-sonoma') || baseName.includes('williams_sonoma') || baseName.includes('williamssonoma')) {
      newSeries = 'Williams-Sonoma Culinary Collection';
      newMedium = 'cookbook';
      newPublisher = 'Weldon Owen';
    }

    // === P. 5-MINUTE THERAPY (WELLNESS) ===
    else if (baseName.includes('unfuckyour') || baseName.includes('thisisyourbrainon') || baseName.includes('copingskills') || baseName.includes('hardcoreanxiety')) {
      newSeries = '5-Minute Therapy Series';
      newMedium = 'wellness';
      newAuthor = 'Dr. Faith G. Harper';
      newPublisher = 'Microcosm Publishing';
    }

    // === Q. FOR DUMMIES REFERENCE ===
    else if (baseName.includes('fordummies')) {
      newSeries = 'For Dummies Reference';
      newMedium = 'reference';
      newPublisher = 'Wiley';
    }

    // === R. PERIODICALS ===
    else if (baseName.includes('panelxpanel')) {
      newSeries = 'PanelxPanel Magazine';
      newMedium = 'periodical';
      newAuthor = 'Hassan Otsmane-Elhaou';
    }

    // Check if any payload field changed
    const changed =
      newSeries !== currentSeries ||
      newFranchise !== (b.franchise || null) ||
      newMedium !== b.medium ||
      newDirection !== b.reading_direction ||
      (newAuthor && newAuthor !== b.author) ||
      (newPublisher && newPublisher !== b.publisher) ||
      newAspectRatio !== (b.aspect_ratio || 'portrait') ||
      newTitle !== b.title ||
      (newVol && newVol !== b.volume_number);

    if (changed) {
      const payload = {
        series: newSeries,
        medium: newMedium,
        reading_direction: newDirection,
        updated_at: new Date().toISOString()
      };
      if (newFranchise) payload.franchise = newFranchise;
      if (newAuthor) payload.author = newAuthor;
      if (newPublisher) payload.publisher = newPublisher;
      if (newAspectRatio) payload.aspect_ratio = newAspectRatio;
      if (newTitle !== b.title) payload.title = newTitle;
      if (newVol && newVol !== b.volume_number) {
        payload.volume_number = newVol;
        payload.issue_number = newVol;
      }

      const { error: upErr } = await supabase
        .from('trophy_books')
        .update(payload)
        .eq('id', b.id);

      if (upErr) {
        log(`  ❌ Error updating ${b.id}: ${upErr.message}`);
      } else {
        updatedCount++;
        log(`  [${updatedCount}] Updated: "${b.title}" -> Series: "${newSeries}" | Medium: ${newMedium} | Direction: ${newDirection}`);
      }
    }
  }

  log(`\n✓ Reconstructed and normalized ${updatedCount} books.\n`);

  // Step 3: Verification Query Assertions
  log('3. Running post-mutation verification assertions...');
  const { count: finalBookCount } = await supabase
    .from('trophy_books')
    .select('*', { count: 'exact', head: true });

  const { count: finalProgCount } = await supabase
    .from('trophy_progress')
    .select('*', { count: 'exact', head: true });

  const { count: genericComicsCount } = await supabase
    .from('trophy_books')
    .select('*', { count: 'exact', head: true })
    .eq('series', 'Comics');

  log(`====================================================`);
  log(`🎉 PHASE 2 EXECUTION COMPLETE`);
  log(`  - Final Book Count:         ${finalBookCount} (Expected: 1389)`);
  log(`  - Final Progress Count:     ${finalProgCount} (Expected: 25)`);
  log(`  - Generic "Comics" Left:    ${genericComicsCount} (Expected: 0)`);
  log(`  - Reconstructed Records:    ${updatedCount}`);
  log(`====================================================\n`);

  logStream.end();
}

executePhase2().catch(err => {
  console.error('Fatal execution error:', err);
  process.exit(1);
});
