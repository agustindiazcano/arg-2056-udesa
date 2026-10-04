import React, { useLayoutEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { useReducedMotion } from '../runtime/useReducedMotion';
import { COUNTER } from './timings';

interface CountUpProps {
  value: number | null;
  format: (value: number) => string;
  /** shown when there is no value; a missing value is never counted and never shown as zero */
  fallback?: string;
}

/** Counts from zero to the value once, when it mounts; later values snap, so playback never lags behind the data. */
export function CountUp({ value, format, fallback = 'sin datos' }: CountUpProps) {
  const reduced = useReducedMotion();
  const [shown, setShown] = useState<number | null>(value);
  const first = useRef(true);

  useLayoutEffect(() => {
    if (!first.current) {
      setShown(value);
      return;
    }
    first.current = false;
    if (value === null || reduced) return;
    const counter = { n: 0 };
    setShown(0);
    const tween = gsap.to(counter, {
      n: value,
      duration: COUNTER.duration,
      ease: COUNTER.ease,
      onUpdate: () => setShown(counter.n),
      onComplete: () => setShown(value)
    });
    return () => {
      tween.kill();
    };
  }, [value, reduced]);

  return <>{shown === null ? fallback : format(shown)}</>;
}
