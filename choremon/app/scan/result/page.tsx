'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CHORE_TYPES } from '@/lib/constants';
import { AnalyzeResponse, ChoreType } from '@/lib/types';
import { saveActiveQuest } from '@/lib/storage';
import { playButtonTap } from '@/lib/sounds';
import ChoreConfirm from '@/components/ChoreConfirm';

export default function ResultPage() {
  const router = useRouter();
  const [result, setResult] = useState<AnalyzeResponse | null>(null);
  const [choreType, setChoreType] = useState<ChoreType>('vacuum');

  useEffect(() => {
    const raw = sessionStorage.getItem('choremon-scan-result');
    const type = sessionStorage.getItem('choremon-scan-choretype') as ChoreType;
    if (raw) {
      setResult(JSON.parse(raw));
      setChoreType(type || 'vacuum');
    } else {
      router.push('/scan');
    }
  }, [router]);

  if (!result) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin-slow text-4xl">🦝</div>
      </div>
    );
  }

  const handleNow = () => {
    playButtonTap();
    // Trash & Laundry → live mode, Vacuum & Mop → AR mode
    if (choreType === 'trash' || choreType === 'laundry') {
      router.push(`/quest/live?choreType=${choreType}`);
    } else {
      const spotsParam = encodeURIComponent(JSON.stringify(result.spots));
      window.location.href = `/ar.html?choreType=${choreType}&spots=${spotsParam}`;
    }
  };

  const handleLater = () => {
    playButtonTap();
    const quest = {
      id: Date.now().toString(),
      choreType,
      spots: result.spots,
      createdAt: new Date().toISOString(),
      roast: result.roast,
      encouragement: result.encouragement,
    };
    saveActiveQuest(quest);
    router.push('/');
  };

  return (
    <ChoreConfirm
      choreType={choreType}
      onNow={handleNow}
      onLater={handleLater}
    />
  );
}
