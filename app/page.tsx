'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import { Camera, Flame } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import BottomNav from '@/components/BottomNav';
import XPBar from '@/components/XPBar';
import Rascal from '@/components/Rascal';
import QuestCard from '@/components/QuestCard';
import { getStats, getActiveQuests, hasOnboarded, setOnboarded } from '@/lib/storage';
import { RASCAL_GREETINGS } from '@/lib/constants';
import { PlayerStats, ActiveQuest } from '@/lib/types';
import { resumeAudio, playButtonTap } from '@/lib/sounds';
import { rascalSpeak } from '@/lib/rascalSpeak';

let globalAudioUnlocked = false;

export default function HomePage() {
  const [stats, setStats] = useState<PlayerStats | null>(null);
  const [quests, setQuests] = useState<ActiveQuest[]>([]);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [onboardingStep, setOnboardingStep] = useState(0);

  const [displayedText, setDisplayedText] = useState('');
  const [showBubble, setShowBubble] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [showCursor, setShowCursor] = useState(true);

  const greeting = useMemo(
    () => RASCAL_GREETINGS[Math.floor(Math.random() * RASCAL_GREETINGS.length)],
    []
  );

  const startTypewriter = useCallback(() => {
    setShowBubble(true);

    const startDelay = setTimeout(() => {
      setIsTyping(true);
      let charIndex = 0;

      const typeInterval = setInterval(() => {
        if (charIndex < greeting.length) {
          setDisplayedText(greeting.slice(0, charIndex + 1));
          charIndex++;
        } else {
          clearInterval(typeInterval);
          setIsTyping(false);
          setTimeout(() => setShowCursor(false), 1500);
        }
      }, 40); 

      return () => clearInterval(typeInterval);
    }, 400); 

    return () => clearTimeout(startDelay);
  }, [greeting]);

  useEffect(() => {
    setStats(getStats());
    setQuests(getActiveQuests());
    if (!hasOnboarded()) {
      setShowOnboarding(true);
    }

    const cleanup = startTypewriter();

    if (!globalAudioUnlocked) {
      const unlockAudio = () => {
        globalAudioUnlocked = true;
        rascalSpeak(greeting);
        window.removeEventListener('click', unlockAudio);
        window.removeEventListener('touchstart', unlockAudio);
      };
      window.addEventListener('click', unlockAudio);
      window.addEventListener('touchstart', unlockAudio);
      return () => {
        cleanup();
        window.removeEventListener('click', unlockAudio);
        window.removeEventListener('touchstart', unlockAudio);
      };
    } else {
      rascalSpeak(greeting);
      return cleanup;
    }
  }, [startTypewriter, greeting]);

  const handleOnboardingNext = () => {
    resumeAudio();
    playButtonTap();
    if (onboardingStep === 0) {
      setOnboardingStep(1);
    } else {
      setOnboarded();
      setShowOnboarding(false);
    }
  };

  if (!stats) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="rascal-loading">
          <Image
            src="/racoon_mascot.png"
            alt="Loading"
            width={64}
            height={64}
            className="rascal-loading__img"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="pb-24 px-4 pt-4">
      {showOnboarding && (
        <div className="fixed inset-0 z-[100] bg-black/60 flex items-center justify-center p-6">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full animate-bounce-in text-center">
            {onboardingStep === 0 ? (
              <>
                <Rascal size="lg" className="mx-auto mb-4" />
                <h2 className="font-display text-2xl text-txt mb-2">Meet Rascal! 🦝</h2>
                <p className="text-sm text-txt-light font-semibold mb-6">
                  I&apos;m your snarky raccoon cleaning coach. I&apos;ll roast your mess and cheer your wins. Let&apos;s make cleaning fun!
                </p>
                <button onClick={handleOnboardingNext} className="btn-3d btn-green">
                  Nice to meet ya!
                </button>
              </>
            ) : (
              <>
                <div className="text-5xl mb-4">📸✨🪙</div>
                <h2 className="font-display text-2xl text-txt mb-2">How It Works</h2>
                <p className="text-sm text-txt-light font-semibold mb-6">
                   Pick a chore → Collect XP coins in AR → Level up &amp; flex on the leaderboard! 💪
                </p>
                <button onClick={handleOnboardingNext} className="btn-3d btn-green">
                  Let&apos;s go!
                </button>
              </>
            )}
          </div>
        </div>
      )}

      <div className="hero-topbar animate-slide-up">
        <div className="hero-topbar__streak">
          <Flame size={24} className="text-orange" fill="#FF9600" />
          <span className="hero-topbar__streak-count">{stats.streak}</span>
        </div>
        <h1 className="hero-topbar__title">Chorémon</h1>
        <div className="hero-topbar__level">
          Lvl {stats.level}
        </div>
      </div>

      <div className="hero-rascal-section animate-slide-up" style={{ animationDelay: '0.05s' }}>
        <div className="hero-rascal-row">

          <div className="hero-rascal__mascot">
            <Rascal size="xl" animate />
          </div>

          <div className={`hero-speech-bubble ${showBubble ? 'hero-speech-bubble--visible' : ''}`}>
            <div className="hero-speech-bubble__tail" />
            <p className="hero-speech-bubble__text">
              &ldquo;{displayedText}
              {(isTyping || showCursor) && (
                <span className={`hero-speech-bubble__cursor ${!isTyping ? 'hero-speech-bubble__cursor--blink' : ''}`}>|</span>
              )}
              &rdquo;
            </p>
          </div>
        </div>
      </div>

      <div className="hero-xp-section animate-slide-up" style={{ animationDelay: '0.1s' }}>
        <XPBar totalXP={stats.totalXP} level={stats.level} />
      </div>

      <div className="mb-6 animate-slide-up" style={{ animationDelay: '0.15s' }}>
        <Link href="/scan" onClick={() => { resumeAudio(); playButtonTap(); }}>
          <button className="btn-3d btn-green pulse-ring w-full text-lg">
            <Camera size={24} />
            Scan Room
          </button>
        </Link>
      </div>

      {quests.length > 0 && (
        <div className="animate-slide-up" style={{ animationDelay: '0.2s' }}>
          <h3 className="font-display text-lg text-txt mb-3">Active Quests</h3>
          <div className="flex flex-col gap-3">
            {quests.map((quest) => (
              <QuestCard key={quest.id} quest={quest} />
            ))}
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  );
}
