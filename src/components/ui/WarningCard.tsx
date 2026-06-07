import { AlertTriangle, Zap, Clock, Flame, Check, X, SlidersHorizontal } from 'lucide-react';
import type { WarningRecord, WarningType } from '@/types';
import { cn } from '@/lib/utils';

interface WarningCardProps {
  warning: WarningRecord;
  taskName?: string;
  onAccept?: () => void;
  onRecalculate?: () => void;
  onReject?: () => void;
  showParamPanel?: boolean;
  children?: React.ReactNode;
}

const warningConfig: Record<WarningType, {
  label: string;
  badgeClass: string;
  barClass: string;
  iconClass: string;
  Icon: typeof AlertTriangle;
}> = {
  flip_time_threshold: {
    label: '翻转时间超阈值',
    badgeClass: 'bg-orange-500/15 text-orange-400 border-orange-500/30',
    barClass: 'bg-gradient-to-b from-orange-400 to-orange-600',
    iconClass: 'text-orange-400',
    Icon: Clock
  },
  vortex_state: {
    label: '涡旋态',
    badgeClass: 'bg-purple-500/15 text-purple-400 border-purple-500/30',
    barClass: 'bg-gradient-to-b from-purple-400 to-purple-600',
    iconClass: 'text-purple-400',
    Icon: Zap
  },
  energy_anomaly: {
    label: '能量异常',
    badgeClass: 'bg-red-500/15 text-red-400 border-red-500/30',
    barClass: 'bg-gradient-to-b from-red-400 to-red-600',
    iconClass: 'text-red-400',
    Icon: Flame
  }
};

function getRelativeTime(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - new Date(date).getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return '刚刚';
  if (minutes < 60) return `${minutes}分钟前`;
  if (hours < 24) return `${hours}小时前`;
  return `${days}天前`;
}

export default function WarningCard({
  warning,
  taskName,
  onAccept,
  onRecalculate,
  onReject,
  showParamPanel,
  children
}: WarningCardProps) {
  const config = warningConfig[warning.type];
  const { Icon } = config;

  return (
    <div className={cn(
      'glass-card relative overflow-hidden transition-all duration-300',
      warning.reviewed && 'opacity-70'
    )}>
      <div className={cn('absolute left-0 top-0 bottom-0 w-1.5 rounded-l-xl', config.barClass)} />

      <div className="p-5 pl-6">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className={cn(
              'w-10 h-10 rounded-lg flex items-center justify-center',
              warning.type === 'flip_time_threshold' && 'bg-orange-500/10',
              warning.type === 'vortex_state' && 'bg-purple-500/10',
              warning.type === 'energy_anomaly' && 'bg-red-500/10'
            )}>
              <Icon className={cn('w-5 h-5', config.iconClass)} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-text-primary">{config.label}</h3>
                <span className={cn('badge text-xs', config.badgeClass)}>
                  {warning.reviewed ? (warning.action === 'accept' ? '已通过' : warning.action === 'reject' ? '已驳回' : '已重算') : '待处理'}
                </span>
              </div>
              <p className="text-xs text-text-muted mt-0.5">
                {getRelativeTime(warning.triggerTime)}
                {taskName && <span className="mx-1.5">·</span>}
                {taskName}
              </p>
            </div>
          </div>
        </div>

        <p className="text-sm text-text-secondary leading-relaxed mb-4">
          {warning.message}
        </p>

        {!warning.reviewed && (
          <div className="flex items-center gap-2">
            <button
              onClick={onAccept}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium
                bg-success-500/10 text-success-400 border border-success-500/20
                hover:bg-success-500/20 hover:border-success-500/40 transition-all"
            >
              <Check className="w-3.5 h-3.5" />
              标记通过
            </button>
            <button
              onClick={onRecalculate}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
                showParamPanel
                  ? 'bg-info-500/20 text-info-300 border border-info-500/40'
                  : 'bg-info-500/10 text-info-400 border border-info-500/20 hover:bg-info-500/20 hover:border-info-500/40'
              )}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              调整参数重算
            </button>
            <button
              onClick={onReject}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium
                bg-danger-500/10 text-danger-400 border border-danger-500/20
                hover:bg-danger-500/20 hover:border-danger-500/40 transition-all"
            >
              <X className="w-3.5 h-3.5" />
              驳回
            </button>
          </div>
        )}

        {warning.reviewed && warning.reviewedBy && (
          <p className="text-xs text-text-muted">
            由 <span className="text-text-secondary">{warning.reviewedBy}</span> 处理于 {getRelativeTime(warning.reviewedAt!)}
          </p>
        )}
      </div>

      {showParamPanel && children && (
        <div className="border-t border-white/5 px-6 py-4 bg-black/10">
          {children}
        </div>
      )}
    </div>
  );
}
