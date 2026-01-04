"use client";

import { useEffect, useState } from "react";
import { TrendingUp, Sparkles, Loader2, RefreshCw } from "lucide-react";

interface ForecastData {
  history: {
    labels: string[];
    data: number[];
  };
  forecast: {
    forecast: number;
    trend: 'artış' | 'azalış' | 'sabit';
    explanation: string;
  };
}

export const MemberEngagementChart = () => {
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<ForecastData | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
     
    setMounted(true);
    fetchForecast();
  }, []);

  const fetchForecast = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/ai/engagement-forecast', { method: 'POST' });
      if (res.ok) {
        const result = await res.json();
        setData(result);
        setError(false);
      } else {
        setError(true);
      }
    } catch (error) {
      console.error(error);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  if (!mounted) return <div className="w-full h-full bg-zinc-900/50 animate-pulse rounded-xl" />;

  // Loading State
  if (loading && !data) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center text-zinc-500 gap-2 p-4">
        <Loader2 className="w-6 h-6 animate-spin text-orange-500" />
        <span className="text-[10px] uppercase font-bold tracking-widest text-center">AI Analizi Yapılıyor...</span>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center text-zinc-500 gap-2 p-4">
        <RefreshCw className="w-5 h-5 opacity-50" />
        <span className="text-[10px] text-center">Veri alınamadı</span>
        <button onClick={fetchForecast} className="text-[10px] text-orange-500 underline">Tekrar Dene</button>
      </div>
    );
  }

  // Chart Calculation
  const width = 100;
  const height = 60;
  const padding = 10;

  // Combine history and forecast for scaling
  const allValues = [...data.history.data, data.forecast.forecast];
  const maxVal = Math.max(...allValues, 1);
  const minVal = Math.min(...allValues);
  const range = maxVal - minVal || 1;

  // Y mapping function (Value -> Y Coordinate)
  // We map minVal to height-padding and maxVal to padding
  const mapY = (val: number) => {
    const normalized = (val - minVal) / range; // 0 to 1
    return height - padding - (normalized * (height - 2 * padding));
  };

  // X mapping
  // History points: 0 to N-1
  // Forecast point: N
  const totalPoints = allValues.length;
  const stepX = width / (totalPoints - 1);

  const historyPoints = data.history.data.map((val, i) => ({
    x: i * stepX,
    y: mapY(val),
    val,
    label: data.history.labels[i]
  }));

  const lastHistoryPoint = historyPoints[historyPoints.length - 1];

  const forecastPoint = {
    x: (historyPoints.length) * stepX,
    y: mapY(data.forecast.forecast),
    val: data.forecast.forecast
  };

  // SVG Paths
  const historyPathD = historyPoints.map((p, i) =>
    `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`
  ).join(" ");

  const forecastPathD = `M ${lastHistoryPoint.x} ${lastHistoryPoint.y} L ${forecastPoint.x} ${forecastPoint.y}`;

  // Fill area needs to go down to bottom
  const fillPathD = `${historyPathD} L ${lastHistoryPoint.x} ${height} L 0 ${height} Z`;

  const getTrendColor = () => {
    if (data.forecast.trend === 'artış') return 'text-green-400 border-green-500/20 bg-green-500/10';
    if (data.forecast.trend === 'azalış') return 'text-red-400 border-red-500/20 bg-red-500/10';
    return 'text-blue-400 border-blue-500/20 bg-blue-500/10';
  };

  return (
    <div className="w-full h-full relative font-sans select-none p-4">
      {/* Header / Title */}
      <div className="absolute top-4 left-5 z-20">
        <div className="flex items-center gap-2 mb-0.5">
          <div className="p-1.5 bg-orange-500/10 rounded-md">
            <TrendingUp className="w-3.5 h-3.5 text-orange-500" />
          </div>
          <span className="text-xs font-bold text-zinc-300">Bağlılık Analizi</span>
        </div>
        <p className="text-[9px] text-zinc-500 ml-1 truncate max-w-[120px]">
          {data.forecast.explanation || 'AI Trend Analizi'}
        </p>
      </div>

      {/* AI Insight Badge */}
      <div className="absolute top-4 right-4 z-20">
        <div className={`inline-flex items-center gap-1.5 px-2 py-1 border rounded-lg backdrop-blur-md shadow-sm ${getTrendColor()}`}>
          <Sparkles className="w-3 h-3" />
          <span className="text-[9px] font-bold uppercase">
            {data.forecast.trend} Beklentisi
          </span>
        </div>
      </div>

      {/* Chart Area */}
      <div className="absolute inset-0 top-14 pt-0 px-2 pb-6">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full overflow-visible" preserveAspectRatio="none">
          <defs>
            <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#f97316" stopOpacity="0.2" />
              <stop offset="100%" stopColor="#f97316" stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* Fill Area for History */}
          <path d={fillPathD} fill="url(#chartGradient)" />

          {/* History Line */}
          <path
            d={historyPathD}
            fill="none"
            stroke="#f97316"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            vectorEffect="non-scaling-stroke"
          />

          {/* Forecast Line (Dashed) */}
          <path
            d={forecastPathD}
            fill="none"
            stroke={data.forecast.trend === 'artış' ? '#4ade80' : data.forecast.trend === 'azalış' ? '#f87171' : '#60a5fa'}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray="3 3"
            vectorEffect="non-scaling-stroke"
            className="animate-pulse"
          />

          {/* History Points */}
          {historyPoints.map((p, i) => (
            <circle key={i} cx={p.x} cy={p.y} r="1.5" fill="#f97316" stroke="#000" strokeWidth="0.5" />
          ))}

          {/* Forecast Point */}
          <circle
            cx={forecastPoint.x}
            cy={forecastPoint.y}
            r="2.5"
            fill={data.forecast.trend === 'artış' ? '#4ade80' : data.forecast.trend === 'azalış' ? '#f87171' : '#60a5fa'}
            stroke="#000"
            strokeWidth="0.5"
          />
        </svg>
      </div>

      {/* Labels */}
      <div className="absolute bottom-2 left-2 right-2 flex justify-between text-[8px] text-zinc-600 font-mono uppercase tracking-wider px-2">
        {data.history.labels.map((l, i) => <span key={i}>{l}</span>)}
        <span className={data.forecast.trend === 'artış' ? 'text-green-500 font-bold' : 'text-zinc-500 font-bold'}>GELECEK AY</span>
      </div>

      {/* Forecast Value Tooltip */}
      <div
        className={`absolute transition-all duration-500 ${data.forecast.trend === 'artış' ? 'bg-green-500' : data.forecast.trend === 'azalış' ? 'bg-red-500' : 'bg-blue-500'} text-white text-[9px] font-bold px-1.5 py-0.5 rounded shadow-sm`}
        style={{
          left: `${(forecastPoint.x / width) * 100}%`,
          top: `${(forecastPoint.y / height) * 100}%`,
          transform: 'translate(-50%, -150%)'
        }}
      >
        ~{data.forecast.forecast}
      </div>
    </div>
  );
};