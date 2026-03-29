'use client';

import Image from 'next/image';

interface RascalProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  animate?: boolean;
}

const sizes = {
  sm: { width: 40, height: 40 },
  md: { width: 80, height: 80 },
  lg: { width: 120, height: 120 },
  xl: { width: 160, height: 160 },
};

export default function Rascal({ size = 'md', className = '', animate = false }: RascalProps) {
  const s = sizes[size];

  return (
    <div
      className={`rascal-mascot ${animate ? 'rascal-mascot--animate' : ''} ${className}`}
      style={{ width: s.width, height: s.height }}
    >
      <Image
        src="/racoon_mascot.png"
        alt="Rascal the Raccoon"
        width={s.width}
        height={s.height}
        className="rascal-mascot__img"
        draggable={false}
        priority
      />
    </div>
  );
}
