import React from 'react';
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/react';

/**
 * Visit counter (Vercel Web Analytics) and speed metrics (Speed Insights). Both scripts are served by Vercel from the
 * same origin (/_vercel/insights), so they exist only on a Vercel build: vite.config.ts sets the flag from the VERCEL
 * build variable. Anywhere else (local, e2e) nothing renders and nothing is requested.
 */
export function VercelMetrics({ enabled = import.meta.env.VITE_ON_VERCEL === true }: { enabled?: boolean }) {
  if (!enabled) return null;
  return (
    <>
      <Analytics />
      <SpeedInsights />
    </>
  );
}
