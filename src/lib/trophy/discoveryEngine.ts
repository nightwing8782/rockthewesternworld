import { TrophyBook, TrophyProgress, SeriesGroup } from '@/types/trophy';

export interface AffinityRecommendation {
  book: TrophyBook;
  score: number;
  reasons: string[];
}

export interface ReadingContinuityState {
  seriesName: string;
  currentBook: TrophyBook | null;
  nextBook: TrophyBook | null;
  status: 'not-started' | 'in-progress' | 'series-completed';
  totalVolumes: number;
  completedVolumes: number;
  percentOverall: number;
}

export interface ReadingMomentumState {
  activeTitlesCount: number;
  totalPagesRead: number;
  totalTimeSeconds: number;
  recentlyActiveSeries: string[];
  momentumLevel: 'High' | 'Steady' | 'Getting Started';
  velocityDescription: string;
}

export interface SeriesCompletionForecast {
  seriesName: string;
  totalVolumes: number;
  completedVolumes: number;
  remainingVolumes: number;
  totalPages: number;
  remainingPages: number;
  completionPercentage: number;
  estimatedHoursRemaining: number;
  forecastBadge: string;
}

export interface CreatorProfile {
  name: string;
  totalBooks: number;
  seriesRuns: {
    seriesName: string;
    volumes: number;
    leadBook: TrophyBook;
    isCompleted: boolean;
  }[];
  standaloneBooks: TrophyBook[];
  publishers: string[];
  totalCompleted: number;
  primaryMedium: string;
}

export interface PublisherProfile {
  name: string;
  totalBooks: number;
  seriesRuns: {
    seriesName: string;
    volumes: number;
    leadBook: TrophyBook;
  }[];
  formatBreakdown: Record<string, number>;
  primaryMedium: string;
  recentBooks: TrophyBook[];
}

/**
 * 1. Rebalanced Affinity Recommendation Engine (Non-AI)
 *
 * Scoring:
 * - Creator Match: +50
 * - Franchise / Universe: +45
 * - Primary Shelf / Medium: +30
 * - Shared Genre Tags: +15 per matching tag (capped at +45)
 * - Publisher + Medium: +15
 * - Publisher Only: +5
 */
