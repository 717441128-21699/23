import { useMemo } from 'react';
import { Line } from 'react-chartjs-2';
import {
  type ChartOptions,
} from 'chart.js';
import { baseChartOptions, chartThemeColors } from './chartConfig';

interface MagnetizationChartProps {
  time?: number[];
  mx?: number[];
  my?: number[];
  mz?: number[];
  flipThreshold?: number;
}

function generateMagData() {
  const points = 100;
  const time = Array.from({ length: points }, (_, i) => i * 0.05);
  const mx = time.map((t) => Math.exp(-t / 1.5) * Math.cos(t * 4));
  const my = time.map((t) => Math.exp(-t / 2) * Math.sin(t * 3.5) * 0.6);
  const mz = time.map((t) => Math.tanh((t - 1) * 2) * 0.95 + 0.05);
  return { time, mx, my, mz };
}

export default function MagnetizationChart({
  time,
  mx,
  my,
  mz,
  flipThreshold = 0.9,
}: MagnetizationChartProps) {
  const data = useMemo(() => {
    if (time && mx && my && mz) return { time, mx, my, mz };
    return generateMagData();
  }, [time, mx, my, mz]);

  const flipTimeIdx = useMemo(() => {
    const idx = data.mz.findIndex((v) => Math.abs(v) >= flipThreshold);
    return idx >= 0 ? idx : data.time.length - 1;
  }, [data.mz, data.time, flipThreshold]);

  const flipProgress = useMemo(() => {
    const finalMz = Math.abs(data.mz[data.mz.length - 1]);
    return Math.min(100, Math.round((finalMz / flipThreshold) * 100));
  }, [data.mz, flipThreshold]);

  const flipTimeNs = data.time[flipTimeIdx];

  const chartData = {
    labels: data.time.map((t) => t.toFixed(2)),
    datasets: [
      {
        label: 'Mx',
        data: data.mx,
        borderColor: chartThemeColors.red,
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        borderWidth: 2,
        pointRadius: 0,
        tension: 0.3,
      },
      {
        label: 'My',
        data: data.my,
        borderColor: chartThemeColors.green,
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        borderWidth: 2,
        pointRadius: 0,
        tension: 0.3,
      },
      {
        label: 'Mz',
        data: data.mz,
        borderColor: chartThemeColors.accentBlue,
        backgroundColor: 'rgba(59, 130, 246, 0.15)',
        borderWidth: 2.5,
        pointRadius: 0,
        tension: 0.3,
      },
    ],
  };

  const options: ChartOptions<'line'> = {
    ...baseChartOptions,
    scales: {
      x: {
        ...baseChartOptions.scales?.x,
        title: {
          display: true,
          text: '时间 (ns)',
          color: chartThemeColors.textSecondary,
          font: { family: 'Space Grotesk', size: 11, weight: 500 },
        },
      },
      y: {
        ...baseChartOptions.scales?.y,
        min: -1.1,
        max: 1.1,
        title: {
          display: true,
          text: '磁化强度 (M/Ms)',
          color: chartThemeColors.textSecondary,
          font: { family: 'Space Grotesk', size: 11, weight: 500 },
        },
      },
    },
  };

  return (
    <div className="w-full h-full min-h-[240px] flex flex-col">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-text-muted">翻转阈值:</span>
            <span className="text-accent-blue font-mono font-medium">±{flipThreshold}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-text-muted">翻转时间:</span>
            <span className="text-accent-cyan font-mono font-medium">{flipTimeNs.toFixed(2)} ns</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-24 h-2 bg-bg-secondary rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-accent-blue via-accent-purple to-accent-cyan transition-all duration-500"
              style={{ width: `${flipProgress}%` }}
            />
          </div>
          <span className="text-xs font-mono font-medium text-gradient">{flipProgress}%</span>
        </div>
      </div>
      <div className="relative flex-1 min-h-0">
        <div
          className="absolute top-0 bottom-0 bg-gradient-to-r from-accent-pink/8 to-transparent pointer-events-none z-10"
          style={{ left: 0, width: `${(flipTimeIdx / data.time.length) * 100}%` }}
        />
        <Line data={chartData} options={options} />
      </div>
    </div>
  );
}
