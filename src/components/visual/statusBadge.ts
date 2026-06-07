import {
  Layers,
  Zap,
  Gauge,
  AlertCircle,
  CheckCircle2,
  PlayCircle,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { TaskStatus } from '@/types';

export interface StatusBadgeInfo {
  label: string;
  className: string;
  icon: LucideIcon;
}

export const statusBadgeMap: Record<TaskStatus, StatusBadgeInfo> = {
  [TaskStatus.PENDING_VERIFY]: { label: '待审核', className: 'badge badge-info', icon: Gauge },
  [TaskStatus.GRID_GENERATION]: { label: '网格生成中', className: 'badge badge-info', icon: Layers },
  [TaskStatus.INITIALIZATION]: { label: '初始化中', className: 'badge badge-info', icon: Zap },
  [TaskStatus.MICROMAG_CALC]: { label: '计算中', className: 'badge badge-info', icon: PlayCircle },
  [TaskStatus.COMPLETED]: { label: '已完成', className: 'badge badge-success', icon: CheckCircle2 },
  [TaskStatus.APPROVAL_L1]: { label: 'L1审批中', className: 'badge badge-warning', icon: Gauge },
  [TaskStatus.APPROVAL_L2]: { label: 'L2审批中', className: 'badge badge-warning', icon: Gauge },
  [TaskStatus.PUSHED_TO_FAB]: { label: '已推送到Fab', className: 'badge badge-success', icon: CheckCircle2 },
  [TaskStatus.WARNING]: { label: '有警告', className: 'badge badge-warning', icon: AlertCircle },
  [TaskStatus.ABNORMAL]: { label: '异常', className: 'badge badge-danger', icon: AlertCircle },
};
