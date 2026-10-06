'use client';

import { getLevelTitle, getXPForNextLevel, getCurrentLevelXP } from '@/lib/storage';
import { Star } from 'lucide-react';

interface XPBarProps {
  totalXP: number;
  level: number;
  slim?: boolean;
}

export default function XPBar({ totalXP, level, slim = false }: XPBarProps) {
  const currentLevelXP = getCurrentLevelXP(level);
  const nextLevelXP = getXPForNextLevel(level);
  const progressXP = totalXP - currentLevelXP;
  const neededXP = nextLevelXP - currentLevelXP;
  const percentage = Math.min((progressXP / neededXP) * 100, 100);
  const title = getLevelTitle(level);

  if (slim) {
    return (
      <div className="w-full">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <span className="bg-green-primary text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
              Lv.{level}
            </span>
          </div>
          <span className="text-[11px] font-bold text-txt-light">
            {progressXP}/{neededXP} XP
          </span>
        </div>
        <div className="xp-bar-track" style={{ height: '8px' }}>
          <div className="xp-bar-fill" style={{ width: `${percentage}%` }} />
        </div>
      </div>
    );
  }

  return (
    <div className="xp-bar-card">
      <div className="flex items-center justify-between mb-2.5">
        <div className="flex items-center gap-2">
          <div className="xp-bar-star">
            <Star size={16} fill="white" stroke="white" />
          </div>
          <span className="text-sm font-extrabold text-txt">XP Progress</span>
        </div>
        <span className="text-sm font-extrabold text-txt">
          {progressXP} / {neededXP} XP
        </span>
      </div>
      <div className="xp-bar-track-duo">
        <div className="xp-bar-fill-duo" style={{ width: `${percentage}%` }} />
      </div>
    </div>
  );
}
