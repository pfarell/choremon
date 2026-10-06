'use client';

import { ChoreTypeInfo } from '@/lib/types';
import { Check } from 'lucide-react';

interface ChoreCardProps {
  chore: ChoreTypeInfo;
  selected: boolean;
  onSelect: () => void;
  index: number;
}

export default function ChoreCard({ chore, selected, onSelect, index }: ChoreCardProps) {
  return (
    <button
      onClick={onSelect}
      className={`relative rounded-2xl p-5 flex flex-col items-center gap-2 transition-all duration-200 border-2 animate-bounce-in stagger-${index + 1}`}
      style={{
        backgroundColor: chore.bgColor,
        borderColor: selected ? chore.accentColor : 'transparent',
        transform: selected ? 'scale(1.02)' : 'scale(1)',
      }}
    >
      {selected && (
        <div
          className="absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center"
          style={{ background: chore.accentColor }}
        >
          <Check size={14} color="white" strokeWidth={3} />
        </div>
      )}
      <span className="text-5xl">{chore.emoji}</span>
      <span className="font-bold text-sm text-txt">{chore.name}</span>
      <span className="text-[11px] text-txt-light font-semibold">{chore.description}</span>
    </button>
  );
}
