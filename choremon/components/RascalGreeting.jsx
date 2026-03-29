"use client";
import { useEffect, useRef } from "react";
import { rascalSpeak } from "@/lib/rascalSpeak";
import { getRandomLine } from "@/lib/rascalLines";

export default function RascalGreeting() {
  const fired = useRef(false);

  useEffect(() => {
    if (fired.current) return;
    fired.current = true;
    setTimeout(() => rascalSpeak(getRandomLine("greeting")), 1200);
  }, []);

  return null;
}