export function calculateAffinityRecommendations(
  sourceBook: TrophyBook,
  allBooks: TrophyBook[],
  limit = 6
): AffinityRecommendation[] {
  const scores: AffinityRecommendation[] = [];

  const sourceAuthor = (sourceBook.author || '').trim().toLowerCase();
  const sourceFranchise = (sourceBook.franchise || '').trim().toLowerCase();
  const sourcePub = (sourceBook.publisher || '').trim().toLowerCase();
  const sourceMed = (sourceBook.medium || '').trim().toLowerCase();
  const sourceGenres = Array.isArray(sourceBook.genres)
    ? sourceBook.genres.map((g) => g.trim().toLowerCase())
    : [];

  allBooks.forEach((b) => {
    // Exclude source book and volumes from the same series
    if (b.id === sourceBook.id) return;
    if (sourceBook.series && b.series && b.series.toLowerCase() === sourceBook.series.toLowerCase()) {
      return;
    }

    let score = 0;
    const reasons: string[] = [];

    // A. Creator Match (+50)
    const bAuthor = (b.author || '').trim().toLowerCase();
    if (sourceAuthor && bAuthor) {
      if (sourceAuthor === bAuthor || (sourceAuthor.length > 5 && bAuthor.includes(sourceAuthor)) || (bAuthor.length > 5 && sourceAuthor.includes(bAuthor))) {
        score += 50;
        reasons.push(`Creator: ${b.author}`);
      }
    }

    // B. Franchise / Shared Universe (+45)
    const bFranchise = (b.franchise || '').trim().toLowerCase();
    if (sourceFranchise && bFranchise && sourceFranchise === bFranchise) {
      score += 45;
      reasons.push(`Franchise: ${b.franchise}`);
    }

    // C. Primary Shelf / Medium Match (+30)
    const bMed = (b.medium || '').trim().toLowerCase();
    if (sourceMed && bMed && sourceMed === bMed) {
      score += 30;
      reasons.push(`Same Shelf: ${b.medium?.toUpperCase()}`);
    }

    // D. Shared Genre Tags (+15 each, capped at +45)
    if (sourceGenres.length > 0 && Array.isArray(b.genres)) {
      const bGenres = b.genres.map((g) => g.trim().toLowerCase());
      const shared = sourceGenres.filter((g) => bGenres.includes(g));
      if (shared.length > 0) {
        const pts = Math.min(45, shared.length * 15);
        score += pts;
        reasons.push(`Genres (+${pts}): ${shared.slice(0, 2).join(', ')}`);
      }
    }

    // E. Publisher Match (+15 for Publisher + Medium, +5 for Publisher only)
    const bPub = (b.publisher || '').trim().toLowerCase();
    if (sourcePub && bPub && sourcePub === bPub) {
      if (sourceMed && bMed && sourceMed === bMed) {
        score += 15;
        reasons.push(`Publisher: ${b.publisher}`);
      } else {
        score += 5;
        reasons.push(`Publisher: ${b.publisher}`);
      }
    }

    if (score > 0) {
      scores.push({ book: b, score, reasons });
    }
  });

  // Ensure diversity: recommend unique series runs rather than multiple volumes of the same series
  const seriesSeen = new Set<string>();
  const distinct: AffinityRecommendation[] = [];
  scores.sort((a, b) => b.score - a.score);

  for (const item of scores) {
    const sKey = (item.book.series || item.book.title).toLowerCase();
    if (!seriesSeen.has(sKey)) {
      seriesSeen.add(sKey);
      distinct.push(item);
    }
    if (distinct.length >= limit) break;
  }

  return distinct;
}

/**
 * 2. Deterministic Reading Continuity Engine ("Next Volume To Read")
 */
export function getNextVolumeToRead(
  seriesName: string,
  allBooks: TrophyBook[],
  progressMap: Map<string, TrophyProgress>
): ReadingContinuityState {
  const seriesBooks = allBooks
    .filter((b) => b.series && b.series.toLowerCase() === seriesName.toLowerCase())
    .sort((a, b) => (Number(a.issue_number) || 1) - (Number(b.issue_number) || 1));

  const totalVolumes = seriesBooks.length;
  if (totalVolumes === 0) {
    return {
      seriesName,
      currentBook: null,
      nextBook: null,
      status: 'not-started',
      totalVolumes: 0,
      completedVolumes: 0,
      percentOverall: 0,
    };
  }

  const completedCount = seriesBooks.filter((b) => progressMap.get(b.id)?.completed).length;
  const percentOverall = Math.round((completedCount / totalVolumes) * 100);

  // Find the highest volume that has any reading progress
  let highestReadIssue = 0;
  let currentBook: TrophyBook | null = null;

  for (const book of seriesBooks) {
    const prog = progressMap.get(book.id);
    if (prog && prog.percent_read > 0) {
      const issueNum = Number(book.issue_number) || 1;
      if (issueNum >= highestReadIssue) {
        highestReadIssue = issueNum;
        currentBook = book;
      }
    }
  }

  // If no volumes have been started
  if (!currentBook) {
    return {
      seriesName,
      currentBook: null,
      nextBook: seriesBooks[0],
      status: 'not-started',
      totalVolumes,
      completedVolumes: 0,
      percentOverall: 0,
    };
  }

  const currentProg = progressMap.get(currentBook.id);

  // If current book is in progress (not completed and < 98%)
  if (currentProg && !currentProg.completed && currentProg.percent_read < 98) {
    // Find next unread volume if user wants to peek ahead
    const subsequentVolume = seriesBooks.find(
      (b) => (Number(b.issue_number) || 1) > highestReadIssue
    );
    return {
      seriesName,
      currentBook,
      nextBook: subsequentVolume || currentBook,
      status: 'in-progress',
      totalVolumes,
      completedVolumes: completedCount,
      percentOverall,
    };
  }

  // If current book completed, find immediately next volume
  const nextBook = seriesBooks.find((b) => (Number(b.issue_number) || 1) > highestReadIssue);
  if (nextBook) {
    return {
      seriesName,
      currentBook,
      nextBook,
      status: 'in-progress',
      totalVolumes,
      completedVolumes: completedCount,
      percentOverall,
    };
  }

  // Series completed
  return {
    seriesName,
    currentBook,
    nextBook: null,
    status: 'series-completed',
    totalVolumes,
    completedVolumes: totalVolumes,
    percentOverall: 100,
  };
}

