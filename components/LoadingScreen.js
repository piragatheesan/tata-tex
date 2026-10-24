'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';

const DISPLAY_MS = 1200;
const FADE_MS = 250;

export default function LoadingScreen() {
  const [phase, setPhase] = useState('waiting');
  const pathname = usePathname();

  useEffect(() => {
    // Error recovery links should be available immediately.
    if (pathname !== '/' || document.querySelector('[data-not-found]')) return;
    try {
      if (sessionStorage.getItem('tatatex-intro-seen')) return;
      sessionStorage.setItem('tatatex-intro-seen', '1');
    } catch {}
    const previousOverflow = document.body.style.overflow;
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reducedMotion) return;
    const duration = DISPLAY_MS;
    setPhase('show');
    document.body.style.overflow = 'hidden';
    const displayTimer = window.setTimeout(() => setPhase('leave'), duration);
    const finishTimer = window.setTimeout(() => {
      setPhase('gone');
      document.body.style.overflow = previousOverflow;
    }, duration + FADE_MS);
    return () => {
      window.clearTimeout(displayTimer);
      window.clearTimeout(finishTimer);
      document.body.style.overflow = previousOverflow;
    };
  }, [pathname]);

  if (phase === 'waiting' || phase === 'gone') return null;

  return (
    <div
      className={`tt-splash${phase === 'leave' ? ' tt-splash-leave' : ''}`}
      role="status"
      aria-label="Loading Tata Tex"
    >
      <div className="tt-splash-center">
        <svg className="tt-splash-mark" viewBox="-60 -60 1200 1200" aria-hidden="true">
          <g className="tt-splash-all">
            <path
              className="tt-splash-line tt-splash-first-t"
              pathLength="1"
              d="M62,50 L652,50 L658,216 L640,216 C630,140 600,95 520,95 L408,95 L408,525 L305,628 L305,95 L190,95 C110,95 80,140 75,216 L55,216 Z"
            />
            <path
              className="tt-splash-line tt-splash-slash"
              pathLength="1"
              d="M880,106 Q449,494 58,922 Q489,534 880,106 Z"
            />
            <path
              className="tt-splash-line tt-splash-second-t"
              pathLength="1"
              d="M772,248 L1020,248 L1028,414 L1008,414 C1000,335 970,293 905,293 L775,293 L775,900 C775,930 800,945 876,947 L876,964 L572,964 L572,950 C640,948 676,930 676,880 L676,355 Z"
            />
            <text className="tt-splash-since" x="540" y="1060">
              SINCE 1983
            </text>
          </g>
        </svg>
      </div>
    </div>
  );
}
