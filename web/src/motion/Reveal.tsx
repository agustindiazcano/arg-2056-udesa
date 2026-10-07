import React, { useLayoutEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { useReducedMotion } from '../runtime/useReducedMotion';
import { REVEAL } from './timings';

interface RevealProps extends React.HTMLAttributes<HTMLDivElement> {
  /** the animation plays again when this changes (and when the element mounts) */
  k: string;
  /** seconds to wait before it starts: a row of panels uses it to come in one after the other */
  delay?: number;
}

/** A box that fades in, rises a little and settles from a slightly smaller size when it mounts or `k` changes; nothing under reduced motion. */
export function Reveal({ k, delay = 0, children, ...rest }: RevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el || reduced) return;
    const tween = gsap.fromTo(
      el,
      { opacity: 0, y: REVEAL.y, scale: REVEAL.scale },
      { opacity: 1, y: 0, scale: 1, delay, duration: REVEAL.duration, ease: REVEAL.ease, clearProps: 'opacity,transform' }
    );
    return () => {
      tween.kill();
    };
  }, [k, delay, reduced]);

  return (
    <div ref={ref} {...rest}>
      {children}
    </div>
  );
}