/**
 * 3. Reading Momentum Discovery Module
 */
export function getReadingMomentum(
  allBooks: TrophyBook[],
  progressMap: Map<string, TrophyProgress>
): ReadingMomentumState {
  let activeTitlesCount = 0;
  let totalPagesRead = 0;
  let totalTimeSeconds = 0;
  const activeSeriesSet = new Set<string>();

  progressMap.forEach((prog, bookId) => {
    if (prog.percent_read > 0) {
      activeTitlesCount += 1;
      totalPagesRead += prog.last_page || 0;
      totalTimeSeconds += prog.reading_time_seconds || 0;

      const b = allBooks.find((book) => book.id === bookId);
      if (b && b.series && b.series !== 'Standalone') {
        activeSeriesSet.add(b.series);
      }
    }
  });

  const recentlyActiveSeries = Array.from(activeSeriesSet).slice(0, 4);

  let momentumLevel: 'High' | 'Steady' | 'Getting Started' = 'Getting Started';
  let velocityDescription = 'Reading pace steady';

  if (activeTitlesCount >= 10 || totalPagesRead > 200) {
    momentumLevel = 'High';
    velocityDescription = '🔥 High Reading Velocity Across Multiple Stacks';
  } else if (activeTitlesCount >= 3 || totalPagesRead > 50) {
    momentumLevel = 'Steady';
    velocityDescription = '⚡ Active Series Progress Locked In';
  } else {
    momentumLevel = 'Getting Started';
    velocityDescription = '🌱 Starting First Runs in The Stacks';
  }

  return {
    activeTitlesCount,
    totalPagesRead,
    totalTimeSeconds,
    recentlyActiveSeries,
    momentumLevel,
    velocityDescription,
  };
}

/**
 * 4. Series Completion Forecast Panel
 */
export function getSeriesCompletionForecast(
  seriesName: string,
  allBooks: TrophyBook[],
  progressMap: Map<string, TrophyProgress>
): SeriesCompletionForecast {
  const seriesBooks = allBooks
    .filter((b) => b.series && b.series.toLowerCase() === seriesName.toLowerCase())
    .sort((a, b) => (Number(a.issue_number) || 1) - (Number(b.issue_number) || 1));

  const totalVolumes = seriesBooks.length;
  let completedVolumes = 0;
  let totalPages = 0;
  let pagesRead = 0;

  seriesBooks.forEach((b) => {
    const bookPages = b.page_count && b.page_count > 0 ? b.page_count : 180;
    totalPages += bookPages;

    const prog = progressMap.get(b.id);
    if (prog) {
      if (prog.completed) {
        completedVolumes += 1;
        pagesRead += bookPages;
      } else {
        pagesRead += Math.round((prog.percent_read / 100) * bookPages);
      }
    }
  });

  const remainingVolumes = Math.max(0, totalVolumes - completedVolumes);
  const remainingPages = Math.max(0, totalPages - pagesRead);
  const completionPercentage = totalVolumes > 0 ? Math.round((completedVolumes / totalVolumes) * 100) : 0;

  // Estimate reading speed: ~45 seconds per graphic page (~80 pages/hour)
  const estimatedHoursRemaining = Math.max(1, Math.round(remainingPages / 80));

  let forecastBadge = 'Unstarted Run';
  if (completionPercentage >= 100) {
    forecastBadge = '🏆 Complete Series Finished';
  } else if (completionPercentage >= 75) {
    forecastBadge = '🏁 Final Stretch';
  } else if (completionPercentage >= 25) {
    forecastBadge = '🚀 Well Underway';
  } else if (pagesRead > 0) {
    forecastBadge = '🌱 Early Chapters';
  }

  return {
    seriesName,
    totalVolumes,
    completedVolumes,
    remainingVolumes,
    totalPages,
    remainingPages,
    completionPercentage,
    estimatedHoursRemaining,
    forecastBadge,
  };
}

