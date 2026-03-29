'use client';

import { useEffect, useState } from 'react';

interface CoinMarkerProps {
  x: number; // percentage 0-100
  y: number; // percentage 0-100
  xp: number;
  index: number;
  collected: boolean;
}

export default function CoinMarker({ x, y, xp, collected }: CoinMarkerProps) {
  const [showXP, setShowXP] = useState(false);
  const [wasCollected, setWasCollected] = useState(false);

  useEffect(() => {
    if (collected && !wasCollected) {
      setWasCollected(true);
      setShowXP(true);
      // Haptic feedback
      if (navigator.vibrate) navigator.vibrate(50);
      setTimeout(() => setShowXP(false), 1200);
    }
  }, [collected, wasCollected]);

  if (wasCollected && !showXP) return null;

  return (
    <>
      <div
        className={`coin-sm ${wasCollected ? 'coin-collected' : ''}`}
        style={{ left: `${x}%`, top: `${y}%` }}
      >
        {xp > 20 ? xp : ''}
      </div>

      {showXP && (
        <div
          className="xp-float"
          style={{ left: `${x}%`, top: `${y}%`, transform: 'translate(-50%, -50%)' }}
        >
          +{xp}
        </div>
      )}
    </>
  );
}
