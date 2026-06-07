import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import Heatmap2D from '@/components/charts/Heatmap2D';
import type { VortexState } from '@/types';

interface VortexDetectionPanelProps {
  vortexStates?: VortexState[];
  heatmapData?: number[][];
}

function generateHeatmap(): number[][] {
  const rows = 16;
  const cols = 32;
  const data: number[][] = [];
  for (let y = 0; y < rows; y++) {
    const row: number[] = [];
    for (let x = 0; x < cols; x++) {
      const cx = cols / 2 + Math.sin(y * 0.3) * 4;
      const dx = (x - cx) / 5;
      const dy = (y - rows / 2) / 5;
      const r = Math.sqrt(dx * dx + dy * dy);
      row.push((Math.atan2(dy, dx) / Math.PI) * Math.exp(-r * 0.3));
    }
    data.push(row);
  }
  return data;
}

export default function VortexDetectionPanel({
  vortexStates,
  heatmapData,
}: VortexDetectionPanelProps) {
  const defaultHeatmap = useMemo(generateHeatmap, []);
  const data = heatmapData ?? defaultHeatmap;
  const states = vortexStates ?? [
    { time: 2.5, position: [100, 50, 2], topologicalCharge: 1 },
    { time: 5.0, position: [120, 60, 2], topologicalCharge: -1 },
  ];

  return (
    <motion.div
      key="vortex"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="space-y-4"
    >
      <div className="h-[260px] rounded-lg overflow-hidden border border-border-primary p-3">
        <Heatmap2D data={data} colorScheme="magnetic" title="拓扑电荷分布" unit="Q" />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {states.map((v, i) => (
          <div
            key={i}
            className="glass-subtle rounded-lg p-3 border border-border-primary"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] text-text-muted font-mono">
                VORTEX_{String(i + 1).padStart(2, '0')}
              </span>
              <span
                className={cn(
                  'text-[10px] font-mono font-medium px-1.5 py-0.5 rounded',
                  v.topologicalCharge > 0
                    ? 'bg-accent-pink/15 text-accent-pink'
                    : 'bg-accent-cyan/15 text-accent-cyan'
                )}
              >
                Q = {v.topologicalCharge > 0 ? '+' : ''}
                {v.topologicalCharge}
              </span>
            </div>
            <div className="space-y-1 text-[11px]">
              <div className="flex justify-between">
                <span className="text-text-muted">出现时间</span>
                <span className="text-text-primary font-mono">{v.time.toFixed(2)} ns</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-muted">位置 (x,y)</span>
                <span className="text-text-primary font-mono">
                  ({v.position[0].toFixed(0)}, {v.position[1].toFixed(0)})
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
