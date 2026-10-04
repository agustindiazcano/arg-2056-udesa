import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import {
  browserEnv,
  debugEnabled,
  nextTier,
  parseQualityOverride,
  qualityTier,
  readCapabilities
} from './capabilities';
import type { Capabilities, CapabilityEnv, QualityTier } from './capabilities';

export interface Quality {
  caps: Capabilities;
  tier: QualityTier;
  setTier: (tier: QualityTier) => void;
  /** Lowers the tier by one when the last frame times are too slow (see `nextTier`); never raises it. */
  downgrade: (frameTimesMs: readonly number[]) => void;
}

const QualityContext = createContext<Quality | null>(null);

interface ProviderProps {
  /** the device to read; defaults to the real browser (tests inject one) */
  env?: CapabilityEnv;
  /** the query string with the `?quality=` override; defaults to the page's */
  search?: string;
  children: React.ReactNode;
}

const pageSearch = () => (typeof window === 'undefined' ? '' : window.location.search);

/** Reads the device once and holds the quality tier; `?quality=low|medium|high` overrides the detected tier. */
export function CapabilityProvider({ env, search, children }: ProviderProps) {
  const caps = useMemo(() => readCapabilities(env ?? browserEnv()), [env]);
  const [tier, setTier] = useState<QualityTier>(() => parseQualityOverride(search ?? pageSearch()) ?? qualityTier(caps));
  const downgrade = useCallback((frameTimesMs: readonly number[]) => setTier((current) => nextTier(current, frameTimesMs)), []);
  const value = useMemo<Quality>(() => ({ caps, tier, setTier, downgrade }), [caps, tier, downgrade]);
  return <QualityContext.Provider value={value}>{children}</QualityContext.Provider>;
}

/** The quality, or null where there is no provider (the references page, the unit tests): a caller then stays on the safe path. */
export function useQualityOptional(): Quality | null {
  return useContext(QualityContext);
}

export function useQuality(): Quality {
  const value = useContext(QualityContext);
  if (value === null) throw new Error('useQuality must be used inside a CapabilityProvider');
  return value;
}

/** A small line "quality: <tier>", shown only with `?debug=1`. */
export function QualityDebugLine({ search }: { search?: string }) {
  const { tier } = useQuality();
  if (!debugEnabled(search ?? pageSearch())) return null;
  return <div data-testid="quality-debug">quality: {tier}</div>;
}
