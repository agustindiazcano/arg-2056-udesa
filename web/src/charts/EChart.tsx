import React, { useEffect, useRef } from 'react';
import { init } from './echarts.js';
import { useReducedMotion } from '../runtime/useReducedMotion';
import { SERIES_DRAW_MS } from '../motion/timings';
import { clampCenter } from './navState';
import type { Bbox } from './navState';
import type { ECharts } from './echarts.js';

export interface ChartClickParams {
  name?: string;
  componentType?: string;
  seriesType?: string;
  data?: { provinceId?: string } | null;
}

interface EChartProps {
  option: unknown;
  onClick?: (params: ChartClickParams) => void;
  style?: React.CSSProperties;
  'aria-label'?: string;
  role?: string;
  /** a map that can be zoomed and moved: its view survives a new option, and the centre stays inside the territory */
  roam?: { bbox: Bbox };
  /** gets the chart instance (null again on unmount), for the zoom buttons */
  apiRef?: React.MutableRefObject<ECharts | null>;
}

interface GeoView {
  zoom?: number;
  center?: [number, number] | null;
}

/** The zoom and the centre the user left the map at. */
function currentView(chart: ECharts): GeoView | null {
  if (typeof chart.getOption !== 'function') return null;
  const geo = (chart.getOption() as { geo?: GeoView[] } | undefined)?.geo;
  return geo?.[0] ?? null;
}

/** The option type of ECharts is too large to build from `unknown`: the builders own its shape. */
type SetOptionArg = Parameters<ECharts['setOption']>[0];

function withAnimation(option: unknown, animate: boolean): unknown {
  if (typeof option !== 'object' || option === null) return option;
  // the series draw in once over 600 ms; later updates (the playhead, a filter) are immediate
  return animate
    ? { ...option, animation: true, animationDuration: SERIES_DRAW_MS, animationEasing: 'cubicOut', animationDurationUpdate: 0 }
    : { ...option, animation: false };
}

/** A new option for a roamable map keeps the zoom and the centre the user left it at (the year or a filter changed). */
function withView(option: unknown, chart: ECharts, roamable: boolean): unknown {
  if (!roamable || typeof option !== 'object' || option === null) return option;
  const view = currentView(chart);
  const geo = (option as { geo?: object }).geo;
  if (!view || !geo || (view.zoom === undefined && !view.center) || (view.zoom ?? 1) <= 1) return option;
  return { ...option, geo: { ...geo, zoom: view.zoom, ...(view.center ? { center: view.center } : {}) } };
}

export const EChart: React.FC<EChartProps> = ({ option, onClick, style, 'aria-label': ariaLabel, role = 'img', roam, apiRef }) => {
  const chartRef = useRef<HTMLDivElement>(null);
  const instanceRef = useRef<ECharts | null>(null);
  const reducedMotion = useReducedMotion();
  const onClickRef = useRef(onClick);
  onClickRef.current = onClick;
  const bboxRef = useRef<Bbox | null>(roam?.bbox ?? null);
  bboxRef.current = roam?.bbox ?? null;
  const hasRoam = roam !== undefined;

  useEffect(() => {
    if (!chartRef.current) return;
    
    // init
    if (!instanceRef.current) {
      instanceRef.current = init(chartRef.current);
    }
    
    const chart = instanceRef.current;
    chart.on('click', (params) => onClickRef.current?.(params as ChartClickParams));
    if (apiRef) apiRef.current = chart;
    if (hasRoam) {
      // after the user moves the map: keep the centre where the territory stays in the frame
      chart.on('georoam', () => {
        const bbox = bboxRef.current;
        const view = currentView(chart);
        if (!bbox || !view?.center) return;
        const center = clampCenter(view.center, view.zoom ?? 1, bbox);
        if (center[0] !== view.center[0] || center[1] !== view.center[1]) chart.setOption({ geo: { center } } as SetOptionArg);
      });
    }
    
    const handleResize = () => {
      chart.resize();
    };
    
    window.addEventListener('resize', handleResize);
    // the box can change without the window changing (the Recorrido shows one to four charts side by side)
    const observer = typeof ResizeObserver === 'undefined' || !chartRef.current ? null : new ResizeObserver(handleResize);
    if (observer && chartRef.current) observer.observe(chartRef.current);

    return () => {
      observer?.disconnect();
      window.removeEventListener('resize', handleResize);
      chart.dispose();
      instanceRef.current = null;
      if (apiRef) apiRef.current = null;
    };
  }, []); // Init/dispose effect

  useEffect(() => {
    if (instanceRef.current && option) {
      // true = not merge. With reduced motion the chart does not animate; a copy keeps the builder's option intact.
      instanceRef.current.setOption(withView(withAnimation(option, !reducedMotion), instanceRef.current, hasRoam) as SetOptionArg, true);
    }
  }, [option, reducedMotion]);

  return (
    <div 
      ref={chartRef} 
      style={{ width: '100%', height: '100%', ...style }} 
      role={role}
      aria-label={ariaLabel}
    />
  );
};
