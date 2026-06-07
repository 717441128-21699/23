import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ClipboardList,
  FileText,
  History,
  Send,
  Clock,
  User,
  CheckCircle2,
  XCircle,
  Loader2,
} from 'lucide-react';
import GlassCard from '@/components/ui/GlassCard';
import ApprovalCard from '@/components/ui/ApprovalCard';
import { useTaskStore } from '@/store/taskStore';
import { useSettingsStore } from '@/store/settingsStore';
import { fetchApprovals, submitApproval as apiSubmitApproval } from '@/services/approvalApi';
import { TaskStatus } from '@/types';
import type { ApprovalRecord, SimulationTask } from '@/types';
import { cn } from '@/lib/utils';
import Heatmap2D from '@/components/charts/Heatmap2D';

type ApprovalTab = 'l1' | 'l2' | 'approved' | 'pushed';

const tabs: { key: ApprovalTab; label: string; icon: typeof ClipboardList }[] = [
  { key: 'l1', label: '待我审批(L1)', icon: ClipboardList },
  { key: 'l2', label: '待我审批(L2)', icon: ClipboardList },
  { key: 'approved', label: '已审批', icon: FileText },
  { key: 'pushed', label: '已推送工艺组', icon: Send },
];

function getStatusFilter(tab: ApprovalTab): TaskStatus[] {
  switch (tab) {
    case 'l1': return [TaskStatus.APPROVAL_L1];
    case 'l2': return [TaskStatus.APPROVAL_L2];
    case 'approved': return [TaskStatus.APPROVAL_L1, TaskStatus.APPROVAL_L2, TaskStatus.PUSHED_TO_FAB];
    case 'pushed': return [TaskStatus.PUSHED_TO_FAB];
  }
}

function formatTime(date: Date): string {
  return new Date(date).toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
}

function TimelineItem({ record, isLast }: { record: ApprovalRecord; isLast: boolean }) {
  return (
    <div className="flex items-start gap-3">
      <div className="relative">
        <div className={cn(
          'w-7 h-7 rounded-full flex items-center justify-center',
          record.decision === 'approved' ? 'bg-status-success/20' : 'bg-status-danger/20'
        )}>
          {record.decision === 'approved'
            ? <CheckCircle2 className="w-4 h-4 text-status-success" />
            : <XCircle className="w-4 h-4 text-status-danger" />}
        </div>
        {!isLast && <div className="absolute left-1/2 top-7 w-px h-6 -translate-x-1/2 bg-white/10" />}
      </div>
      <div className="flex-1 pb-3">
        <div className="flex items-center gap-2 text-xs flex-wrap">
          <span className={cn(
            'badge border text-[10px]',
            record.level === 1
              ? 'text-status-info bg-status-info/15 border-status-info/30'
              : 'text-magnetic-purple bg-magnetic-purple/15 border-magnetic-purple/30'
          )}>L{record.level}</span>
          <span className="text-text-primary font-medium flex items-center gap-1">
            <User className="w-3 h-3" />{record.approver}
          </span>
          <span className="text-text-muted flex items-center gap-1">
            <Clock className="w-3 h-3" />{formatTime(record.timestamp)}
          </span>
        </div>
        {record.comment && <p className="text-xs text-text-secondary mt-1">{record.comment}</p>}
      </div>
    </div>
  );
}

function ParamItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="p-3 rounded-lg bg-space-800/50">
      <p className="text-text-muted mb-1 text-xs">{label}</p>
      <p className="text-text-primary font-mono text-xs">{value}</p>
    </div>
  );
}

