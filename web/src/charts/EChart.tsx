import React, { useEffect, useRef } from 'react';
import { init } from './echarts.js';
import { useReducedMotion } from '../runtime/useReducedMotion';
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
}

/** The option type of ECharts is too large to build from `unknown`: the builders own its shape. */
type SetOptionArg = Parameters<ECharts['setOption']>[0];

function withoutAnimation(option: unknown): unknown {
  return typeof option === 'object' && option !== null ? { ...option, animation: false } : option;
}

export const EChart: React.FC<EChartProps> = ({ option, onClick, style, 'aria-label': ariaLabel, role = 'img' }) => {
  const chartRef = useRef<HTMLDivElement>(null);
  const instanceRef = useRef<ECharts | null>(null);
  const reducedMotion = useReducedMotion();
  const onClickRef = useRef(onClick);
  onClickRef.current = onClick;

  useEffect(() => {
    if (!chartRef.current) return;
    
    // init
    if (!instanceRef.current) {
      instanceRef.current = init(chartRef.current);
    }
    
    const chart = instanceRef.current;
    chart.on('click', (params) => onClickRef.current?.(params as ChartClickParams));
    
    const handleResize = () => {
      chart.resize();
    };
    
    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
      chart.dispose();
      instanceRef.current = null;
    };
  }, []); // Init/dispose effect

  useEffect(() => {
    if (instanceRef.current && option) {
      // true = not merge. With reduced motion the chart does not animate; a copy keeps the builder's option intact.
      instanceRef.current.setOption((reducedMotion ? withoutAnimation(option) : option) as SetOptionArg, true);
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
