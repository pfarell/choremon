"use client";
import { useEffect, useRef } from "react";
import { rascalSpeak } from "@/lib/rascalSpeak";
import { getRandomLine } from "@/lib/rascalLines";

export default function RascalGreeting() {
  const fired = useRef(false);

  useEffect(() => {
    if (fired.current) return;
    
    const unlockAudio = () => {
      if (fired.current) return;
      fired.current = true;
      rascalSpeak(getRandomLine("greeting"));
      
      window.removeEventListener('click', unlockAudio);
      window.removeEventListener('touchstart', unlockAudio);
    };

    window.addEventListener('click', unlockAudio);
    window.addEventListener('touchstart', unlockAudio);

    return () => {
      window.removeEventListener('click', unlockAudio);
      window.removeEventListener('touchstart', unlockAudio);
    };
  }, []);

  return null;
}
