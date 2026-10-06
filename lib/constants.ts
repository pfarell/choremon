import { ChoreTypeInfo, LevelInfo } from './types';

// ===== Design System Colors =====
export const COLORS = {
  greenPrimary: '#58CC02',
  greenDark: '#4CAD02',
  greenLight: '#D7FFB8',
  gold: '#FFD700',
  goldDark: '#E5A800',
  coral: '#FF4B4B',
  purple: '#CE82FF',
  blue: '#1CB0F6',
  orange: '#FF9600',
  bg: '#FAFAF8',
  card: '#FFFFFF',
  border: '#E5E5E5',
  text: '#3C3C3C',
  textLight: '#AFAFAF',
} as const;

// ===== Chore Types =====
export const CHORE_TYPES: ChoreTypeInfo[] = [
  {
    id: 'vacuum',
    emoji: '🧹',
    name: 'Vacuum / Sweep',
    description: 'Floors, carpets & corners',
    bgColor: '#D7FFB8',
    accentColor: '#58CC02',
  },
  {
    id: 'mop',
    emoji: '🧽',
    name: 'Mop / Wipe',
    description: 'Surfaces, counters & tables',
    bgColor: '#DDF4FF',
    accentColor: '#1CB0F6',
  },
  {
    id: 'trash',
    emoji: '🗑️',
    name: 'Trash / Declutter',
    description: 'Remove junk & organize',
    bgColor: '#FFF8DD',
    accentColor: '#FFD700',
  },
  {
    id: 'laundry',
    emoji: '👕',
    name: 'Laundry',
    description: 'Sort, wash & fold clothes',
    bgColor: '#F3E8FF',
    accentColor: '#CE82FF',
  },
];

// ===== Level System =====
export const LEVELS: LevelInfo[] = [
  { level: 0, xpRequired: 0, title: 'Messy Rookie' },
  { level: 1, xpRequired: 100, title: 'Broom Apprentice' },
  { level: 2, xpRequired: 250, title: 'Dust Fighter' },
  { level: 3, xpRequired: 500, title: 'Clean Cadet' },
  { level: 4, xpRequired: 800, title: 'Tidy Warrior' },
  { level: 5, xpRequired: 1200, title: 'Sparkle Knight' },
  { level: 6, xpRequired: 1700, title: 'Grime Slayer' },
  { level: 7, xpRequired: 2300, title: 'Shine Master' },
  { level: 8, xpRequired: 3000, title: 'Hygiene Hero' },
  { level: 9, xpRequired: 4000, title: 'Spotless Legend' },
  { level: 10, xpRequired: 5000, title: 'Choremon Master' },
];

// ===== Fake Leaderboard Users =====
export const FAKE_LEADERBOARD = [
  { name: 'CleanQueen99', xp: 4820, level: 9, avatar: '👸' },
  { name: 'MopMaster', xp: 3650, level: 8, avatar: '🧹' },
  { name: 'DustSlayer42', xp: 2900, level: 7, avatar: '⚔️' },
  { name: 'SparkleKing', xp: 2100, level: 6, avatar: '✨' },
  { name: 'SoapBoss', xp: 1450, level: 5, avatar: '🧼' },
];

// ===== Rascal Greetings =====
export const RASCAL_GREETINGS = [
  "Your kitchen is calling... and it doesn't sound happy 🦝",
  "Ready to level up, champ? 💪",
  "Back for more? I respect the grind. 🫡",
  "Bro, that room isn't gonna clean itself! 🧹",
  "Rise and grind, cleaning hero! ✨",
  "I can smell your room from here... just saying 👃",
  "Let's turn this mess into a masterpiece! 🎨",
  "Another day, another quest. Let's gooo! 🚀",
  "You've been avoiding that laundry, haven't you? 👀",
  "Time to earn some XP! The dust bunnies are getting brave 🐰",
  "Your cleaning streak is looking fire today! 🔥",
  "The mess won't know what hit it 💥",
];

// ===== Difficulty Colors =====
export const DIFFICULTY_COLORS = {
  easy: '#58CC02',
  medium: '#1CB0F6',
  hard: '#FF9600',
} as const;

// ===== Confetti Colors =====
export const CONFETTI_COLORS = ['#58CC02', '#FFD700', '#FF4B4B', '#CE82FF', '#1CB0F6', '#FF9600'];

// ===== Storage Keys =====
export const STORAGE_KEYS = {
  stats: 'choremon-stats',
  history: 'choremon-history',
  activeQuests: 'choremon-active-quests',
  onboarded: 'choremon-onboarded',
  muted: 'choremon-muted',
} as const;
