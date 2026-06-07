import { useMemo } from 'react';
import { Line } from 'react-chartjs-2';
import {
  type ChartOptions,
  type ScriptableContext,
} from 'chart.js';
import { baseChartOptions, chartThemeColors } from './chartConfig';
import type { HysteresisLoop } from '@/types';

interface HysteresisChartProps {
  data?: HysteresisLoop;
}

function generateHysteresis(): HysteresisLoop {
  const points = 60;
  const fieldUp = Array.from({ length: points }, (_, i) => -500 + (i * 1000) / (points - 1));
  const fieldDown = Array.from({ length: points }, (_, i) => 500 - (i * 1000) / (points - 1));
  const Hc = 80;
  const Ms = 1;
  const magUp = fieldUp.map((H) => Ms * Math.tanh((H - Hc * 0.3) / 80));
  const magDown = fieldDown.map((H) => Ms * Math.tanh((H + Hc * 0.3) / 80));
  return {
    field: [...fieldUp, ...fieldDown],
    magnetization: [...magUp, ...magDown],
    coercivity: Hc,
    remanence: Math.tanh(Hc * 0.3 / 80),
  };
}

export default function HysteresisChart({ data }: HysteresisChartProps) {
  const loop = useMemo(() => data || generateHysteresis(), [data]);
  const { coercivity, remanence } = loop;

  const half = Math.floor(loop.field.length / 2);
  const fieldUp = loop.field.slice(0, half);
  const magUp = loop.magnetization.slice(0, half);
  const fieldDown = loop.field.slice(half);
  const magDown = loop.magnetization.slice(half);

  const chartData = {
    labels: [...fieldUp, ...fieldDown].map((f) => f.toFixed(0)),
    datasets: [
      {
        label: '上扫',
        data: [...magUp, ...Array(half).fill(null)],
        borderColor: chartThemeColors.accentBlue,
        backgroundColor: (ctx: ScriptableContext<'line'>) => {
          const { ctx: canvas, chartArea } = ctx.chart;
          if (!chartArea) return 'rgba(59, 130, 246, 0.1)';
          const gradient = canvas.createLinearGradient(0, chartArea.bottom, 0, chartArea.top);
          gradient.addColorStop(0, 'rgba(59, 130, 246, 0.02)');
          gradient.addColorStop(1, 'rgba(59, 130, 246, 0.2)');
          return gradient;
        },
        borderWidth: 2,
        pointRadius: 0,
        tension: 0.4,
        fill: true,
      },
      {
        label: '下扫',
        data: [...Array(half).fill(null), ...magDown],
        borderColor: chartThemeColors.accentPurple,
        backgroundColor: (ctx: ScriptableContext<'line'>) => {
          const { ctx: canvas, chartArea } = ctx.chart;
          if (!chartArea) return 'rgba(139, 92, 246, 0.1)';
          const gradient = canvas.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
          gradient.addColorStop(0, 'rgba(139, 92, 246, 0.2)');
          gradient.addColorStop(1, 'rgba(139, 92, 246, 0.02)');
          return gradient;
        },
        borderWidth: 2,
        pointRadius: 0,
        tension: 0.4,
        fill: true,
      },
    ],
  };

  const options: ChartOptions<'line'> = {
    ...baseChartOptions,
    interaction: { mode: 'nearest', intersect: true },
    plugins: {
      ...baseChartOptions.plugins,
      tooltip: {
        ...baseChartOptions.plugins?.tooltip,
        callbacks: {
          title: (items) => `H = ${items[0].label} Oe`,
          label: (item) => `M/Ms = ${(item.raw as number).toFixed(3)}`,
        },
      },
    },
    scales: {
      x: {
        ...baseChartOptions.scales?.x,
        title: {
          display: true,
          text: '磁场 H (Oe)',
          color: chartThemeColors.textSecondary,
          font: { family: 'Space Grotesk', size: 11, weight: 500 },
        },
      },
      y: {
        ...baseChartOptions.scales?.y,
        min: -1.15,
        max: 1.15,
        title: {
          display: true,
          text: '磁化 M/Ms',
          color: chartThemeColors.textSecondary,
          font: { family: 'Space Grotesk', size: 11, weight: 500 },
        },
      },
    },
  };

  return (
    <div className="w-full h-full min-h-[260px] flex flex-col">
      <div className="flex items-center justify-center gap-8 mb-3 text-xs">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-accent-blue" />
          <span className="text-text-muted">矫顽力 Hc:</span>
          <span className="text-accent-blue font-mono font-medium">±{coercivity.toFixed(1)} Oe</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-accent-purple" />
          <span className="text-text-muted">剩磁 Mr:</span>
          <span className="text-accent-purple font-mono font-medium">±{remanence.toFixed(3)}</span>
        </div>
      </div>
      <div className="flex-1 min-h-0">
        <Line data={chartData} options={options} />
      </div>
    </div>
  );
}
