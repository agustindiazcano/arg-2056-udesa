import { useEffect, useRef } from 'react';
import { useStore } from './store';

export function useTicker() {
  const tick = useStore((s) => s.tick);
  const playing = useStore((s) => s.playing);
  const lastTimeRef = useRef<number | null>(null);
  const frameRef = useRef<number | null>(null);

  useEffect(() => {
    if (!playing) {
      lastTimeRef.current = null;
      return;
    }

    function loop(time: number) {
      if (lastTimeRef.current !== null) {
        const dt = (time - lastTimeRef.current) / 1000;
        tick(dt);
      }
      lastTimeRef.current = time;
      frameRef.current = requestAnimationFrame(loop);
    }

    frameRef.current = requestAnimationFrame(loop);

    return () => {
      if (frameRef.current !== null) {
        cancelAnimationFrame(frameRef.current);
      }
    };
  }, [playing, tick]);
}
