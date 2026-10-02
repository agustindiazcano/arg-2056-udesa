import { useEffect } from 'react';
import { useStore } from './store';
import { resolveKey } from '../types/keys';

export function useKeyboard() {
  const dispatch = useStore((s) => s.dispatch);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.ctrlKey || event.metaKey || event.altKey || event.repeat) {
        return;
      }

      const target = event.target as HTMLElement;
      if (target && target.tagName) {
        const tag = target.tagName.toLowerCase();
        if (tag === 'input' || tag === 'textarea' || tag === 'select' || target.isContentEditable) {
          return;
        }

        if (event.key === ' ' || event.key === 'Enter') {
          if (tag === 'button' || tag === 'a') {
            return;
          }
        }
      }

      const action = resolveKey(event.key);
      if (action) {
        event.preventDefault();
        dispatch(action);
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [dispatch]);
}
