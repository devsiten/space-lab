'use client';

import { useEffect, useRef, useState } from 'react';

interface PriceChartProps {
  tokenAddress: string;
  height?: number;
}

export function PriceChart({ tokenAddress, height = 400 }: PriceChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<any>(null);
  const [timeframe, setTimeframe] = useState('1H');
  const [loading, setLoading] = useState(true);
  const [hasData, setHasData] = useState(false);

  const timeframes = ['1M', '5M', '15M', '1H', '4H', '1D'];

  useEffect(() => {
    let isMounted = true;

    const initChart = async () => {
      if (!containerRef.current || !isMounted) return;

      try {
        const { createChart, ColorType, CrosshairMode } = await import('lightweight-charts');

        // Clear previous chart
        if (chartRef.current) {
          chartRef.current.remove();
        }

        const chart = createChart(containerRef.current, {
          layout: {
            background: { type: ColorType.Solid, color: '#131314' },
            textColor: '#9CA3AF',
          },
          grid: {
            vertLines: { color: '#1F1F22' },
            horzLines: { color: '#1F1F22' },
          },
          crosshair: {
            mode: CrosshairMode.Normal,
          },
          rightPriceScale: {
            borderColor: '#1F1F22',
          },
          timeScale: {
            borderColor: '#1F1F22',
            timeVisible: true,
          },
          width: containerRef.current.clientWidth,
          height: height,
        });

        chartRef.current = chart;

        // TODO: plug real OHLCV data source; for now, do not render mock data
        const candlestickSeries = chart.addCandlestickSeries({
          upColor: '#10B981',
          downColor: '#EF4444',
          borderDownColor: '#EF4444',
          borderUpColor: '#10B981',
          wickDownColor: '#EF4444',
          wickUpColor: '#10B981',
        });

        // Without a live OHLCV source, leave series empty
        candlestickSeries.setData([]);
        setHasData(false);

        // Handle resize
        const handleResize = () => {
          if (containerRef.current) {
            chart.applyOptions({ width: containerRef.current.clientWidth });
          }
        };

        window.addEventListener('resize', handleResize);

        setLoading(false);

        return () => {
          window.removeEventListener('resize', handleResize);
          if (chartRef.current) {
            chartRef.current.remove();
          }
        };
      } catch (error) {
        console.error('Failed to initialize chart:', error);
        setLoading(false);
      }
    };

    initChart();

    return () => {
      isMounted = false;
      if (chartRef.current) {
        chartRef.current.remove();
      }
    };
  }, [tokenAddress, height, timeframe]);

  return (
    <div className="bg-[#131314] border border-[#1F1F22] rounded-2xl overflow-hidden">
      {/* Timeframe Selector */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#1F1F22]">
        <div className="flex gap-1">
          {timeframes.map((tf) => (
            <button
              key={tf}
              onClick={() => setTimeframe(tf)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
                timeframe === tf
                  ? 'bg-purple-600 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-[#1F1F22]'
              }`}
            >
              {tf}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <button className="text-gray-400 hover:text-white p-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
            </svg>
          </button>
        </div>
      </div>

      {/* Chart Container */}
      <div className="relative">
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-[#131314]">
            <svg className="animate-spin h-8 w-8 text-purple-500" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          </div>
        )}
        {!loading && !hasData && (
          <div className="absolute inset-0 flex items-center justify-center bg-[#131314] text-gray-500 text-sm">
            No price data yet.
          </div>
        )}
        <div ref={containerRef} style={{ height }} />
      </div>
    </div>
  );
}
