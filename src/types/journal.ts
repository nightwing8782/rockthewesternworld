export type EnergyQuadrant =
  | 'high_focused'
  | 'high_scattered'
  | 'low_reflective'
  | 'low_depleted'
  | null;

export interface HabitMap {
  [habitId: string]: boolean;
}

export interface TriadState {
  bright_spot: string;
  calibration: string;
  working_thought: string;
}

export type LedgerHorizon = 'daily' | 'weekly' | 'monthly' | 'compass';

// ==========================================
// 1. COMPASS & ANNUAL ROADMAP
// ==========================================
export interface CoreValueEntry {
  value: string;
  whyImportant: string;
  howEmbodiedNow: string;
  actionableSteps: string;
}

export interface CompassRoadmap {
  lifetime: string[];
  threeYears: string[];
  oneYear: string[];
  threeMonths: string[];
}

export interface CompassMetadata {
  horizon: 'compass';
  year: number;
  isLocked?: boolean;
  sealedAt?: string;
  coreValues: CoreValueEntry[];
  roadmap: CompassRoadmap;
  annualGamechanger: {
    goal: string;
    vision: string;
    whyMatters: string;
  };
}

// ==========================================
// 2. MONTHLY HORIZON
// ==========================================
export interface SubtaskItem {
  id: string;
  title: string;
  done: boolean;
  targetDate?: string;
}

export interface ProjectItem {
  id: string;
  title: string;
  dueDate: string;
  done: boolean;
}

export interface LifeDomainRatings {
  mental: number; // 1-5
  physical: number;
  finances: number;
  passions: number;
  relationships: number;
  selfCare: number;
}

export interface MonthlyReflection {
  rating: number; // 1-10
  accomplishments: string;
  lessons: string;
  memorableMoments: string;
  focusesNextMonth: string;
  domains: LifeDomainRatings;
}

export interface MonthlyMetadata {
  horizon: 'monthly';
  monthKey: string; // 'YYYY-MM', e.g. '2026-10'
  monthFocus: string;
  gamechanger: {
    title: string;
    targetDate: string;
    whyWin: string;
    challenges: string;
    subtasks: SubtaskItem[];
  };
  quads: {
    peopleToSee: string[];
    placesToGo: string[];
    thingsToLearn: string[];
  };
  projects: {
    personal: ProjectItem[];
    work: ProjectItem[];
  };
  reflection: MonthlyReflection;
}

// ==========================================
// 3. WEEKLY RHYTHM
// ==========================================
export type TaskPriority = 'top' | 'priority' | 'errand';

export interface WeeklyTaskItem {
  id: string;
  title: string;
  priority: TaskPriority;
  done: boolean;
}

export interface WeeklyMetadata {
  horizon: 'weekly';
  weekKey: string; // 'YYYY-Www', e.g. '2026-W40'
  monthKey: string; // Parent month 'YYYY-MM'
  weekFocus: string;
  goodThings: string[];
  tasks: {
    personal: WeeklyTaskItem[];
    work: WeeklyTaskItem[];
  };
  infiniteSpace?: string;
}

// ==========================================
// 4. DAILY LEDGER
// ==========================================
export interface DailyLedgerMetadata {
  entry_type: 'personal_ledger';
  horizon?: LedgerHorizon;
  dateKey?: string; // 'YYYY-MM-DD'
  weekKey?: string; // 'YYYY-Www'
  monthKey?: string; // 'YYYY-MM'
  year?: number | string;
  todayFocus?: string;
  gamechangerStep?: string;
  todayLearned?: string;
  dayInOneWord?: string;
  mood?: number; // 1-5
  energy: EnergyQuadrant;
  habits: HabitMap;
  triad: TriadState;
  freeSpace?: string;
  // Fallback for nested metadata if needed
  ledger?: Partial<DailyLedgerMetadata>;
}

// Union of all possible private personal ledger metadata types
export type PersonalLedgerMetadata =
  | DailyLedgerMetadata
  | WeeklyMetadata
  | MonthlyMetadata
  | CompassMetadata;
