import { isMuted } from './storage';

let audioCtx: AudioContext | null = null;

function getCtx(): AudioContext {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
  }
  return audioCtx;
}

function playNote(frequency: number, duration: number, startTime: number, volume = 0.1) {
  if (isMuted()) return;
  const ctx = getCtx();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  
  osc.type = 'sine';
  osc.frequency.value = frequency;
  gain.gain.value = volume;
  gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
  
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(startTime);
  osc.stop(startTime + duration);
}

// Coin collect: C5→E5→G5 ascending chime
export function playCoinCollect() {
  if (isMuted()) return;
  const ctx = getCtx();
  const now = ctx.currentTime;
  playNote(523.25, 0.1, now);       // C5
  playNote(659.25, 0.1, now + 0.1); // E5
  playNote(783.99, 0.15, now + 0.2); // G5
}

// Quest complete fanfare: C5→E5→G5→C6
export function playQuestComplete() {
  if (isMuted()) return;
  const ctx = getCtx();
  const now = ctx.currentTime;
  playNote(523.25, 0.15, now, 0.12);
  playNote(659.25, 0.15, now + 0.15, 0.12);
  playNote(783.99, 0.15, now + 0.3, 0.12);
  playNote(1046.5, 0.3, now + 0.45, 0.15);
}

// Button tap: short soft click
export function playButtonTap() {
  if (isMuted()) return;
  const ctx = getCtx();
  const now = ctx.currentTime;
  playNote(800, 0.05, now, 0.05);
}

// Level up: extended fanfare C4→E4→G4→C5→E5→G5
export function playLevelUp() {
  if (isMuted()) return;
  const ctx = getCtx();
  const now = ctx.currentTime;
  playNote(261.63, 0.12, now, 0.1);
  playNote(329.63, 0.12, now + 0.12, 0.1);
  playNote(392.0, 0.12, now + 0.24, 0.1);
  playNote(523.25, 0.12, now + 0.36, 0.12);
  playNote(659.25, 0.12, now + 0.48, 0.12);
  playNote(783.99, 0.25, now + 0.6, 0.15);
}

// Scan start: descending sweep
export function playScanStart() {
  if (isMuted()) return;
  const ctx = getCtx();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  const now = ctx.currentTime;
  
  osc.type = 'sine';
  osc.frequency.setValueAtTime(800, now);
  osc.frequency.exponentialRampToValueAtTime(400, now + 0.3);
  gain.gain.setValueAtTime(0.1, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
  
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(now);
  osc.stop(now + 0.3);
}

// Resume AudioContext after user gesture (needed for Safari)
export function resumeAudio() {
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
}
