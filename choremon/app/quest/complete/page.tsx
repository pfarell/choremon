'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Celebration from '@/components/Celebration';
import Rascal from '@/components/Rascal';
import { completeQuest, getStats, addToHistory, getLevelTitle } from '@/lib/storage';
import { CHORE_TYPES } from '@/lib/constants';
import { ChoreType } from '@/lib/types';
import { playQuestComplete, playLevelUp } from '@/lib/sounds';

interface QuestResult {
  choreType: ChoreType;
  spotsCollected: number;
  totalSpots: number;
  xpEarned: number;
  timeSeconds: number;
}

export default function CompletePage() {
  const router = useRouter();
  const [result, setResult] = useState<QuestResult | null>(null);
  const [displayXP, setDisplayXP] = useState(0);
  const [leveledUp, setLeveledUp] = useState(false);
  const [newLevel, setNewLevel] = useState(0);
  const [streak, setStreak] = useState(0);
  const processedRef = useRef(false);

  useEffect(() => {
    // Try localStorage first (from AR mode / ar.html)
    let raw = localStorage.getItem('choremon-last-quest');
    let source = 'ar';

    if (!raw) {
      // Fallback to sessionStorage (from old motion-detection mode)
      raw = sessionStorage.getItem('choremon-quest-result');
      source = 'session';
    }

    if (!raw) {
      router.push('/');
      return;
    }

    const parsed = JSON.parse(raw);

    // Normalize field names (AR uses coinsCollected/totalCoins, session uses spotsCollected/totalSpots)
    const questResult: QuestResult = {
      choreType: parsed.choreType || 'vacuum',
      spotsCollected: parsed.coinsCollected ?? parsed.spotsCollected ?? 0,
      totalSpots: parsed.totalCoins ?? parsed.totalSpots ?? 0,
      xpEarned: parsed.xpEarned ?? 0,
      timeSeconds: parsed.timeSeconds ?? 0,
    };
    setResult(questResult);

    // Process quest completion only once
    if (!processedRef.current) {
      processedRef.current = true;

      const completion = completeQuest(questResult.xpEarned);
      setLeveledUp(completion.leveledUp);
      setNewLevel(completion.newLevel);
      setStreak(completion.stats.streak);

      // Save to history
      addToHistory({
        id: Date.now().toString(),
        date: new Date().toISOString(),
        choreType: questResult.choreType,
        spotsCollected: questResult.spotsCollected,
        totalSpots: questResult.totalSpots,
        xpEarned: questResult.xpEarned,
        timeSeconds: questResult.timeSeconds,
        roast: '',
        cleanliness: 0,
      });

      // Play sounds
      setTimeout(() => {
        playQuestComplete();
        if (completion.leveledUp) {
          setTimeout(() => playLevelUp(), 800);
        }
      }, 500);

      // Animate XP counter
      const duration = 1500;
      const steps = 60;
      const increment = questResult.xpEarned / steps;
      let current = 0;
      const interval = setInterval(() => {
        current += increment;
        if (current >= questResult.xpEarned) {
          setDisplayXP(questResult.xpEarned);
          clearInterval(interval);
        } else {
          setDisplayXP(Math.floor(current));
        }
      }, duration / steps);

      // Cleanup both storage sources
      localStorage.removeItem('choremon-last-quest');
      sessionStorage.removeItem('choremon-quest-result');
      sessionStorage.removeItem('choremon-live-quest');
      sessionStorage.removeItem('choremon-scan-result');
      sessionStorage.removeItem('choremon-scan-choretype');
    }
  }, [router]);

  if (!result) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin-slow text-4xl">🦝</div>
      </div>
    );
  }

  const choreInfo = CHORE_TYPES.find(c => c.id === result.choreType);
  const formatTime = (s: number) => {
    const min = Math.floor(s / 60);
    const sec = s % 60;
    return `${min}:${sec.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center p-4">
      <Celebration />

      <div className="card w-full max-w-sm text-center py-8 px-6 animate-bounce-in relative z-10 shadow-lg">
        {/* Rascal celebrating */}
        <div className="mb-4">
          <Rascal size="lg" className="mx-auto" />
        </div>

        {/* Title */}
        <h1 className="font-display text-3xl text-txt mb-1">QUEST COMPLETE!</h1>
        <p className="text-sm text-txt-light font-semibold mb-5">
          {choreInfo?.emoji} {choreInfo?.name}
        </p>

        {/* XP Earned */}
        <div className="mb-4">
          <div className="text-4xl font-bold text-gold font-display">
            +{displayXP} XP ⭐
          </div>
        </div>

        {/* Stats */}
        <div className="flex items-center justify-center gap-6 mb-4 text-center">
          <div>
            <p className="text-lg font-bold text-txt">{formatTime(result.timeSeconds)}</p>
            <p className="text-[10px] text-txt-light font-semibold">Time</p>
          </div>
          <div className="w-px h-8 bg-border" />
          <div>
            <p className="text-lg font-bold text-txt">{result.spotsCollected}/{result.totalSpots}</p>
            <p className="text-[10px] text-txt-light font-semibold">Spots</p>
          </div>
          <div className="w-px h-8 bg-border" />
          <div>
            <p className="text-lg font-bold text-txt">🔥 {streak}</p>
            <p className="text-[10px] text-txt-light font-semibold">Streak</p>
          </div>
        </div>

        {/* Level Up */}
        {leveledUp && (
          <div className="bg-gold/10 border-2 border-gold rounded-2xl p-3 mb-5 animate-bounce-in" style={{ animationDelay: '0.3s' }}>
            <p className="font-bold text-gold text-sm">🏅 LEVEL UP!</p>
            <p className="font-display text-lg text-txt">
              Level {newLevel}: {getLevelTitle(newLevel)}
            </p>
          </div>
        )}

        {/* Buttons */}
        <div className="flex flex-col gap-3 mt-2">
          <button
            onClick={() => router.push('/scan')}
            className="btn-3d btn-green"
          >
            Keep Going
          </button>
          <button
            onClick={() => router.push('/')}
            className="btn-3d btn-outline"
          >
            Back Home
          </button>
        </div>
      </div>
    </div>
  );
}
