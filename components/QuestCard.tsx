'use client';

import { ActiveQuest } from '@/lib/types';
import { CHORE_TYPES } from '@/lib/constants';
import { ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { ChoreType } from '@/lib/types';

const CHORE_DIFFICULTY: Record<ChoreType, { label: string; color: string }> = {
  vacuum: { label: 'Epic', color: '#CE82FF' },
  mop:    { label: 'Epic', color: '#CE82FF' },
  trash:  { label: 'Easy', color: '#58CC02' },
  laundry:{ label: 'Medium', color: '#FFD700' },
};

interface QuestCardProps {
  quest: ActiveQuest;
}

export default function QuestCard({ quest }: QuestCardProps) {
  const choreInfo = CHORE_TYPES.find(c => c.id === quest.choreType);
  const totalXP = quest.spots.reduce((sum, s) => sum + s.xp, 0);
  const diff = CHORE_DIFFICULTY[quest.choreType] || { label: 'Medium', color: '#FFD700' };

  return (
    <Link
      href={
        quest.choreType === 'mop' || quest.choreType === 'vacuum' 
        ? `/ar.html?choreType=${quest.choreType}&questId=${quest.id}` 
        : `/quest/live?choreType=${quest.choreType}&questId=${quest.id}`
      }
      className="card flex items-center gap-3 animate-slide-up"
    >
      <span className="text-3xl">{choreInfo?.emoji ?? '🧹'}</span>
      <div className="flex-1 min-w-0">
        <div className="font-bold text-sm text-txt truncate">
          {choreInfo?.name ?? 'Quest'}
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-xs font-bold text-gold">+{totalXP} XP</span>
          <span
            className="text-[10px] font-bold px-2 py-0.5 rounded-full text-white"
            style={{ background: diff.color }}
          >
            {diff.label}
          </span>
        </div>
      </div>
      <ChevronRight size={20} className="text-txt-light" />
    </Link>
  );
}
