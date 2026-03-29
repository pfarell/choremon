'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import BottomNav from '@/components/BottomNav';
import ChoreCard from '@/components/ChoreCard';
import ChoreConfirm from '@/components/ChoreConfirm';
import { CHORE_TYPES } from '@/lib/constants';
import { ChoreType, ActiveQuest, SpotData } from '@/lib/types';
import { playButtonTap } from '@/lib/sounds';
import { saveActiveQuest } from '@/lib/storage';

export default function ScanPage() {
  const [selected, setSelected] = useState<ChoreType | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const router = useRouter();

  const handleContinue = () => {
    if (!selected) return;
    playButtonTap();

    // Vacuum, Mop & Laundry — no AI camera needed, go straight to Now/Later confirm
    if (selected === 'vacuum' || selected === 'mop' || selected === 'laundry') {
      setShowConfirm(true);
      return;
    }

    // Trash — use AI scan first, then Now/Later on result page
    router.push(`/scan/analyze?type=${selected}`);
  };

  const handleNow = () => {
    if (!selected) return;
    playButtonTap();
    
    // Laundry goes to static Live Quest mode
    if (selected === 'laundry') {
      router.push(`/quest/live?choreType=${selected}`);
      return;
    }
    
    // Vacuum & Mop go to AR Canvas mode
    window.location.href = `/ar.html?choreType=${selected}`;
  };

  const handleLater = () => {
    if (!selected) return;
    playButtonTap();

    const defaultSpots: SpotData[] = [
      { label: 'Spot 1', xp: 30, position: 'bottom-left', difficulty: 'easy' },
      { label: 'Spot 2', xp: 40, position: 'center', difficulty: 'medium' },
      { label: 'Spot 3', xp: 50, position: 'top-right', difficulty: 'hard' },
    ];

    const quest: ActiveQuest = {
      id: Date.now().toString(),
      choreType: selected,
      spots: defaultSpots,
      createdAt: new Date().toISOString(),
      roast: 'Saved for later — Rascal is watching! 👀',
      encouragement: "Come back when you're ready to clean!",
    };
    saveActiveQuest(quest);
    router.push('/');
  };

  return (
    <div className="pb-24 px-4 pt-6">
      <div className="text-center mb-6 animate-slide-up">
        <h1 className="font-display text-2xl text-txt">What are we cleaning?</h1>
        <p className="text-sm text-txt-light font-semibold mt-1">Pick your quest type</p>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-8">
        {CHORE_TYPES.map((chore, index) => (
          <ChoreCard
            key={chore.id}
            chore={chore}
            selected={selected === chore.id}
            onSelect={() => {
              playButtonTap();
              setSelected(chore.id);
            }}
            index={index}
          />
        ))}
      </div>

      <button
        onClick={handleContinue}
        disabled={!selected}
        className={`btn-3d w-full ${selected ? 'btn-green' : 'btn-grey'}`}
      >
        Continue
      </button>

      {/* Now/Later confirm for vacuum & mop (no AI scan needed) */}
      {showConfirm && selected && (
        <ChoreConfirm
          choreType={selected}
          onNow={handleNow}
          onLater={handleLater}
        />
      )}

      <BottomNav />
    </div>
  );
}
