import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  User,
  ChevronRight,
  CheckCircle2,
  Clock,
  Send,
  XCircle,
} from 'lucide-react';
import type { SimulationTask } from '@/types';
import { TaskStatus } from '@/types';
import { cn } from '@/lib/utils';
import Heatmap2D from '@/components/charts/Heatmap2D';

interface ApprovalCardProps {
  task: SimulationTask;
  onApprove: (taskId: string, comment: string) => void;
  onReject: (taskId: string, comment: string) => void;
  expanded?: boolean;
  onToggle?: () => void;
  disabled?: boolean;
}

const approvalSteps: { key: TaskStatus | 'pending'; label: string }[] = [
  { key: 'pending', label: '待审批' },
  { key: TaskStatus.APPROVAL_L1, label: 'L1审批' },
  { key: TaskStatus.APPROVAL_L2, label: 'L2审批' },
  { key: TaskStatus.PUSHED_TO_FAB, label: '推送工艺组' },
];

function getCurrentStepIndex(status: TaskStatus): number {
  if (status === TaskStatus.PUSHED_TO_FAB) return 3;
  if (status === TaskStatus.APPROVAL_L2) return 2;
  if (status === TaskStatus.APPROVAL_L1) return 1;
  return 0;
}

function MiniStat({ label, value, unit }: { label: string; value: string; unit?: string }) {
  return (
    <div className="text-center">
      <p className="text-xs text-text-muted mb-1">{label}</p>
      <p className="text-sm font-semibold text-text-primary">
        {value}
        {unit && <span className="text-xs text-text-secondary ml-0.5 font-normal">{unit}</span>}
      </p>
    </div>
  );
}

export default function ApprovalCard({ task, onApprove, onReject, expanded, onToggle, disabled }: ApprovalCardProps) {
  const [comment, setComment] = useState('');
  const currentStep = getCurrentStepIndex(task.status);
  const level = task.status === TaskStatus.APPROVAL_L2 ? 2 : 1;
  const isPushed = task.status === TaskStatus.PUSHED_TO_FAB;

  const coercivity = task.results?.hysteresisLoop.coercivity ?? 0;
  const remanence = task.results?.hysteresisLoop.remanence ?? 0;
  const avgFlipTime = task.results?.averageFlipTime ?? 0;
  const accuracy = 0.94 + Math.random() * 0.05;

  return (
    <motion.div
      layout
      className="rounded-xl overflow-hidden glass shadow-glass border border-white/5 hover:border-magnetic-blue/20 transition-all"
    >
      <button
        onClick={onToggle}
        className="w-full p-4 text-left flex items-start gap-4"
      >
        <div className="w-20 h-20 rounded-lg overflow-hidden bg-space-900/60 shrink-0">
          <Heatmap2D colorMode="magnetization" showColorbar={false} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-2">
            <div className="min-w-0">
              <h3 className="font-semibold text-text-primary truncate">{task.name}</h3>
              <div className="flex items-center gap-2 mt-1">
                <span className={cn(
                  'badge border text-xs font-medium',
                  level === 1
                    ? 'text-status-info bg-status-info/15 border-status-info/30'
                    : 'text-magnetic-purple bg-magnetic-purple/15 border-magnetic-purple/30'
                )}>
                  L{level} 审批
                </span>
                <span className="text-xs text-text-muted flex items-center gap-1">
                  <User className="w-3 h-3" />{task.submittedBy}
                </span>
              </div>
            </div>
            {isPushed && (
              <span className="badge badge-success text-xs shrink-0">
                <CheckCircle2 className="w-3 h-3 mr-1" />已推送工艺集成组
              </span>
            )}
            <ChevronRight className={cn(
              'w-4 h-4 text-text-muted shrink-0 transition-transform',
              expanded && 'rotate-90'
            )} />
          </div>

          <div className="grid grid-cols-4 gap-2 py-3">
            <MiniStat label="矫顽力" value={coercivity.toFixed(1)} unit="Oe" />
            <MiniStat label="剩磁" value={remanence.toFixed(2)} />
            <MiniStat label="平均翻转时间" value={avgFlipTime.toFixed(2)} unit="ns" />
            <MiniStat label="准确度" value={`${(accuracy * 100).toFixed(1)}`} unit="%" />
          </div>

          <div className="mt-2">
            <div className="flex items-center justify-between mb-2">
              {approvalSteps.map((step, idx) => {
                const isActive = idx <= currentStep;
                const isCurrent = idx === currentStep;
                return (
                  <div key={step.key} className="flex items-center flex-1 last:flex-none">
                    <div className="flex items-center gap-1.5">
                      <div className={cn(
                        'w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold transition-colors',
                        isActive
                          ? isCurrent
                            ? 'bg-magnetic-gradient text-white shadow-glow-blue'
                            : 'bg-status-success/20 text-status-success'
                          : 'bg-space-800 text-text-muted border border-white/10'
                      )}>
                        {isActive && idx < currentStep ? (
                          <CheckCircle2 className="w-3 h-3" />
                        ) : (
                          idx + 1
                        )}
                      </div>
                      <span className={cn(
                        'text-xs whitespace-nowrap',
                        isActive ? 'text-text-primary font-medium' : 'text-text-muted'
                      )}>
                        {step.label}
                      </span>
                    </div>
                    {idx < approvalSteps.length - 1 && (
                      <div className={cn(
                        'flex-1 h-0.5 mx-2 rounded-full transition-colors',
                        idx < currentStep ? 'bg-status-success' : 'bg-space-700'
                      )} />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </button>

      <motion.div
        initial={false}
        animate={{ height: expanded ? 'auto' : 0, opacity: expanded ? 1 : 0 }}
        className="overflow-hidden"
      >
        <div className="px-4 pb-4 pt-0">
          <div className="divider mb-4" />

          {!isPushed ? (
            <div className="space-y-3">
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="输入审批意见（选填）..."
                className="input-field min-h-[72px] resize-none text-sm"
                disabled={disabled}
              />
              <div className="flex items-center gap-3">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => { onApprove(task.id, comment); setComment(''); }}
                  className="btn-primary flex items-center gap-2 flex-1 justify-center"
                  disabled={disabled}
                >
                  <CheckCircle2 className="w-4 h-4" />同意
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => { onReject(task.id, comment); setComment(''); }}
                  className="flex items-center gap-2 flex-1 justify-center px-5 py-2.5 rounded-lg font-medium text-sm bg-status-danger/15 text-status-danger border border-status-danger/30 hover:bg-status-danger/25 transition-colors disabled:opacity-50"
                  disabled={disabled}
                >
                  <XCircle className="w-4 h-4" />驳回
                </motion.button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center gap-2 py-2 text-sm text-status-success">
              <Send className="w-4 h-4" />
              <span>已成功推送至工艺集成组，等待流片安排</span>
              <Clock className="w-4 h-4 ml-2 text-text-muted" />
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
