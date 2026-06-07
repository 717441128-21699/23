import { useEffect, useRef, useMemo } from 'react';
import { chartThemeColors } from './chartConfig';

type ColorScheme = 'magnetic' | 'thermal' | 'energy';

interface Heatmap2DProps {
  data?: number[][];
  xLabels?: string[];
  yLabels?: string[];
  title?: string;
  colorMode?: 'magnetization' | 'time' | 'energy';
  colorScheme?: ColorScheme;
  unit?: string;
  min?: number;
  max?: number;
  showColorbar?: boolean;
}

function generateHeatmapData(cols = 20, rows = 10, mode: string = 'magnetization'): number[][] {
  const data: number[][] = [];
  for (let y = 0; y < rows; y++) {
    const row: number[] = [];
    for (let x = 0; x < cols; x++) {
      if (mode === 'magnetization') {
        const cx = cols / 2 + Math.sin(y * 0.5) * 3;
        const val = Math.tanh((x - cx) / 3) + (Math.random() - 0.5) * 0.2;
        row.push(Math.max(-1, Math.min(1, val)));
      } else if (mode === 'time') {
        const base = 0.5 + (x / cols) * 1.5;
        const noise = (Math.random() - 0.5) * 0.4;
        row.push(Math.max(0.2, base + noise + Math.sin(y * 0.8) * 0.2));
      } else {
        const cx = cols * 0.6;
        const cy = rows * 0.4;
        const dist = Math.sqrt((x - cx) ** 2 + (y - cy) ** 2);
        const val = Math.exp(-dist / 8) * 2 + Math.random() * 0.3;
        row.push(val);
      }
    }
    data.push(row);
  }
  return data;
}

function getColor(value: number, min: number, max: number, mode: string): string {
  const t = Math.max(0, Math.min(1, (value - min) / (max - min)));

  if (mode === 'magnetization') {
    const tn = (value - min) / (max - min);
    if (tn < 0.5) {
      const s = tn * 2;
      const r = Math.round(139 + (59 - 139) * s);
      const g = Math.round(92 + (130 - 92) * s);
      const b = Math.round(246 + (246 - 246) * s);
      return `rgb(${r},${g},${b})`;
    } else {
      const s = (tn - 0.5) * 2;
      const r = Math.round(59 + (6 - 59) * s);
      const g = Math.round(130 + (182 - 130) * s);
      const b = Math.round(246 + (212 - 246) * s);
      return `rgb(${r},${g},${b})`;
    }
  }

  if (mode === 'time') {
    const r = Math.round(16 + t * (247 - 16));
    const g = Math.round(185 + t * (37 - 185));
    const b = Math.round(129 + t * (133 - 129));
    return `rgb(${r},${g},${b})`;
  }

  const r = Math.round(59 + t * (247 - 59));
  const g = Math.round(130 + t * (37 - 130));
  const b = Math.round(246 + t * (133 - 246));
  return `rgb(${r},${g},${b})`;
}

const schemeToMode: Record<ColorScheme, 'magnetization' | 'time' | 'energy'> = {
  magnetic: 'magnetization',
  thermal: 'time',
  energy: 'energy'
};

export default function Heatmap2D({
  data,
  title,
  colorMode,
  colorScheme,
  unit,
  min,
  max,
  showColorbar = true
}: Heatmap2DProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const effectiveMode = colorMode || (colorScheme ? schemeToMode[colorScheme] : 'magnetization');

  const heatmapData = useMemo(() => data || generateHeatmapData(20, 10, effectiveMode), [data, effectiveMode]);

  const { dataMin, dataMax } = useMemo(() => {
    let dMin = Infinity;
    let dMax = -Infinity;
    heatmapData.forEach((row) => {
      row.forEach((v) => {
        dMin = Math.min(dMin, v);
        dMax = Math.max(dMax, v);
      });
    });
    return { dataMin: min ?? dMin, dataMax: max ?? dMax };
  }, [heatmapData, min, max]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = container.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    canvas.style.width = `${rect.width}px`;
    canvas.style.height = `${rect.height}px`;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.scale(dpr, dpr);

    const cols = heatmapData[0]?.length || 20;
    const rows = heatmapData.length || 10;
    const padding = showColorbar ? 40 : 10;
    const cellW = (rect.width - padding - 10) / cols;
    const cellH = (rect.height - 30) / rows;

    ctx.clearRect(0, 0, rect.width, rect.height);

    heatmapData.forEach((row, y) => {
      row.forEach((val, x) => {
        ctx.fillStyle = getColor(val, dataMin, dataMax, effectiveMode);
        ctx.fillRect(10 + x * cellW, 10 + y * cellH, cellW - 1, cellH - 1);
      });
    });

    if (showColorbar) {
      const cbX = rect.width - 28;
      const cbY = 10;
      const cbW = 14;
      const cbH = rect.height - 30;
      const steps = 50;

      for (let i = 0; i < steps; i++) {
        const t = i / (steps - 1);
        const v = dataMin + (dataMax - dataMin) * (1 - t);
        ctx.fillStyle = getColor(v, dataMin, dataMax, effectiveMode);
        ctx.fillRect(cbX, cbY + (cbH / steps) * i, cbW, cbH / steps + 1);
      }

      ctx.fillStyle = chartThemeColors.textMuted;
      ctx.font = '10px JetBrains Mono, monospace';
      ctx.textAlign = 'left';
      const maxLabel = unit ? `${dataMax.toFixed(2)} ${unit}` : dataMax.toFixed(2);
      const minLabel = unit ? `${dataMin.toFixed(2)} ${unit}` : dataMin.toFixed(2);
      ctx.fillText(maxLabel, cbX + cbW + 4, cbY + 8);
      ctx.fillText(minLabel, cbX + cbW + 4, cbY + cbH);
    }
  }, [heatmapData, dataMin, dataMax, effectiveMode, showColorbar, unit]);

  return (
    <div className="w-full h-full min-h-[240px] flex flex-col">
      {title && (
        <div className="text-xs font-medium text-text-secondary mb-2">
          {title}
          {unit && <span className="text-text-muted ml-1">({unit})</span>}
        </div>
      )}
      <div ref={containerRef} className="flex-1 min-h-0 relative rounded-lg overflow-hidden bg-black/20">
        <canvas ref={canvasRef} className="w-full h-full" />
      </div>
    </div>
  );
}
