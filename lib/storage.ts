import { PlayerStats, QuestHistoryEntry, ActiveQuest } from './types';
import { STORAGE_KEYS, LEVELS } from './constants';

// ===== Default Stats =====
const DEFAULT_STATS: PlayerStats = {
  totalXP: 0,
  level: 0,
  streak: 0,
  lastActiveDate: '',
  tasksCompleted: 0,
  totalScans: 0,
};

// ===== Stats =====
export function getStats(): PlayerStats {
  if (typeof window === 'undefined') return DEFAULT_STATS;
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.stats);
    if (!raw) return DEFAULT_STATS;
    return JSON.parse(raw) as PlayerStats;
  } catch {
    return DEFAULT_STATS;
  }
}

export function saveStats(stats: PlayerStats): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEYS.stats, JSON.stringify(stats));
}

// ===== Level Calculation =====
export function getLevelForXP(xp: number): number {
  let level = 0;
  for (const l of LEVELS) {
    if (xp >= l.xpRequired) level = l.level;
    else break;
  }
  return level;
}

export function getLevelTitle(level: number): string {
  return LEVELS[level]?.title ?? 'Messy Rookie';
}

export function getXPForNextLevel(level: number): number {
  const nextLevel = LEVELS[level + 1];
  return nextLevel?.xpRequired ?? LEVELS[LEVELS.length - 1].xpRequired;
}

export function getCurrentLevelXP(level: number): number {
  return LEVELS[level]?.xpRequired ?? 0;
}

// ===== XP & Level Up =====
export function addXP(amount: number): { stats: PlayerStats; leveledUp: boolean; newLevel: number } {
  const stats = getStats();
  stats.totalXP += amount;
  
  const newLevel = getLevelForXP(stats.totalXP);
  const leveledUp = newLevel > stats.level;
  stats.level = newLevel;
  
  saveStats(stats);
  return { stats, leveledUp, newLevel };
}

// ===== Streak =====
export function updateStreak(): PlayerStats {
  const stats = getStats();
  const today = new Date().toISOString().split('T')[0];
  
  if (stats.lastActiveDate === today) {
    return stats;
  }
  
  if (stats.lastActiveDate) {
    const lastDate = new Date(stats.lastActiveDate);
    const todayDate = new Date(today);
    const diffDays = Math.floor((todayDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) {
      stats.streak += 1;
    } else if (diffDays > 1) {
      stats.streak = 1;
    }
  } else {
    stats.streak = 1;
  }
  
  stats.lastActiveDate = today;
  saveStats(stats);
  return stats;
}

// ===== Complete Quest =====
export function completeQuest(xpEarned: number): { stats: PlayerStats; leveledUp: boolean; newLevel: number } {
  const stats = getStats();
  stats.tasksCompleted += 1;
  saveStats(stats);
  
  const result = addXP(xpEarned);
  const updatedStats = updateStreak();
  
  return { stats: { ...result.stats, ...updatedStats, totalXP: result.stats.totalXP, level: result.stats.level }, leveledUp: result.leveledUp, newLevel: result.newLevel };
}

// ===== Quest History =====
export function getHistory(): QuestHistoryEntry[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.history);
    if (!raw) return [];
    return JSON.parse(raw) as QuestHistoryEntry[];
  } catch {
    return [];
  }
}

export function addToHistory(entry: QuestHistoryEntry): void {
  const history = getHistory();
  history.unshift(entry);
  if (history.length > 50) history.pop();
  localStorage.setItem(STORAGE_KEYS.history, JSON.stringify(history));
}

// ===== Active Quests =====
export function getActiveQuests(): ActiveQuest[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.activeQuests);
    if (!raw) return [];
    return JSON.parse(raw) as ActiveQuest[];
  } catch {
    return [];
  }
}

export function saveActiveQuest(quest: ActiveQuest): void {
  const quests = getActiveQuests();
  quests.unshift(quest);
  localStorage.setItem(STORAGE_KEYS.activeQuests, JSON.stringify(quests));
}

export function removeActiveQuest(id: string): void {
  const quests = getActiveQuests().filter(q => q.id !== id);
  localStorage.setItem(STORAGE_KEYS.activeQuests, JSON.stringify(quests));
}

// ===== Onboarding =====
export function hasOnboarded(): boolean {
  if (typeof window === 'undefined') return true;
  return localStorage.getItem(STORAGE_KEYS.onboarded) === 'true';
}

export function setOnboarded(): void {
  localStorage.setItem(STORAGE_KEYS.onboarded, 'true');
}

// ===== Mute =====
export function isMuted(): boolean {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem(STORAGE_KEYS.muted) === 'true';
}

export function setMuted(muted: boolean): void {
  localStorage.setItem(STORAGE_KEYS.muted, muted ? 'true' : 'false');
}
