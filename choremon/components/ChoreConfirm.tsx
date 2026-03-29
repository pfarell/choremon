'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { ChoreType } from '@/lib/types';
import { CHORE_TYPES } from '@/lib/constants';

interface ChoreConfirmProps {
  choreType: ChoreType;
  onNow: () => void;
  onLater: () => void;
}

const MASCOT_MAP: Record<ChoreType, string> = {
  trash: '/trash.png',
  laundry: '/laundry.png',
  mop: '/mop.png',
  vacuum: '/vacuum.png',
};

const CHORE_MESSAGES: Record<ChoreType, { title: string; subtitle: string }> = {
  trash: {
    title: 'Take out the trash time!',
    subtitle: "Don't let it pile up, a quick task for a cleaner space",
  },
  laundry: {
    title: 'Laundry day, hero!',
    subtitle: 'Sort, wash & fold — earn XP while you tidy up',
  },
  mop: {
    title: 'Mop & sparkle time!',
    subtitle: 'Surfaces need love too. Wipe it all down!',
  },
  vacuum: {
    title: 'Vacuum quest awaits!',
    subtitle: 'Those floors won\'t clean themselves. Let\'s go!',
  },
};

export default function ChoreConfirm({ choreType, onNow, onLater }: ChoreConfirmProps) {
  const [visible, setVisible] = useState(false);
  const [mascotIn, setMascotIn] = useState(false);
  const [textIn, setTextIn] = useState(false);
  const [buttonsIn, setButtonsIn] = useState(false);
  const [nowPressed, setNowPressed] = useState(false);
  const [laterPressed, setLaterPressed] = useState(false);
  const [leaving, setLeaving] = useState(false);

  const choreInfo = CHORE_TYPES.find(c => c.id === choreType);
  const mascotSrc = MASCOT_MAP[choreType] || '/racoon_mascot.png';
  const messages = CHORE_MESSAGES[choreType];

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));
    const t1 = setTimeout(() => setMascotIn(true), 150);
    const t2 = setTimeout(() => setTextIn(true), 400);
    const t3 = setTimeout(() => setButtonsIn(true), 600);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, []);

  const handleNow = useCallback(() => {
    setNowPressed(true);
    setTimeout(() => {
      setNowPressed(false);
      setLeaving(true);
      setTimeout(onNow, 350);
    }, 180);
  }, [onNow]);

  const handleLater = useCallback(() => {
    setLaterPressed(true);
    setTimeout(() => {
      setLaterPressed(false);
      setLeaving(true);
      setTimeout(onLater, 350);
    }, 180);
  }, [onLater]);

  return (
    <div className={`chore-confirm-overlay ${visible ? 'chore-confirm-overlay--visible' : ''} ${leaving ? 'chore-confirm-overlay--leaving' : ''}`}>
      <div className="chore-confirm-card">
        <div className={`chore-confirm-mascot ${mascotIn ? 'chore-confirm-mascot--in' : ''}`}>
          <Image
            src={mascotSrc}
            alt={`${choreInfo?.name || 'Chore'} raccoon`}
            width={280}
            height={280}
            className="chore-confirm-mascot__img"
            priority
            draggable={false}
          />
        </div>

        <div className={`chore-confirm-text ${textIn ? 'chore-confirm-text--in' : ''}`}>
          <h2 className="chore-confirm-text__title">{messages.title}</h2>
          <p className="chore-confirm-text__subtitle">{messages.subtitle}</p>
        </div>

        <div className={`chore-confirm-buttons ${buttonsIn ? 'chore-confirm-buttons--in' : ''}`}>
          <button
            className={`chore-confirm-btn chore-confirm-btn--now ${nowPressed ? 'chore-confirm-btn--pressed' : ''}`}
            onClick={handleNow}
            onTouchStart={() => setNowPressed(true)}
            onTouchEnd={() => setNowPressed(false)}
            onMouseDown={() => setNowPressed(true)}
            onMouseUp={() => setNowPressed(false)}
            onMouseLeave={() => setNowPressed(false)}
          >
            <span className="chore-confirm-btn__shine" />
            <span className="chore-confirm-btn__label">Now</span>
          </button>

          <button
            className={`chore-confirm-btn chore-confirm-btn--later ${laterPressed ? 'chore-confirm-btn--pressed' : ''}`}
            onClick={handleLater}
            onTouchStart={() => setLaterPressed(true)}
            onTouchEnd={() => setLaterPressed(false)}
            onMouseDown={() => setLaterPressed(true)}
            onMouseUp={() => setLaterPressed(false)}
            onMouseLeave={() => setLaterPressed(false)}
          >
            <span className="chore-confirm-btn__label">Do It Later</span>
          </button>
        </div>
      </div>
    </div>
  );
}