/**
 * 5. Discovery Insights Modules
 */
export function getDiscoveryInsights(
  allBooks: TrophyBook[],
  progressMap: Map<string, TrophyProgress>
) {
  // A. Most Read (active titles sorted by completion / time)
  const mostRead = allBooks
    .filter((b) => progressMap.has(b.id) && progressMap.get(b.id)!.percent_read > 0)
    .map((b) => ({
      book: b,
      progress: progressMap.get(b.id)!,
    }))
    .sort(
      (a, b) =>
        (b.progress.reading_time_seconds || 0) - (a.progress.reading_time_seconds || 0) ||
        b.progress.percent_read - a.progress.percent_read
    )
    .slice(0, 6);

  // B. Most Completed Series
  const seriesMap = new Map<string, TrophyBook[]>();
  allBooks.forEach((b) => {
    const s = b.series || 'Standalone';
    if (!seriesMap.has(s)) seriesMap.set(s, []);
    seriesMap.get(s)!.push(b);
  });

  const mostCompletedSeries: {
    seriesName: string;
    totalVols: number;
    completedVols: number;
    leadBook: TrophyBook;
    percentCompleted: number;
  }[] = [];

  seriesMap.forEach((sBooks, sName) => {
    if (sName === 'Standalone' || sBooks.length < 2) return;
    const completedVols = sBooks.filter((b) => progressMap.get(b.id)?.completed).length;
    const activeVols = sBooks.filter((b) => (progressMap.get(b.id)?.percent_read || 0) > 0).length;
    if (completedVols > 0 || activeVols > 0) {
      mostCompletedSeries.push({
        seriesName: sName,
        totalVols: sBooks.length,
        completedVols,
        leadBook: sBooks[0],
        percentCompleted: Math.round((completedVols / sBooks.length) * 100),
      });
    }
  });

  mostCompletedSeries.sort(
    (a, b) => b.completedVols - a.completedVols || b.percentCompleted - a.percentCompleted
  );

  // C. Hidden Gems (Standalones with 0% progress)
  const hiddenGems = allBooks
    .filter(
      (b) =>
        (!b.series || b.series === 'Standalone') &&
        (!progressMap.has(b.id) || progressMap.get(b.id)!.percent_read === 0)
    )
    .slice(0, 8);

  // D. Largest Complete Runs in Library
  const largestRuns: {
    seriesName: string;
    totalVols: number;
    leadBook: TrophyBook;
    medium: string;
    publisher: string;
  }[] = [];

  seriesMap.forEach((sBooks, sName) => {
    if (sName === 'Standalone' || sBooks.length < 5) return;
    largestRuns.push({
      seriesName: sName,
      totalVols: sBooks.length,
      leadBook: sBooks[0],
      medium: sBooks[0].medium || 'comic',
      publisher: sBooks[0].publisher || 'Independent',
    });
  });

  largestRuns.sort((a, b) => b.totalVols - a.totalVols);

  return {
    mostRead,
    mostCompletedSeries: mostCompletedSeries.slice(0, 6),
    hiddenGems,
    largestRuns: largestRuns.slice(0, 8),
  };
}

/**
 * 6. Creator Profile Builder
 */
