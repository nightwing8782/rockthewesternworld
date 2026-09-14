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

export interface DailyLedgerMetadata {
  entry_type: 'personal_ledger';
  energy: EnergyQuadrant;
  habits: HabitMap;
  triad: TriadState;
}
