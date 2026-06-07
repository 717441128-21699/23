import { motion } from 'framer-motion';
import {
  FileCheck2, Grid3x3, Cpu, Calculator, CheckCircle2, AlertTriangle,
} from 'lucide-react';
import { TaskStatus } from '@/types';
import { cn } from '@/lib/utils';

export interface TimelineNode {
  key: TaskStatus | 'completed' | 'abnormal';
  label: string;
  Icon: typeof FileCheck2;
  duration?: string;
}

const defaultNodes: TimelineNode[] = [
  { key: TaskStatus.PENDING_VERIFY, label: '待校验', Icon: FileCheck2 },
  { key: TaskStatus.GRID_GENERATION, label: '网格生成', Icon: Grid3x3 },
  { key: TaskStatus.INITIALIZATION, label: '初始化', Icon: Cpu },
  { key: TaskStatus.MICROMAG_CALC, label: '微磁计算', Icon: Calculator },
  { key: 'completed', label: '完成', Icon: CheckCircle2 },
];

const abnormalNode: TimelineNode = {
  key: 'abnormal', label: '异常', Icon: AlertTriangle,
};

export interface TaskTimelineProps {
  currentStatus: TaskStatus;
  durations?: Partial<Record<TimelineNode['key'], string>>;
  className?: string;
}

const statusOrder: TaskStatus[] = [
  TaskStatus.PENDING_VERIFY,
  TaskStatus.GRID_GENERATION,
  TaskStatus.INITIALIZATION,
  TaskStatus.MICROMAG_CALC,
  TaskStatus.COMPLETED,
];

function getNodeState(nodeKey: TimelineNode['key'], current: TaskStatus): 'done' | 'active' | 'pending' | 'abnormal' {
  if (current === TaskStatus.ABNORMAL) {
    if (nodeKey === 'abnormal') return 'abnormal';
    const idx = statusOrder.findIndex(s => s === nodeKey);
    const currentIdx = statusOrder.indexOf(TaskStatus.MICROMAG_CALC);
    return idx <= currentIdx ? 'done' : 'pending';
  }
  if (nodeKey === 'abnormal') return 'pending';
  if (nodeKey === 'completed') {
    return current === TaskStatus.COMPLETED ? 'done' : 'pending';
  }
  const nodeIdx = statusOrder.indexOf(nodeKey as TaskStatus);
  const currentIdx = statusOrder.indexOf(current);
  if (currentIdx === -1) return 'pending';
  if (nodeIdx < currentIdx) return 'done';
  if (nodeIdx === currentIdx) return 'active';
  return 'pending';
}

export default function TaskTimeline({ currentStatus, durations, className }: TaskTimelineProps) {
  const nodes = currentStatus === TaskStatus.ABNORMAL
    ? [...defaultNodes.slice(0, 4), abnormalNode]
    : defaultNodes;

  return (
    <div className={cn('relative py-2', className)}>
      <div className="absolute left-5 top-0 bottom-0 w-px bg-gradient-to-b from-magnetic-blue/30 via-magnetic-purple/20 to-transparent" />
      <div className="space-y-5">
        {nodes.map((node, idx) => {
          const state = getNodeState(node.key, currentStatus);
          const { Icon } = node;
          return (
            <motion.div
              key={node.key}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: idx * 0.08 }}
              className="relative flex items-start gap-4"
            >
              <div className="relative z-10">
                <motion.div
                  animate={state === 'active' ? {
                    scale: [1, 1.08, 1],
                    boxShadow: [
                      '0 0 0 rgba(79, 142, 247, 0)',
                      '0 0 20px rgba(79, 142, 247, 0.5)',
                      '0 0 0 rgba(79, 142, 247, 0)',
                    ],
                  } : {}}
                  transition={state === 'active' ? {
                    duration: 2, repeat: Infinity, ease: 'easeInOut',
                  } : {}}
                  className={cn(
                    'w-10 h-10 rounded-xl flex items-center justify-center border-2 transition-all duration-300',
                    state === 'done' && 'bg-status-success/15 border-status-success/50 text-status-success',
                    state === 'active' && 'bg-magnetic-blue/20 border-magnetic-blue text-magnetic-blue shadow-glow-blue',
                    state === 'pending' && 'bg-space-800/50 border-white/10 text-gray-500',
                    state === 'abnormal' && 'bg-status-danger/15 border-status-danger/50 text-status-danger shadow-glow-blue',
                  )}
                >
                  {state === 'done' && node.key !== 'abnormal' ? (
                    <CheckCircle2 className="w-5 h-5" />
                  ) : (
                    <Icon className="w-5 h-5" />
                  )}
                </motion.div>
              </div>

              <div className="flex-1 pt-1.5">
                <div className="flex items-center justify-between gap-2">
                  <p className={cn(
                    'font-semibold text-sm',
                    state === 'done' && 'text-gray-200',
                    state === 'active' && 'text-magnetic-blue',
                    state === 'pending' && 'text-gray-500',
                    state === 'abnormal' && 'text-status-danger',
                  )}>
                    {node.label}
                    {state === 'active' && (
                      <motion.span
                        animate={{ opacity: [0.4, 1, 0.4] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                        className="ml-2 text-xs font-normal text-magnetic-blue"
                      >
                        进行中
                      </motion.span>
                    )}
                  </p>
                  {durations?.[node.key] && (
                    <span className={cn(
                      'text-xs px-2 py-0.5 rounded-md',
                      state === 'pending'
                        ? 'text-gray-600 bg-space-800/30'
                        : state === 'abnormal'
                        ? 'text-status-danger bg-status-danger/10'
                        : 'text-gray-400 bg-space-800/40'
                    )}>
                      {durations[node.key]}
                    </span>
                  )}
                </div>
                <p className={cn(
                  'text-xs mt-0.5',
                  state === 'pending' ? 'text-gray-600' : 'text-gray-500',
                )}>
                  {state === 'done' && node.key === 'completed' && '模拟已完成，结果已入库'}
                  {state === 'done' && node.key !== 'completed' && node.key !== 'abnormal' && '步骤已完成'}
                  {state === 'active' && '正在执行当前步骤...'}
                  {state === 'pending' && '等待执行'}
                  {state === 'abnormal' && '检测到异常，需人工复核'}
                </p>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