export function getCreatorProfile(
  creatorName: string,
  allBooks: TrophyBook[],
  progressMap: Map<string, TrophyProgress>
): CreatorProfile {
  const normName = creatorName.trim().toLowerCase();
  const cBooks = allBooks.filter((b) => {
    if (!b.author) return false;
    const a = b.author.toLowerCase();
    return a === normName || a.includes(normName) || normName.includes(a);
  });

  const seriesMap = new Map<string, TrophyBook[]>();
  const standaloneBooks: TrophyBook[] = [];
  const publishersSet = new Set<string>();
  let totalCompleted = 0;
  const mediumCount: Record<string, number> = {};

  cBooks.forEach((b) => {
    if (b.publisher) publishersSet.add(b.publisher);
    if (progressMap.get(b.id)?.completed) totalCompleted += 1;

    const med = b.medium || 'comic';
    mediumCount[med] = (mediumCount[med] || 0) + 1;

    if (b.series && b.series !== 'Standalone') {
      if (!seriesMap.has(b.series)) seriesMap.set(b.series, []);
      seriesMap.get(b.series)!.push(b);
    } else {
      standaloneBooks.push(b);
    }
  });

  const seriesRuns: CreatorProfile['seriesRuns'] = [];
  seriesMap.forEach((sBooks, sName) => {
    sBooks.sort((a, b) => (Number(a.issue_number) || 1) - (Number(b.issue_number) || 1));
    const isCompleted = sBooks.every((b) => progressMap.get(b.id)?.completed);
    seriesRuns.push({
      seriesName: sName,
      volumes: sBooks.length,
      leadBook: sBooks[0],
      isCompleted,
    });
  });
  seriesRuns.sort((a, b) => b.volumes - a.volumes);

  let primaryMedium = 'comic';
  let maxCount = 0;
  Object.entries(mediumCount).forEach(([med, count]) => {
    if (count > maxCount) {
      maxCount = count;
      primaryMedium = med;
    }
  });

  return {
    name: creatorName,
    totalBooks: cBooks.length,
    seriesRuns,
    standaloneBooks,
    publishers: Array.from(publishersSet),
    totalCompleted,
    primaryMedium,
  };
}

/**
 * 7. Publisher Profile Builder
 */
export function getPublisherProfile(
  publisherName: string,
  allBooks: TrophyBook[],
  _progressMap: Map<string, TrophyProgress>
): PublisherProfile {
  const normName = publisherName.trim().toLowerCase();
  const pBooks = allBooks.filter((b) => {
    if (!b.publisher) return false;
    const p = b.publisher.toLowerCase();
    return p === normName || p.includes(normName) || normName.includes(p);
  });

  const seriesMap = new Map<string, TrophyBook[]>();
  const formatBreakdown: Record<string, number> = {};
  const mediumCount: Record<string, number> = {};

  pBooks.forEach((b) => {
    const fmt = (b.format || 'cbz').toLowerCase();
    formatBreakdown[fmt] = (formatBreakdown[fmt] || 0) + 1;

    const med = b.medium || 'comic';
    mediumCount[med] = (mediumCount[med] || 0) + 1;

    if (b.series && b.series !== 'Standalone') {
      if (!seriesMap.has(b.series)) seriesMap.set(b.series, []);
      seriesMap.get(b.series)!.push(b);
    }
  });

  const seriesRuns: PublisherProfile['seriesRuns'] = [];
  seriesMap.forEach((sBooks, sName) => {
    sBooks.sort((a, b) => (Number(a.issue_number) || 1) - (Number(b.issue_number) || 1));
    seriesRuns.push({
      seriesName: sName,
      volumes: sBooks.length,
      leadBook: sBooks[0],
    });
  });
  seriesRuns.sort((a, b) => b.volumes - a.volumes);

  let primaryMedium = 'comic';
  let maxCount = 0;
  Object.entries(mediumCount).forEach(([med, count]) => {
    if (count > maxCount) {
      maxCount = count;
      primaryMedium = med;
    }
  });

  return {
    name: publisherName,
    totalBooks: pBooks.length,
    seriesRuns,
    formatBreakdown,
    primaryMedium,
    recentBooks: pBooks.slice(0, 8),
  };
}
