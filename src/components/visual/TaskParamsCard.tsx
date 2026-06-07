import { motion } from 'framer-motion';
import { Box } from 'lucide-react';
import GlassCard from '@/components/ui/GlassCard';
import type { SimulationTask } from '@/types';

interface TaskParamsCardProps {
  task?: SimulationTask;
}

function formatDate(date?: Date) {
  if (!date) return '-';
  return new Date(date).toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function TaskParamsCard({ task }: TaskParamsCardProps) {
  const items = [
    { label: '材料', value: task?.materialParams.materialType },
    { label: '器件形状', value: task?.geometry.shape, capitalize: true },
    {
      label: '尺寸(L/W/T)',
      value: task
        ? `${task.geometry.length.toFixed(0)}×${task.geometry.width.toFixed(0)}×${task.geometry.thickness.toFixed(1)} nm`
        : undefined,
    },
    { label: '网格尺寸', value: task ? `${task.geometry.meshSize.toFixed(1)} nm` : undefined },
  ];

  const magItems = [
    {
      label: '饱和磁化 Ms',
      value: task ? `${(task.materialParams.saturationMagnetization / 1000).toFixed(0)} kA/m` : undefined,
    },
    { label: '阻尼系数 α', value: task?.materialParams.dampingCoefficient.toFixed(3) },
    { label: '模拟时长', value: task ? `${task.config.simulationTime.toFixed(1)} ns` : undefined },
    { label: '翻转阈值', value: task ? `${task.config.flipTimeThreshold.toFixed(2)} ns` : undefined },
  ];

  const metaItems = [
    { label: '提交者', value: task?.submittedBy },
    { label: '创建时间', value: formatDate(task?.createdAt), mono: true, small: true },
  ];

  const renderRow = (label: string, value?: string, opts?: { capitalize?: boolean; mono?: boolean; small?: boolean }) => (
    <div className="flex justify-between">
      <span className="text-text-muted">{label}</span>
      <span
        className={[
          'text-text-primary',
          opts?.mono && 'font-mono',
          opts?.small && 'text-[11px]',
          opts?.capitalize && 'capitalize',
        ]
          .filter(Boolean)
          .join(' ')}
      >
        {value ?? '-'}
      </span>
    </div>
  );

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.12 }}
    >
      <GlassCard padding="md">
        <div className="flex items-center gap-2 mb-4">
          <Box className="w-4 h-4 text-accent-cyan" />
          <span className="text-sm font-medium text-text-primary">任务参数</span>
        </div>
        <div className="space-y-3 text-xs">
          {items.map((it) => renderRow(it.label, it.value, { capitalize: it.capitalize, mono: true }))}
          <div className="h-px bg-border-primary" />
          {magItems.map((it) => renderRow(it.label, it.value, { mono: true }))}
          <div className="h-px bg-border-primary" />
          {metaItems.map((it) => renderRow(it.label, it.value, { mono: it.mono, small: it.small }))}
        </div>
      </GlassCard>
    </motion.div>
  );
}
