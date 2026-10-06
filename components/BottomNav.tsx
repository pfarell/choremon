'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect, useRef } from 'react';

export default function BottomNav() {
  const pathname = usePathname();
  const [pressedTab, setPressedTab] = useState<string | null>(null);
  const [ripple, setRipple] = useState<{ x: number; y: number; id: number } | null>(null);
  const [plusPressed, setPlusPressed] = useState(false);
  const [mounted, setMounted] = useState(false);
  const rippleCounter = useRef(0);

  if (pathname.startsWith('/quest')) return null;

  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const isHome = pathname === '/';
  const isLeaderboard = pathname.startsWith('/leaderboard');
  const isScan = pathname.startsWith('/scan');

  const handleTabPress = (tab: string) => {
    setPressedTab(tab);
    setTimeout(() => setPressedTab(null), 150);
  };

  const handlePlusRipple = (e: React.MouseEvent<HTMLAnchorElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    rippleCounter.current += 1;
    setRipple({ x, y, id: rippleCounter.current });
    setPlusPressed(true);
    setTimeout(() => setPlusPressed(false), 200);
    setTimeout(() => setRipple(null), 600);
  };

  return (
    <nav
      className={`bottom-nav-duo ${mounted ? 'bottom-nav-duo--visible' : ''}`}
      id="bottom-navigation"
    >
      <div className="bottom-nav-duo__inner">
        <div className="bottom-nav-duo__pill">
          <Link
            href="/"
            className={`bottom-nav-duo__tab ${isHome ? 'bottom-nav-duo__tab--active' : ''} ${
              pressedTab === 'home' ? 'bottom-nav-duo__tab--pressed' : ''
            }`}
            onClick={() => handleTabPress('home')}
            id="nav-home"
          >
            <div className={`bottom-nav-duo__icon-wrapper ${isHome ? 'bottom-nav-duo__icon-wrapper--active' : ''}`}>
              <Image
                src="/house_new.png"
                alt="Home"
                width={32}
                height={32}
                className="bottom-nav-duo__icon-img"
                draggable={false}
              />
            </div>
          </Link>

          <Link
            href="/leaderboard"
            className={`bottom-nav-duo__tab ${isLeaderboard ? 'bottom-nav-duo__tab--active' : ''} ${
              pressedTab === 'leaderboard' ? 'bottom-nav-duo__tab--pressed' : ''
            }`}
            onClick={() => handleTabPress('leaderboard')}
            id="nav-leaderboard"
          >
            <div className={`bottom-nav-duo__icon-wrapper ${isLeaderboard ? 'bottom-nav-duo__icon-wrapper--active' : ''}`}>
              <Image
                src="/leaderboard.png"
                alt="Leaderboard"
                width={32}
                height={32}
                className="bottom-nav-duo__icon-img"
                draggable={false}
              />
            </div>
          </Link>
        </div>

        <Link
          href="/scan"
          className={`bottom-nav-duo__plus ${isScan ? 'bottom-nav-duo__plus--active' : ''} ${
            plusPressed ? 'bottom-nav-duo__plus--pressed' : ''
          }`}
          onClick={handlePlusRipple}
          id="nav-scan"
        >
          <div className="bottom-nav-duo__plus-inner">
            <div className="bottom-nav-duo__plus-shine" />
            <svg
              width="28"
              height="28"
              viewBox="0 0 28 28"
              fill="none"
              className="bottom-nav-duo__plus-icon"
            >
              <path
                d="M14 4V24M4 14H24"
                stroke="white"
                strokeWidth="4"
                strokeLinecap="round"
              />
            </svg>
            {ripple && (
              <span
                key={ripple.id}
                className="bottom-nav-duo__ripple"
                style={{ left: ripple.x, top: ripple.y }}
              />
            )}
          </div>
        </Link>
      </div>
    </nav>
  );
}
