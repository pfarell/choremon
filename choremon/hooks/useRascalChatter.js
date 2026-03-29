"use client";
import { useEffect, useRef, useCallback } from "react";
import { rascalSpeak } from "@/lib/rascalSpeak";
import { getRandomLine } from "@/lib/rascalLines";

export function useRascalChatter({ choreType = "general", isActive = false }) {
  const timerRef = useRef(null);

  const speakQuip = useCallback(() => {
    rascalSpeak(getRandomLine(choreType));
  }, [choreType]);

  const scheduleNext = useCallback(() => {
    const delay = Math.random() * 35000 + 25000;
    timerRef.current = setTimeout(() => { speakQuip(); scheduleNext(); }, delay);
  }, [speakQuip]);

  // Idle detection via gyroscope
  useEffect(() => {
    if (!isActive) return;

    let idleTimer = null;

    const resetIdle = () => {
      clearTimeout(idleTimer);
      idleTimer = setTimeout(() => {
        rascalSpeak(getRandomLine("idle"));
      }, 12000);
    };

    const handleMotion = (e) => {
      const { x = 0, y = 0, z = 0 } = e.accelerationIncludingGravity || {};
      if (Math.sqrt(x ** 2 + y ** 2 + z ** 2) > 1.5) resetIdle();
    };

    resetIdle();
    window.addEventListener("devicemotion", handleMotion);
    return () => { window.removeEventListener("devicemotion", handleMotion); clearTimeout(idleTimer); };
  }, [isActive]);

  // Interval commentary
  useEffect(() => {
    if (!isActive) { clearTimeout(timerRef.current); return; }

    const firstDelay = Math.random() * 7000 + 8000;
    timerRef.current = setTimeout(() => { speakQuip(); scheduleNext(); }, firstDelay);

    return () => clearTimeout(timerRef.current);
  }, [isActive, speakQuip, scheduleNext]);

  return { forceQuip: (cat) => rascalSpeak(getRandomLine(cat || choreType)) };
}
