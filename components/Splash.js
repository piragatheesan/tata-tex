'use client';
import { useEffect, useState } from 'react';

// Animated logo loading screen (white glass). Click to skip.
export default function Splash() {
  const [s, setS] = useState(0); // 0 playing, 1 leaving, 2 gone
  useEffect(() => {
    const a = setTimeout(() => setS(1), 5400);
    const b = setTimeout(() => setS(2), 6000);
    return () => {
      clearTimeout(a);
      clearTimeout(b);
    };
  }, []);
  if (s === 2) return null;
  return (
    <div
      className={'sp' + (s === 1 ? ' out' : '')}
      role="status"
      aria-label="Loading Tata Tex"
      onClick={() => setS((x) => x || 1)}
    >
      <svg viewBox="-60 -60 1200 1200" aria-hidden="true">
        <g className="ls-all">
          <path
            className="ls-line ls-t1"
            pathLength="1"
            d="M62,50 L652,50 L658,216 L640,216 C630,140 600,95 520,95 L408,95 L408,525 L305,628 L305,95 L190,95 C110,95 80,140 75,216 L55,216 Z"
          />
          <path
            className="ls-line ls-slash"
            pathLength="1"
            d="M880,106 Q449,494 58,922 Q489,534 880,106 Z"
          />
          <path
            className="ls-line ls-t2"
            pathLength="1"
            d="M772,248 L1020,248 L1028,414 L1008,414 C1000,335 970,293 905,293 L775,293 L775,900 C775,930 800,945 876,947 L876,964 L572,964 L572,950 C640,948 676,930 676,880 L676,355 Z"
          />
          <text className="ls-sub" x="540" y="1060">
            SINCE 1983
          </text>
        </g>
      </svg>
    </div>
  );
}
