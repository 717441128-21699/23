import { useEffect, useRef, useState } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  type ChartOptions,
} from 'chart.js';
import { baseChartOptions, chartThemeColors } from './chartConfig';
import type { EnergyEvolution } from '@/types';

interface EnergyChartProps {
  data?: EnergyEvolution;
  realtime?: boolean;
}

const createEmptyData = (): EnergyEvolution => ({
  time: [],
  exchangeEnergy: [],
  demagnetizationEnergy: [],
  zeemanEnergy: [],
  totalEnergy: [],
});

export default function EnergyChart({ data, realtime = false }: EnergyChartProps) {
  const chartRef = useRef<ChartJS<'line'>>(null);
  const [displayData, setDisplayData] = useState<EnergyEvolution>(createEmptyData());
  const animationRef = useRef<number>();

  useEffect(() => {
    if (!data) {
      setDisplayData(createEmptyData());
      return;
    }
    if (!realtime) {
      setDisplayData(data);
      return;
    }
    let index = 0;
    const step = () => {
      if (index <= data.time.length) {
        setDisplayData({
          time: data.time.slice(0, index),
          exchangeEnergy: data.exchangeEnergy.slice(0, index),
          demagnetizationEnergy: data.demagnetizationEnergy.slice(0, index),
          zeemanEnergy: data.zeemanEnergy.slice(0, index),
          totalEnergy: data.totalEnergy.slice(0, index),
        });
        index++;
        animationRef.current = window.setTimeout(step, 30);
      }
    };
    step();
    return () => {
      if (animationRef.current) clearTimeout(animationRef.current);
    };
  }, [data, realtime]);

  const chartData = {
    labels: displayData.time.map((t) => t.toFixed(1)),
    datasets: [
      {
        label: '交换能',
        data: displayData.exchangeEnergy.map((e) => e * 1e18),
        borderColor: chartThemeColors.accentBlue,
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        borderWidth: 2,
        pointRadius: 0,
        tension: 0.35,
        yAxisID: 'y',
      },
      {
        label: '退磁能',
        data: displayData.demagnetizationEnergy.map((e) => e * 1e18),
        borderColor: chartThemeColors.accentPurple,
        backgroundColor: 'rgba(139, 92, 246, 0.1)',
        borderWidth: 2,
        pointRadius: 0,
        tension: 0.35,
        yAxisID: 'y',
      },
      {
        label: '塞曼能',
        data: displayData.zeemanEnergy.map((e) => e * 1e18),
        borderColor: chartThemeColors.accentCyan,
        backgroundColor: 'rgba(6, 182, 212, 0.1)',
        borderWidth: 2,
        pointRadius: 0,
        tension: 0.35,
        yAxisID: 'y',
      },
      {
        label: '总能量',
        data: displayData.totalEnergy.map((e) => e * 1e18),
        borderColor: chartThemeColors.accentPink,
        backgroundColor: 'rgba(247, 37, 133, 0.15)',
        borderWidth: 2.5,
        pointRadius: 0,
        tension: 0.35,
        yAxisID: 'y1',
      },
    ],
  };

  const options: ChartOptions<'line'> = {
    ...baseChartOptions,
    plugins: {
      ...baseChartOptions.plugins,
      legend: {
        ...baseChartOptions.plugins?.legend,
        position: 'top',
      },
    },
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
        position: 'left',
        title: {
          display: true,
          text: '分量能量 (×10⁻¹⁸ J)',
          color: chartThemeColors.textSecondary,
          font: { family: 'Space Grotesk', size: 11, weight: 500 },
        },
      },
      y1: {
        position: 'right',
        grid: { drawOnChartArea: false },
        ticks: {
          color: chartThemeColors.textMuted,
          font: { family: 'JetBrains Mono', size: 10 },
        },
        border: { display: false },
        title: {
          display: true,
          text: '总能量 (×10⁻¹⁸ J)',
          color: chartThemeColors.accentPink,
          font: { family: 'Space Grotesk', size: 11, weight: 500 },
        },
      },
    },
  };

  return (
    <div className="w-full h-full min-h-[240px]">
      <Line ref={chartRef} data={chartData} options={options} />
    </div>
  );
}
