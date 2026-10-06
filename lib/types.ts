// ===== Spot from Claude Vision API =====
export interface SpotData {
  label: string;
  xp: number;
  position: 'left' | 'right' | 'center' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  difficulty: 'easy' | 'medium' | 'hard';
  collected?: boolean;
}

// ===== Claude Vision API Response =====
export interface AnalyzeResponse {
  spots: SpotData[];
  totalSpots: number;
  overallCleanliness: number;
  roast: string;
  encouragement: string;
}

// ===== Chore Types =====
export type ChoreType = 'vacuum' | 'mop' | 'trash' | 'laundry';

export interface ChoreTypeInfo {
  id: ChoreType;
  emoji: string;
  name: string;
  description: string;
  bgColor: string;
  accentColor: string;
}

// ===== Player Stats (localStorage) =====
export interface PlayerStats {
  totalXP: number;
  level: number;
  streak: number;
  lastActiveDate: string; // "YYYY-MM-DD"
  tasksCompleted: number;
  totalScans: number;
}

// ===== Quest History Entry =====
export interface QuestHistoryEntry {
  id: string;
  date: string;
  choreType: ChoreType;
  spotsCollected: number;
  totalSpots: number;
  xpEarned: number;
  timeSeconds: number;
  roast: string;
  cleanliness: number;
}

// ===== Active Quest =====
export interface ActiveQuest {
  id: string;
  choreType: ChoreType;
  spots: SpotData[];
  createdAt: string;
  roast: string;
  encouragement: string;
}

// ===== Level Info =====
export interface LevelInfo {
  level: number;
  xpRequired: number;
  title: string;
}

// ===== Rascal Expression =====
export type RascalExpression = 'idle' | 'thinking' | 'shocked' | 'encouraging' | 'celebrating' | 'disappointed' | 'roasting';

// ===== Position Mapping =====
export const POSITION_MAP: Record<SpotData['position'], { left: string; top: string }> = {
  'top-left': { left: '20%', top: '25%' },
  'top-right': { left: '80%', top: '25%' },
  'center': { left: '50%', top: '50%' },
  'bottom-left': { left: '20%', top: '75%' },
  'bottom-right': { left: '80%', top: '75%' },
  'left': { left: '20%', top: '50%' },
  'right': { left: '80%', top: '50%' },
};
