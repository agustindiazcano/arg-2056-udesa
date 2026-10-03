import React, { useEffect, useRef } from 'react';
import * as echarts from 'echarts';

interface EChartProps {
  option: unknown;
  style?: React.CSSProperties;
  'aria-label'?: string;
  role?: string;
}

export const EChart: React.FC<EChartProps> = ({ option, style, 'aria-label': ariaLabel, role = 'img' }) => {
  const chartRef = useRef<HTMLDivElement>(null);
  const instanceRef = useRef<echarts.ECharts | null>(null);

  useEffect(() => {
    if (!chartRef.current) return;
    
    // init
    if (!instanceRef.current) {
      instanceRef.current = echarts.init(chartRef.current);
    }
    
    const chart = instanceRef.current;
    
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
      // @ts-ignore Option type is too complex to cast from any
      instanceRef.current.setOption(option, true); // true = not merge
    }
  }, [option]);

  return (
    <div 
      ref={chartRef} 
      style={{ width: '100%', height: '100%', ...style }} 
      role={role}
      aria-label={ariaLabel}
    />
  );
};
