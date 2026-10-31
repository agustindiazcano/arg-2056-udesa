import React, { createContext, useCallback, useContext, useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { REFERENCES } from '../datasets/references.js';

export type ReferenceItem = { id?: string; url?: string; label?: string };
type Register = (key: string, items: ReferenceItem[]) => () => void;
const Context = createContext<Register | null>(null);

export function useSlideReferences(items: ReferenceItem[]): boolean {
  const register = useContext(Context);
  const key = useId();
  const serialized = JSON.stringify(items);
  useEffect(() => register?.(key, JSON.parse(serialized) as ReferenceItem[]), [register, key, serialized]);
  return register !== null;
}

export function SlideReferences({ children }: { children: React.ReactNode }) {
  const [groups, setGroups] = useState<Record<string, ReferenceItem[]>>({});
  const [open, setOpen] = useState(false);
  const trigger = useRef<HTMLButtonElement>(null);
  const close = useRef<HTMLButtonElement>(null);
  const title = useId();
  const register = useCallback<Register>((key, items) => {
    setGroups((old) => ({ ...old, [key]: items }));
    return () => setGroups((old) => { const next = { ...old }; delete next[key]; return next; });
  }, []);
  const dismiss = useCallback(() => { setOpen(false); trigger.current?.focus(); }, []);
  useEffect(() => {
    if (!open) return;
    close.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { e.stopPropagation(); dismiss(); }
      if (e.key === 'Tab') {
        const dialog = close.current?.closest('[role="dialog"]');
        const targets = dialog?.querySelectorAll<HTMLElement>('button, a[href]');
        if (!targets?.length) return;
        const first = targets[0]!; const last = targets[targets.length - 1]!;
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, dismiss]);
  const items = Object.values(groups).flat();
  const unique = new Map<string, { label: string; url: string; num: number | null }>();
  for (const item of items) {
    const index = REFERENCES.findIndex((r) => (item.id && r.id === item.id) || (item.url && r.url === item.url));
    const ref = REFERENCES[index];
    const url = ref?.url ?? item.url;
    if (url) unique.set(ref?.id ?? url, { label: item.label ?? ref?.label ?? item.id ?? url, url, num: index < 0 ? null : index + 1 });
  }
  return <Context.Provider value={register}>
    {children}
    {unique.size > 0 && <button ref={trigger} type="button" className="btn slide-references-button" aria-haspopup="dialog" aria-expanded={open} onClick={() => setOpen(true)}>Referencias</button>}
    {open && createPortal(<div className="chart-help-backdrop slide-references-backdrop">
      <button type="button" className="chart-help-backdrop-close" tabIndex={-1} aria-label="Cerrar fondo de referencias" onClick={dismiss} />
      <div role="dialog" aria-modal="true" aria-labelledby={title} className="chart-help-modal">
        <div className="chart-help-modal-head"><h4 id={title}>Referencias</h4><button ref={close} type="button" className="btn" onClick={dismiss}>Cerrar</button></div>
        <div className="chart-help-modal-body"><ol className="slide-references-list">{[...unique.values()].sort((a, b) => (a.num ?? Infinity) - (b.num ?? Infinity)).map((r) => <li key={r.url}><a href={r.url} target="_blank" rel="noopener noreferrer">{r.num !== null && <span>[{r.num}]</span>} {r.label}<br />{r.url}</a></li>)}</ol></div>
      </div>
    </div>, document.body)}
  </Context.Provider>;
}
