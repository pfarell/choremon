'use client';

import { useEffect, useState } from 'react';
import BottomNav from '@/components/BottomNav';
import { FAKE_LEADERBOARD, LEVELS } from '@/lib/constants';
import { getStats } from '@/lib/storage';
import { Trophy } from 'lucide-react';

interface LeaderboardEntry {
  name: string;
  xp: number;
  level: number;
  avatar: string;
  isUser?: boolean;
}

export default function LeaderboardPage() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);

  useEffect(() => {
    const stats = getStats();
    const userEntry: LeaderboardEntry = {
      name: 'You',
      xp: stats.totalXP,
      level: stats.level,
      avatar: '🦝',
      isUser: true,
    };

    const all: LeaderboardEntry[] = [...FAKE_LEADERBOARD, userEntry];
    all.sort((a, b) => b.xp - a.xp);
    setEntries(all);
  }, []);

  const getMedal = (rank: number) => {
    if (rank === 0) return '🥇';
    if (rank === 1) return '🥈';
    if (rank === 2) return '🥉';
    return `#${rank + 1}`;
  };

  return (
    <div className="pb-24 px-4 pt-6">
      <div className="text-center mb-6 animate-slide-up">
        <div className="flex items-center justify-center gap-2 mb-1">
          <Trophy size={28} className="text-gold" />
          <h1 className="font-display text-2xl text-txt">Leaderboard</h1>
        </div>
        <p className="text-sm text-txt-light font-semibold">Climb the ranks!</p>
      </div>

      <div className="flex flex-col gap-2">
        {entries.map((entry, index) => (
          <div
            key={entry.name}
            className={`card flex items-center gap-3 animate-slide-up ${
              entry.isUser ? 'border-green-primary border-2 bg-green-light/30' : ''
            }`}
            style={{ animationDelay: `${index * 0.05}s` }}
          >
            <div className="w-10 text-center">
              <span className={`font-bold ${index < 3 ? 'text-xl' : 'text-sm text-txt-light'}`}>
                {getMedal(index)}
              </span>
            </div>

            <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-xl">
              {entry.avatar}
            </div>

            <div className="flex-1 min-w-0">
              <p className={`font-bold text-sm truncate ${entry.isUser ? 'text-green-primary' : 'text-txt'}`}>
                {entry.name}
              </p>
              <p className="text-[10px] text-txt-light font-semibold">
                Level {entry.level} · {LEVELS[entry.level]?.title}
              </p>
            </div>

            <div className="text-right">
              <p className="font-bold text-sm text-gold">{entry.xp.toLocaleString()}</p>
              <p className="text-[10px] text-txt-light font-semibold">XP</p>
            </div>
          </div>
        ))}
      </div>

      <BottomNav />
    </div>
  );
}
