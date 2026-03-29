'use client';

import { useEffect, useRef, useState, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Rascal from '@/components/Rascal';
import { CHORE_TYPES } from '@/lib/constants';
import { ChoreType, RascalExpression } from '@/lib/types';
import { playCoinCollect, playQuestComplete, playButtonTap } from '@/lib/sounds';
import { removeActiveQuest } from '@/lib/storage';
import TrashChore from '@/components/TrashChore';
import LaundryChore from '@/components/LaundryChore';

// ===== Sound effects =====
function playDismissSound() {
  try {
    const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const now = ctx.currentTime;
    osc.type = 'sine';
    osc.frequency.setValueAtTime(500, now);
    osc.frequency.exponentialRampToValueAtTime(250, now + 0.15);
    gain.gain.setValueAtTime(0.08, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.15);
  } catch { /* silence */ }
}

// ===== COCO-SSD Category Mappings =====
const TRASH_CLASSES = new Set([
  'bottle', 'wine glass', 'cup', 'fork', 'knife', 'spoon', 'bowl',
  'banana', 'apple', 'sandwich', 'orange', 'broccoli', 'carrot',
  'hot dog', 'pizza', 'donut', 'cake', 'scissors', 'toothbrush',
]);

const LAUNDRY_CLASSES = new Set([
  'backpack', 'umbrella', 'handbag', 'tie', 'suitcase', 'frisbee',
  'sports ball', 'skateboard', 'bottle', 'cup', 'book', 'teddy bear',
  'hair drier', 'toothbrush', 'cell phone', 'remote', 'scissors',
  'vase', 'clock', 'laptop', 'mouse', 'keyboard', 'baseball bat',
  'baseball glove', 'tennis racket', 'surfboard', 'kite',
  'fork', 'knife', 'spoon', 'bowl', 'wine glass',
]);

// ===== Tracked item =====
interface TrackedItem {
  id: string;
  name: string;
  baseClass: string;
  xp: number;
  cleaned: boolean;
  dismissed: boolean;
  missCount: number;
  justCleaned: boolean;
  slidingOut: boolean;
}

type Phase = 'scanning' | 'cleaning';

interface XPPopup {
  id: number;
  xp: number;
  x: number;
  y: number;
}

// ===== Rascal dialogue pools =====
const SCAN_ROASTS: Record<string, string[]> = {
  trash: [
    "Bro the trash can is RIGHT THERE 🦝",
    "I'm a raccoon and even I wouldn't live like this 😬",
    "This floor has more wrappers than a candy factory 🍬",
    "Did a tornado hit or do you just... live like this? 🌪️",
    "My dumpster is cleaner than your room, no cap 🗑️",
  ],
  laundry: [
    "Is that a floor or a clothing store explosion? 🦝",
    "Those clothes have been there so long they pay rent now 🏠",
    "Even I fold my bandana, and I'm a raccoon 🧺",
    "I've seen less fabric at a fashion show 👗",
    "Your floor called, it wants to breathe 😤",
  ],
};

const ITEM_GONE_REACTIONS = [
  (name: string, xp: number) => `YOOO the ${name} is GONE! +${xp} XP! 🎉`,
  (name: string, xp: number) => `${name} has been ELIMINATED! +${xp}! 💥`,
  (name: string, xp: number) => `I blinked and the ${name} vanished! +${xp}! 🦝`,
  (name: string, xp: number) => `Bye bye ${name}! +${xp} XP! 🫡`,
  (name: string, xp: number) => `The ${name} never stood a chance! +${xp}! ⚡`,
];

const NOTHING_CHANGED = [
  "I'm still watching... 👀",
  "Any day now... 🦝",
  "The trash isn't gonna throw itself out! 🤔",
  "Still here. Still judging. 😏",
  "Come on, grab something! 💪",
  "Pick something up! I see you standing there! 🦝",
];

const ALMOST_DONE = [
  (n: number) => `Just ${n} more! You're so close! 🔥`,
  (n: number) => `${n} left! Don't quit now! 💪`,
  (n: number) => `Almost there! ${n} to go! ⚡`,
];

const DISMISS_REACTIONS = [
  (name: string) => `Fine, the ${name} can stay. Your room, your rules 🦝`,
  (name: string) => `Okay okay, I won't judge the ${name}... much 😏`,
  (name: string) => `The ${name} gets a pass THIS time 🦝`,
  (name: string) => `Really? The ${name}?? If you say so... 🙄`,
  (name: string) => `Alright, ${name} is NOT trash. My bad! 🦝`,
];

const MANUAL_CLEAN_REACTIONS = [
  (name: string, xp: number) => `Nice! ${name} eliminated! +${xp} XP! 💪`,
  (name: string, xp: number) => `Bye bye ${name}! +${xp} XP! 🎉`,
  (name: string, xp: number) => `${name} has left the building! 🦝`,
  (name: string, xp: number) => `That ${name} never stood a chance! +${xp}! ⚡`,
];

// Helper to pick random from array
let lastIndices: Record<string, number> = {};
function pickRandom<T>(arr: T[], pool: string): T {
  let idx = Math.floor(Math.random() * arr.length);
  if (arr.length > 1 && idx === (lastIndices[pool] || -1)) {
    idx = (idx + 1) % arr.length;
  }
  lastIndices[pool] = idx;
  return arr[idx];
}

// Prettify COCO class name for display
function prettifyClassName(cls: string): string {
  const names: Record<string, string> = {
    'bottle': '🍾 Bottle',
    'wine glass': '🍷 Wine Glass',
    'cup': '☕ Cup',
    'fork': '🍴 Fork',
    'knife': '🔪 Knife',
    'spoon': '🥄 Spoon',
    'bowl': '🥣 Bowl',
    'banana': '🍌 Banana',
    'apple': '🍎 Apple',
    'sandwich': '🥪 Sandwich',
    'orange': '🍊 Orange',
    'broccoli': '🥦 Broccoli',
    'carrot': '🥕 Carrot',
    'hot dog': '🌭 Hot Dog',
    'pizza': '🍕 Pizza',
    'donut': '🍩 Donut',
    'cake': '🎂 Cake',
    'scissors': '✂️ Scissors',
    'toothbrush': '🪥 Toothbrush',
    'backpack': '🎒 Backpack',
    'umbrella': '☂️ Umbrella',
    'handbag': '👜 Handbag',
    'tie': '👔 Tie',
    'suitcase': '🧳 Suitcase',
    'frisbee': '🥏 Frisbee',
    'sports ball': '⚽ Sports Ball',
    'skateboard': '🛹 Skateboard',
    'book': '📚 Book',
    'teddy bear': '🧸 Teddy Bear',
    'hair drier': '💨 Hair Dryer',
    'cell phone': '📱 Cell Phone',
    'remote': '📺 Remote',
    'vase': '🏺 Vase',
    'clock': '🕐 Clock',
    'laptop': '💻 Laptop',
    'mouse': '🖱️ Mouse',
    'keyboard': '⌨️ Keyboard',
    'baseball bat': '🏏 Baseball Bat',
    'baseball glove': '🥊 Baseball Glove',
    'tennis racket': '🎾 Tennis Racket',
    'surfboard': '🏄 Surfboard',
    'kite': '🪁 Kite',
  };
  return names[cls] || cls.charAt(0).toUpperCase() + cls.slice(1);
}

function LiveQuestContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const choreType = (searchParams.get('choreType') as ChoreType) || 'trash';

  // === Refs ===
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const pollRef = useRef<NodeJS.Timeout | null>(null);
  const popupIdRef = useRef(0);
  const itemsRef = useRef<TrackedItem[]>([]);
  const xpEarnedRef = useRef(0);
  const allDoneHandledRef = useRef(false);
  const isFirstScan = useRef(true);
  const firstScanClasses = useRef<Map<string, number> | null>(null);
  const scanningRef = useRef(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const modelRef = useRef<any>(null);

  // === State ===
  const [phase, setPhase] = useState<Phase>('scanning');
  const [modelReady, setModelReady] = useState(false);
  const [items, setItems] = useState<TrackedItem[]>([]);
  const [seconds, setSeconds] = useState(0);
  const [xpEarned, setXpEarned] = useState(0);
  const [coinsCollected, setCoinsCollected] = useState(0);
  const [rascalMessage, setRascalMessage] = useState("Loading AI vision model... 🧠");
  const [rascalBounce, setRascalBounce] = useState(false);
  const [xpPopups, setXpPopups] = useState<XPPopup[]>([]);
  const [scanError, setScanError] = useState('');
  const [expandedItemId, setExpandedItemId] = useState<string | null>(null);
  const [pollCount, setPollCount] = useState(0);

  const choreInfo = CHORE_TYPES.find((c: { id: string }) => c.id === choreType);
  const choreLabel = choreType === 'laundry' ? 'laundry' : 'trash';

  // Sync state → refs
  useEffect(() => { itemsRef.current = items; }, [items]);

  // ===== Bounce Rascal =====
  const bounceRascal = useCallback((msg: string) => {
    setRascalMessage(msg);
    setRascalBounce(true);
    setTimeout(() => setRascalBounce(false), 600);
  }, []);

  // ===== Show XP popup =====
  const showXPPopup = useCallback((xp: number) => {
    const popupId = ++popupIdRef.current;
    setXpPopups(prev => [...prev, {
      id: popupId, xp,
      x: 30 + Math.random() * 40,
      y: 30 + Math.random() * 30,
    }]);
    setTimeout(() => {
      setXpPopups(prev => prev.filter(p => p.id !== popupId));
    }, 1500);
  }, []);

  // ===== Timer =====
  useEffect(() => {
    if (phase !== 'cleaning') return;
    timerRef.current = setInterval(() => setSeconds(s => s + 1), 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [phase]);

  // ===== Finish Quest =====
  const finishQuest = useCallback(() => {
    if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
    if (timerRef.current) clearInterval(timerRef.current);
    if (pollRef.current) clearInterval(pollRef.current);

    const questId = searchParams.get('questId');
    if (questId) {
      removeActiveQuest(questId);
    }

    const currentItems = itemsRef.current;
    const cleanedCount = currentItems.filter(i => i.cleaned).length;
    const totalActive = currentItems.filter(i => !i.dismissed).length;

    localStorage.setItem('choremon-last-quest', JSON.stringify({
      choreType,
      coinsCollected: cleanedCount,
      totalCoins: totalActive,
      xpEarned: xpEarnedRef.current,
      timeSeconds: seconds,
    }));

    router.push('/quest/complete');
  }, [choreType, seconds, router]);

  // ===== Core: Real-time COCO-SSD detection =====
  const scanFrame = useCallback(async () => {
    if (scanningRef.current || !modelRef.current) return;
    scanningRef.current = true;

    try {
      const video = videoRef.current;
      if (!video || video.paused || video.readyState < 2) return;

      // Run COCO-SSD on the video element directly
      const predictions = await modelRef.current.detect(video);

      // Filter by category + confidence
      const categoryClasses = choreType === 'laundry' ? LAUNDRY_CLASSES : TRASH_CLASSES;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const relevant = predictions.filter((p: any) =>
        p.score > 0.4 && categoryClasses.has(p.class)
      );

      // Group by class name and count
      const classCounts = new Map<string, number>();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      for (const p of relevant) {
        classCounts.set(p.class, (classCounts.get(p.class) || 0) + 1);
      }

      // Build display names
      const currentItems: { name: string; baseClass: string }[] = [];
      Array.from(classCounts.entries()).forEach(([cls, count]) => {
        const pretty = prettifyClassName(cls);
        if (count === 1) {
          currentItems.push({ name: pretty, baseClass: cls });
        } else {
          for (let i = 1; i <= count; i++) {
            currentItems.push({ name: `${pretty} #${i}`, baseClass: cls });
          }
        }
      });

      setPollCount(c => c + 1);

      // ---- FIRST SCAN: establish item list with confirmation ----
      if (isFirstScan.current) {
        if (currentItems.length === 0) return;

        // First time seeing items — store class counts but DON'T commit yet
        if (!firstScanClasses.current) {
          firstScanClasses.current = new Map(classCounts);
          return; // Wait for second scan to confirm
        }

        // Second scan — only keep classes that appear in BOTH scans
        const confirmedClasses = new Map<string, number>();
        Array.from(classCounts.entries()).forEach(([cls, count]) => {
          const prevCount = firstScanClasses.current!.get(cls);
          if (prevCount !== undefined) {
            confirmedClasses.set(cls, Math.min(count, prevCount));
          }
        });

        if (confirmedClasses.size === 0) {
          firstScanClasses.current = new Map(classCounts); // Try again
          return;
        }

        isFirstScan.current = false;
        firstScanClasses.current = null;

        // Build confirmed items list
        const confirmedItems: { name: string; baseClass: string }[] = [];
        Array.from(confirmedClasses.entries()).forEach(([cls, count]) => {
          const pretty = prettifyClassName(cls);
          if (count === 1) {
            confirmedItems.push({ name: pretty, baseClass: cls });
          } else {
            for (let i = 1; i <= count; i++) {
              confirmedItems.push({ name: `${pretty} #${i}`, baseClass: cls });
            }
          }
        });

        const trackedItems: TrackedItem[] = confirmedItems.map((item, i) => ({
          id: `item-${i}-${Date.now()}`,
          name: item.name,
          baseClass: item.baseClass,
          xp: 10 + Math.floor(Math.random() * 21), // 10-30 XP
          cleaned: false,
          dismissed: false,
          missCount: 0,
          justCleaned: false,
          slidingOut: false,
        }));

        itemsRef.current = trackedItems;
        setItems(trackedItems);

        // Show roast
        const roasts = SCAN_ROASTS[choreType] || SCAN_ROASTS.trash;
        bounceRascal(pickRandom(roasts, 'roast'));

        // Transition to cleaning phase
        setTimeout(() => setPhase('cleaning'), 2500);
        return;
      }

      // ---- SUBSEQUENT SCANS: class-count-based diff ----
      const prevItems = itemsRef.current;
      let changed = false;
      let newXP = 0;
      const cleanedNames: { name: string; xp: number }[] = [];

      // Group active tracked items by base class
      const activeByClass = new Map<string, TrackedItem[]>();
      for (const item of prevItems) {
        if (item.cleaned || item.dismissed) continue;
        const cls = item.baseClass;
        if (!activeByClass.has(cls)) activeByClass.set(cls, []);
        activeByClass.get(cls)!.push(item);
      }

      // Determine which items are missing
      const missingItemIds = new Set<string>();
      Array.from(activeByClass.entries()).forEach(([cls, activeItems]) => {
        const detectedCount = classCounts.get(cls) || 0;
        if (detectedCount >= activeItems.length) return; // all visible

        // Sort by missCount desc — items already tracked as missing get priority
        const sorted = [...activeItems].sort((a, b) => b.missCount - a.missCount);
        const missingCount = activeItems.length - detectedCount;
        for (let i = 0; i < missingCount; i++) {
          missingItemIds.add(sorted[i].id);
        }
      });

      // Update all items
      const updatedItems = prevItems.map(item => {
        if (item.cleaned || item.dismissed) return { ...item, justCleaned: false };

        if (missingItemIds.has(item.id)) {
          const newMissCount = item.missCount + 1;
          if (newMissCount >= 4) {
            // CONFIRMED GONE — award XP
            changed = true;
            newXP += item.xp;
            cleanedNames.push({ name: item.name, xp: item.xp });
            return { ...item, cleaned: true, missCount: newMissCount, justCleaned: true };
          }
          return { ...item, missCount: newMissCount, justCleaned: false };
        }

        return { ...item, missCount: 0, justCleaned: false };
      });

      itemsRef.current = updatedItems;
      setItems(updatedItems);

      if (changed) {
        xpEarnedRef.current += newXP;
        setXpEarned(xpEarnedRef.current);
        setCoinsCollected(c => c + cleanedNames.length);

        playCoinCollect();
        if (navigator.vibrate) navigator.vibrate(40);
        cleanedNames.forEach(c => {
          showXPPopup(c.xp);
          const fn = pickRandom(ITEM_GONE_REACTIONS, 'gone');
          bounceRascal(fn(c.name, c.xp));
        });

        // Clear justCleaned after animation
        setTimeout(() => {
          const cleared = itemsRef.current.map(i => ({ ...i, justCleaned: false }));
          itemsRef.current = cleared;
          setItems(cleared);
        }, 1200);

        // Check if all done
        const activeRemaining = updatedItems.filter(i => !i.cleaned && !i.dismissed).length;
        if (activeRemaining === 0 && !allDoneHandledRef.current) {
          allDoneHandledRef.current = true;
          bounceRascal("SPOTLESS! You absolute legend! 🏆🦝");
          playQuestComplete();
          setTimeout(() => finishQuest(), 2500);
        } else if (activeRemaining <= 2 && activeRemaining > 0) {
          setTimeout(() => {
            const fn = pickRandom(ALMOST_DONE, 'almost');
            bounceRascal(fn(activeRemaining));
          }, 1500);
        }
      }
    } catch (err) {
      console.error('Detection error:', err);
    } finally {
      scanningRef.current = false;
    }
  }, [choreType, bounceRascal, showXPPopup, finishQuest]);

  // ===== SETUP: Camera + COCO-SSD Model =====
  useEffect(() => {
    let cancelled = false;

    async function setup() {
      // 1. Start camera
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment', width: { ideal: 640 }, height: { ideal: 480 } }
        });
        if (cancelled) { stream.getTracks().forEach(t => t.stop()); return; }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
        }
      } catch {
        setScanError('Camera access denied. Please allow camera permissions.');
        return;
      }

      // 2. Load COCO-SSD model
      try {
        await import('@tensorflow/tfjs');
        const cocoSsd = await import('@tensorflow-models/coco-ssd');
        if (cancelled) return;

        const model = await cocoSsd.load();
        if (cancelled) return;

        modelRef.current = model;
        setModelReady(true);
        setRascalMessage("Rascal is scanning your room... 🦝");

        // Start detection loop
        setTimeout(() => {
          scanFrame();
          pollRef.current = setInterval(scanFrame, 800);
        }, 500);
      } catch (err) {
        console.error('Model load error:', err);
        setScanError('Failed to load AI detection model. Please refresh.');
      }
    }

    setup();

    return () => {
      cancelled = true;
      if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ===== Dismiss item =====
  const handleDismiss = useCallback((itemId: string) => {
    const item = itemsRef.current.find(i => i.id === itemId);
    if (!item) return;

    playDismissSound();
    bounceRascal(pickRandom(DISMISS_REACTIONS, 'dismiss')(item.name));

    // Slide out animation
    const updated = itemsRef.current.map(i =>
      i.id === itemId ? { ...i, slidingOut: true } : i
    );
    itemsRef.current = updated;
    setItems(updated);
    setExpandedItemId(null);

    setTimeout(() => {
      const dismissed = itemsRef.current.map(i =>
        i.id === itemId ? { ...i, dismissed: true, slidingOut: false } : i
      );
      itemsRef.current = dismissed;
      setItems(dismissed);

      const activeRemaining = dismissed.filter(i => !i.cleaned && !i.dismissed).length;
      if (activeRemaining === 0 && !allDoneHandledRef.current) {
        allDoneHandledRef.current = true;
        bounceRascal("SPOTLESS! You absolute legend! 🏆🦝");
        playQuestComplete();
        setTimeout(() => finishQuest(), 2500);
      }
    }, 400);
  }, [bounceRascal, finishQuest]);

  // ===== Manual clean =====
  const handleManualClean = useCallback((itemId: string) => {
    const item = itemsRef.current.find(i => i.id === itemId);
    if (!item) return;

    playCoinCollect();
    bounceRascal(pickRandom(MANUAL_CLEAN_REACTIONS, 'manual')(item.name, item.xp));

    xpEarnedRef.current += item.xp;
    setXpEarned(xpEarnedRef.current);
    setCoinsCollected(c => c + 1);
    showXPPopup(item.xp);

    const updated = itemsRef.current.map(i =>
      i.id === itemId ? { ...i, cleaned: true, justCleaned: true } : i
    );
    itemsRef.current = updated;
    setItems(updated);
    setExpandedItemId(null);

    setTimeout(() => {
      const cleared = itemsRef.current.map(i =>
        i.id === itemId ? { ...i, justCleaned: false } : i
      );
      itemsRef.current = cleared;
      setItems(cleared);
    }, 1200);

    const activeRemaining = updated.filter(i => !i.cleaned && !i.dismissed).length;
    if (activeRemaining === 0 && !allDoneHandledRef.current) {
      allDoneHandledRef.current = true;
      bounceRascal("SPOTLESS! You absolute legend! 🏆🦝");
      playQuestComplete();
      setTimeout(() => finishQuest(), 2500);
    }
  }, [bounceRascal, showXPPopup, finishQuest]);

  // ===== Toggle item expanded =====
  const handleItemTap = (itemId: string) => {
    playButtonTap();
    setExpandedItemId(prev => prev === itemId ? null : itemId);
  };

  // ===== Retry =====
  const handleRetry = () => {
    setScanError('');
    setPhase('scanning');
    isFirstScan.current = true;
    firstScanClasses.current = null;
    setRascalMessage("Loading AI vision model... 🧠");
  };

  // ===== Format time =====
  const formatTime = (s: number) => {
    const min = Math.floor(s / 60).toString().padStart(2, '0');
    const sec = (s % 60).toString().padStart(2, '0');
    return `${min}:${sec}`;
  };

  // ===== Computed =====
  const activeItems = items.filter(i => !i.dismissed);
  const totalActive = activeItems.length;
  const cleanedCount = activeItems.filter(i => i.cleaned).length;
  const progress = totalActive > 0 ? cleanedCount / totalActive : 0;
  const totalXP = activeItems.reduce((sum, i) => sum + i.xp, 0);
  const remainingCount = totalActive - cleanedCount;
  const visibleItems = items.filter(i => !i.dismissed);

  // Rascal expression
  let rascalExpr: RascalExpression = 'thinking';
  if (phase === 'scanning') rascalExpr = 'thinking';
  else if (progress === 0) rascalExpr = 'disappointed';
  else if (progress < 0.5) rascalExpr = 'encouraging';
  else if (progress < 1) rascalExpr = 'roasting';
  else rascalExpr = 'celebrating';

  return (
    <div className="fixed inset-0 bg-black overflow-hidden select-none">
      {/* Camera feed */}
      <video
        ref={videoRef}
        className="absolute inset-0 w-full h-full object-cover"
        playsInline muted autoPlay
      />

      {/* PHASE 1: Scanning overlay */}
      {phase === 'scanning' && !scanError && (
        <div className="absolute inset-0 z-40">
          <div className="scan-line" />
          <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center">
            <div className="animate-bounce-in text-center px-6">
              <Rascal size="lg" className="mx-auto mb-4" />
              <h2 className="text-white font-display text-2xl mb-2"
                style={{ textShadow: '0 2px 8px rgba(0,0,0,0.5)' }}>
                {!modelReady ? 'Loading AI Vision...' : 'Rascal is scanning your room...'}
              </h2>
              <p className="text-white/70 text-sm font-semibold">
                {!modelReady ? (
                  '🧠 Loading TensorFlow.js detection model...'
                ) : (
                  <>{choreInfo?.emoji} Looking for {choreType === 'laundry' ? 'stuff to pick up' : 'trash items'}</>
                )}
              </p>
              {!modelReady && (
                <div className="mt-4 flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  <span className="text-white/50 text-xs font-semibold">This takes a few seconds...</span>
                </div>
              )}
              {modelReady && pollCount > 0 && items.length === 0 && (
                <p className="text-white/50 text-xs font-semibold mt-3 animate-pulse">
                  Still scanning... try pointing at objects 📷
                </p>
              )}
            </div>
          </div>

          {/* Item discovery overlay */}
          {items.length > 0 && (
            <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center z-50 px-4">
              <div className="frosted rounded-2xl p-5 max-w-sm w-full animate-bounce-in">
                <div className="flex items-center gap-3 mb-3">
                  <Rascal size="sm" />
                  <p className="text-sm font-bold text-txt flex-1">{rascalMessage}</p>
                </div>
                <div className="border-t border-gray-200 pt-3 mb-3">
                  <p className="text-xs font-bold text-txt-light uppercase mb-2">
                    Found {items.length} items — start cleaning, I&apos;ll watch!
                  </p>
                  {items.map(item => (
                    <div key={item.id} className="flex items-center gap-2 py-1">
                      <span className="text-sm font-semibold text-txt">{item.name}</span>
                      <span className="ml-auto text-xs font-bold text-gold">+{item.xp}</span>
                    </div>
                  ))}
                </div>
                <p className="text-center text-xs font-semibold animate-pulse" style={{ color: '#58CC02' }}>
                  ⚡ Going live in a moment — just clean, I&apos;ll detect it!
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Scan Error */}
      {scanError && (
        <div className="absolute inset-0 z-50 bg-black/60 flex items-center justify-center px-4">
          <div className="frosted rounded-2xl p-6 max-w-sm w-full text-center animate-bounce-in">
            <Rascal size="lg" className="mx-auto mb-4" />
            <p className="text-sm font-bold text-txt mb-4">{scanError}</p>
            <button onClick={handleRetry} className="btn-3d btn-green">Try Again</button>
          </div>
        </div>
      )}

      {/* PHASE 2: LIVE CLEANING MODE */}
      {phase === 'cleaning' && (
        <>
          {/* Top HUD */}
          <div className="absolute top-0 left-0 right-0 z-30">
            <div className="frosted px-4 py-3 border-b border-white/10">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{choreInfo?.emoji}</span>
                  <span className="font-bold text-sm text-txt">{choreInfo?.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="live-badge">
                    <span className="live-dot" />
                    LIVE
                  </div>
                  <span className="font-bold text-sm text-gold">⭐ {xpEarned}</span>
                  <span className="font-bold text-sm text-txt font-mono">{formatTime(seconds)}</span>
                </div>
              </div>
              <div className="w-full">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-bold text-txt-light">
                    {cleanedCount}/{totalActive} cleaned
                  </span>
                  <span className="text-[10px] font-bold text-txt-light">
                    {xpEarned}/{totalXP} XP
                  </span>
                </div>
                <div className="xp-bar-track" style={{ height: '8px' }}>
                  <div className="xp-bar-fill" style={{ width: `${progress * 100}%` }} />
                </div>
              </div>
            </div>
          </div>

          {/* Item checklist */}
          <div className="absolute top-[110px] right-2 z-30 flex flex-col gap-1.5 max-h-[50vh] overflow-y-auto no-scrollbar w-[200px]">
            {visibleItems.map(item => (
              <div
                key={item.id}
                className={`
                  rounded-xl overflow-hidden transition-all duration-300
                  ${item.slidingOut ? 'opacity-0 translate-x-[200px]' : 'opacity-100 translate-x-0'}
                  ${item.cleaned
                    ? 'bg-green-500/90 border border-green-400'
                    : 'bg-white/85 border border-white/40'
                  }
                  ${item.justCleaned ? 'ring-2 ring-yellow-400 shadow-[0_0_24px_rgba(255,215,0,0.7)]' : 'shadow-md'}
                `}
                style={{ backdropFilter: 'blur(8px)' }}
              >
                <button
                  onClick={() => !item.cleaned && handleItemTap(item.id)}
                  className="w-full flex items-center gap-2 px-2.5 py-2 text-left"
                  disabled={item.cleaned}
                >
                  <span className="text-sm flex-shrink-0">
                    {item.cleaned ? '✅' : item.missCount >= 1 ? '👀' : ''}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className={`text-[11px] font-bold leading-tight ${item.cleaned ? 'text-white line-through' : 'text-gray-800'}`}>
                      {item.name}
                    </div>
                    {!item.cleaned && item.missCount >= 1 && (
                      <div className="text-[9px] text-orange-500 font-bold">detecting... ({item.missCount}/4)</div>
                    )}
                  </div>
                  <span className={`text-[10px] font-bold flex-shrink-0 ${item.cleaned ? 'text-white' : 'text-amber-600'}`}>
                    {item.cleaned ? '✓' : `+${item.xp}`}
                  </span>
                </button>

                {expandedItemId === item.id && !item.cleaned && (
                  <div className="flex gap-1.5 px-2 pb-2 animate-slide-up">
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDismiss(item.id); }}
                      className="flex-1 py-1.5 px-2 rounded-lg bg-gray-100 hover:bg-gray-200
                        text-[10px] font-bold text-gray-600 transition-colors active:scale-95"
                    >
                      🚫 Not {choreLabel}!
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleManualClean(item.id); }}
                      className="flex-1 py-1.5 px-2 rounded-lg bg-green-100 hover:bg-green-200
                        text-[10px] font-bold text-green-700 transition-colors active:scale-95"
                    >
                      ✅ Done!
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Tracking indicator */}
          {pollCount > 0 && (
            <div className="absolute top-[110px] left-3 z-30">
              <div className="bg-black/40 rounded-lg px-2.5 py-1.5 flex items-center gap-1.5"
                style={{ backdropFilter: 'blur(8px)' }}>
                <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                <span className="text-[9px] font-bold text-white/80">
                  🤖 AI • Scan #{pollCount}
                </span>
              </div>
            </div>
          )}

          {/* XP Popups */}
          {xpPopups.map(popup => (
            <div
              key={popup.id}
              className="xp-float"
              style={{ left: `${popup.x}%`, top: `${popup.y}%` }}
            >
              +{popup.xp} XP
            </div>
          ))}

          {/* Bottom HUD */}
          <div className="absolute bottom-0 left-0 right-0 z-30 p-3">
            <div className="frosted rounded-2xl p-3 border border-white/10">
              <div className={`flex items-center gap-3 mb-2 transition-transform ${rascalBounce ? 'scale-105' : 'scale-100'}`}>
                <Rascal size="sm" />
                <div className="flex-1">
                  <p className="text-sm font-bold text-txt">{rascalMessage}</p>
                  {remainingCount > 0 && (
                    <p className="text-[10px] text-txt-light font-semibold mt-0.5">
                      🤖 Real-time AI detection • Tap items for manual options
                    </p>
                  )}
                </div>
              </div>
              <button
                onClick={finishQuest}
                className={`btn-3d w-full ${cleanedCount > 0 ? 'btn-green' : 'btn-coral'}`}
              >
                {remainingCount === 0
                  ? '🏆 QUEST COMPLETE!'
                  : cleanedCount > 0
                    ? `✨ Finish Quest (${cleanedCount}/${totalActive})`
                    : '🚪 End Quest'
                }
              </button>
            </div>
          </div>
        </>
      )}

      <style jsx>{`
        .live-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: rgba(255, 75, 75, 0.15);
          color: #FF4B4B;
          padding: 4px 10px;
          border-radius: 99px;
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 0.5px;
        }
        .live-dot {
          width: 8px;
          height: 8px;
          background: #FF4B4B;
          border-radius: 50%;
          animation: livePulse 1.5s infinite;
        }
        @keyframes livePulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(0.8); }
        }
      `}</style>
    </div>
  );
}

function LiveQuestRouter() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const choreType = (searchParams.get('choreType') as ChoreType) || 'trash';
  const questId = searchParams.get('questId');
  const startTime = useRef(Date.now());

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleComplete = (stats: any) => {
    if (questId) {
      removeActiveQuest(questId);
    }
    const timeSeconds = Math.floor((Date.now() - startTime.current) / 1000);
    localStorage.setItem('choremon-last-quest', JSON.stringify({
      choreType,
      coinsCollected: stats.coinsCollected,
      totalCoins: stats.totalCoins,
      xpEarned: stats.xpEarned,
      timeSeconds,
    }));
    router.push('/quest/complete');
  };

  if (choreType === 'trash') {
    return <TrashChore onComplete={handleComplete} onXPEarned={() => {}} />;
  }

  if (choreType === 'laundry') {
    return <LaundryChore onComplete={handleComplete} onXPEarned={() => {}} />;
  }

  return <LiveQuestContent />;
}

export default function LiveQuestPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen bg-black">
          <div className="animate-spin-slow text-4xl">🦝</div>
        </div>
      }
    >
      <LiveQuestRouter />
    </Suspense>
  );
}
