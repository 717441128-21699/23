import { motion } from 'framer-motion';
import { CheckCircle2, Circle, Loader2, AlertTriangle, Clock } from 'lucide-react';
import { TaskStatus } from '@/types';
import { cn } from '@/lib/utils';

const statusOrder: { key: TaskStatus; label: string }[] = [
  { key: TaskStatus.PENDING_VERIFY, label: '待审核' },
  { key: TaskStatus.GRID_GENERATION, label: '网格生成' },
  { key: TaskStatus.INITIALIZATION, label: '初始化' },
  { key: TaskStatus.MICROMAG_CALC, label: '微磁计算' },
  { key: TaskStatus.COMPLETED, label: '已完成' },
];

const statusToIndex: Record<TaskStatus, number> = {
  [TaskStatus.PENDING_VERIFY]: 0,
  [TaskStatus.GRID_GENERATION]: 1,
  [TaskStatus.INITIALIZATION]: 2,
  [TaskStatus.MICROMAG_CALC]: 3,
  [TaskStatus.COMPLETED]: 4,
  [TaskStatus.APPROVAL_L1]: 4,
  [TaskStatus.APPROVAL_L2]: 4,
  [TaskStatus.PUSHED_TO_FAB]: 4,
  [TaskStatus.WARNING]: 3,
  [TaskStatus.ABNORMAL]: 3,
};

interface TaskTimelineProps {
  currentStatus: TaskStatus;
  className?: string;
}

function getStatusIcon(
  status: TaskStatus,
  itemStatus: 'done' | 'active' | 'pending' | 'warning'
) {
  if (status === TaskStatus.WARNING && itemStatus === 'active') {
    return <AlertTriangle className="w-4 h-4 text-warning" />;
  }
  if (status === TaskStatus.ABNORMAL && itemStatus === 'active') {
    return <AlertTriangle className="w-4 h-4 text-danger" />;
  }
  if (itemStatus === 'done') {
    return <CheckCircle2 className="w-4 h-4 text-success" />;
  }
  if (itemStatus === 'active') {
    return <Loader2 className="w-4 h-4 text-accent-blue animate-spin" />;
  }
  return <Circle className="w-4 h-4 text-text-muted" />;
}

export default function TaskTimeline({ currentStatus, className }: TaskTimelineProps) {
  const currentIdx = statusToIndex[currentStatus] ?? 0;
  const isAbnormal = currentStatus === TaskStatus.ABNORMAL;
  const isWarning = currentStatus === TaskStatus.WARNING;

  return (
    <div className={cn('w-full', className)}>
      <div className="flex items-center gap-2 mb-4">
        <Clock className="w-4 h-4 text-text-secondary" />
        <span className="text-sm font-medium text-text-primary">任务进度</span>
      </div>
      <div className="relative">
        <div className="absolute left-[7px] top-2 bottom-2 w-px bg-border-primary" />
        <div className="flex flex-col gap-4">
          {statusOrder.map((item, idx) => {
            let itemStatus: 'done' | 'active' | 'pending' = 'pending';
            if (idx < currentIdx) itemStatus = 'done';
            else if (idx === currentIdx) itemStatus = 'active';

            const showWarning =
              (isWarning || isAbnormal) && idx === currentIdx;

            return (
              <motion.div
                key={item.key}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.08 }}
                className="flex items-start gap-3 relative"
              >
                <div
                  className={cn(
                    'relative z-10 w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0',
                    itemStatus === 'active' && 'bg-bg-secondary'
                  )}
                >
                  {getStatusIcon(
                    currentStatus,
                    showWarning ? 'warning' : itemStatus
                  )}
                </div>
                <div className="flex-1 pb-1">
                  <div
                    className={cn(
                      'text-sm font-medium',
                      itemStatus === 'done' && 'text-text-primary',
                      itemStatus === 'active' && !showWarning && 'text-accent-blue',
                      showWarning && isWarning && 'text-warning',
                      showWarning && isAbnormal && 'text-danger',
                      itemStatus === 'pending' && 'text-text-muted'
                    )}
                  >
                    {item.label}
                  </div>
                  {itemStatus === 'active' && (
                    <div className="mt-1 flex items-center gap-2">
                      <div className="flex-1 h-1 bg-bg-secondary rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: '0%' }}
                          animate={{ width: '70%' }}
                          transition={{ duration: 2, ease: 'easeInOut' }}
                          className={cn(
                            'h-full rounded-full',
                            isAbnormal
                              ? 'bg-gradient-to-r from-danger to-danger/60'
                              : isWarning
                              ? 'bg-gradient-to-r from-warning to-warning/60'
                              : 'bg-gradient-to-r from-accent-blue via-accent-purple to-accent-cyan'
                          )}
                        />
                      </div>
                      <span className="text-[11px] font-mono text-text-muted">运行中</span>
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
