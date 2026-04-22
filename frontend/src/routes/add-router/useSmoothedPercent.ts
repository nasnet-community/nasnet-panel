import { useEffect, useRef, useState } from 'react';

const STEP_INTERVAL_MS = 20;

/**
 * Animates toward `target` by one unit per tick so abrupt jumps (e.g. 10 → 50)
 * fill in smoothly. The caller can force a reset via the returned setter.
 */
export function useSmoothedPercent(target: number): [number, (value: number) => void] {
  const [display, setDisplay] = useState(0);
  const targetRef = useRef(target);

  useEffect(() => {
    targetRef.current = target;
  }, [target]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setDisplay((prev) => {
        const t = targetRef.current;
        if (prev < t) return Math.min(t, prev + 1);
        if (prev > t) return Math.max(t, prev - 1);
        return prev;
      });
    }, STEP_INTERVAL_MS);
    return () => window.clearInterval(timer);
  }, []);

  return [display, setDisplay];
}