function DetailPanel({ task, approvals }: { task: SimulationTask; approvals: ApprovalRecord[] }) {
  const history = approvals.filter(a => a.taskId === task.id);
  const p = task.materialParams;
  const g = task.geometry;

  return (
    <div className="mt-4 p-5 rounded-xl bg-space-900/50 border border-magnetic-blue/10">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div>
          <h4 className="text-sm font-semibold text-text-primary mb-3 flex items-center gap-2">
            <FileText className="w-4 h-4 text-magnetic-blue" />完整参数
          </h4>
          <div className="grid grid-cols-2 gap-3">
            <ParamItem label="饱和磁化强度" value={`${(p.saturationMagnetization / 1000).toFixed(1)} kA/m`} />
            <ParamItem label="各向异性常数" value={`${(p.anisotropyConstant / 1000).toFixed(1)} kJ/m³`} />
            <ParamItem label="交换刚度" value={`${(p.exchangeStiffness * 1e12).toFixed(2)} pJ/m`} />
            <ParamItem label="阻尼系数" value={p.dampingCoefficient.toFixed(3)} />
            <ParamItem label="器件尺寸" value={`${g.length.toFixed(0)}×${g.width.toFixed(0)} nm`} />
            <ParamItem label="温度" value={`${p.temperature.toFixed(0)} K`} />
          </div>
        </div>
        <div className="space-y-5">
          <div>
            <h4 className="text-sm font-semibold text-text-primary mb-3 flex items-center gap-2">
              <FileText className="w-4 h-4 text-magnetic-purple" />报告预览
            </h4>
            <div className="h-40 rounded-lg overflow-hidden bg-space-800/50 border border-white/5">
              <Heatmap2D colorMode="energy" showColorbar={false} />
            </div>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-text-primary mb-3 flex items-center gap-2">
              <History className="w-4 h-4 text-status-info" />审批历史
            </h4>
            <div className="space-y-1">
              {history.length === 0 ? (
                <p className="text-xs text-text-muted py-2 text-center">暂无审批记录</p>
              ) : (
                history.map((r, i) => <TimelineItem key={r.id} record={r} isLast={i === history.length - 1} />)
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Approval() {
  const [activeTab, setActiveTab] = useState<ApprovalTab>('l1');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState<string | null>(null);
  const { tasks, loadTasks } = useTaskStore();
  const { showToast } = useSettingsStore();
  const [approvals, setApprovals] = useState<ApprovalRecord[]>([]);

  const refresh = async () => {
    try {
      setLoading(true);
      await Promise.all([
        loadTasks(),
        fetchApprovals().then(setApprovals),
      ]);
    } catch (err) {
      showToast(err instanceof Error ? err.message : '加载数据失败', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  const filtered = tasks.filter((t) => getStatusFilter(activeTab).includes(t.status));

  const handleApprove = async (taskId: string, comment: string) => {
    try {
      setSubmitting(taskId);
      const task = tasks.find((t) => t.id === taskId);
      const level = task?.status === TaskStatus.APPROVAL_L2 ? 2 : 1;
      await apiSubmitApproval({
        taskId,
        level,
        approver: '当前用户',
        decision: 'approved',
        comment,
      });
      showToast('审批通过', 'success');
      await refresh();
    } catch (err) {
      showToast(err instanceof Error ? err.message : '审批失败', 'error');
    } finally {
      setSubmitting(null);
    }
  };

  const handleReject = async (taskId: string, comment: string) => {
    try {
      setSubmitting(taskId);
      const task = tasks.find((t) => t.id === taskId);
      const level = task?.status === TaskStatus.APPROVAL_L2 ? 2 : 1;
      await apiSubmitApproval({
        taskId,
        level,
        approver: '当前用户',
        decision: 'rejected',
        comment: comment || '参数需重新核查',
      });
      showToast('已驳回', 'success');
      await refresh();
    } catch (err) {
      showToast(err instanceof Error ? err.message : '操作失败', 'error');
    } finally {
      setSubmitting(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-magnetic-blue" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gradient">审批流程中心</h1>
        <p className="text-sm text-text-secondary mt-1">模拟任务结果的多级审批与工艺推送</p>
      </div>

      <GlassCard padding="sm" hover={false}>
        <div className="flex items-center gap-1 p-1 overflow-x-auto scrollbar-thin">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.key;
            const count = tasks.filter((t) => getStatusFilter(tab.key).includes(t.status)).length;
            const TabIcon = tab.icon;
            return (
              <motion.button
                key={tab.key}
                whileTap={{ scale: 0.97 }}
                onClick={() => setActiveTab(tab.key)}
                className={cn(
                  'flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all relative',
                  isActive ? 'text-white' : 'text-text-secondary hover:text-text-primary hover:bg-white/5'
                )}
              >
                {isActive && (
                  <motion.div
                    layoutId="approval-tab-bg"
                    className="absolute inset-0 rounded-lg bg-magnetic-gradient"
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  />
                )}
                <TabIcon className="w-4 h-4 relative z-10" />
                <span className="relative z-10">{tab.label}</span>
                <span className={cn(
                  'relative z-10 text-[11px] px-2 py-0.5 rounded-full',
                  isActive ? 'bg-white/20' : 'bg-space-800 text-text-muted'
                )}>{count}</span>
              </motion.button>
            );
          })}
        </div>
      </GlassCard>

      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="grid grid-cols-1 xl:grid-cols-2 gap-5"
        >
          {filtered.length === 0 ? (
            <div className="col-span-full">
              <GlassCard>
                <div className="py-12 text-center">
                  <ClipboardList className="w-12 h-12 mx-auto mb-3 text-text-muted/50" />
                  <p className="text-text-secondary">当前分类暂无审批任务</p>
                </div>
              </GlassCard>
            </div>
          ) : (
            filtered.map((task) => (
              <div key={task.id}>
                <ApprovalCard
                  task={task}
                  onApprove={handleApprove}
                  onReject={handleReject}
                  expanded={expandedId === task.id}
                  onToggle={() => setExpandedId(expandedId === task.id ? null : task.id)}
                  disabled={submitting === task.id}
                />
                {expandedId === task.id && <DetailPanel task={task} approvals={approvals} />}
              </div>
            ))
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
