import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Doughnut } from 'react-chartjs-2';
import {
  LayoutDashboard, CheckSquare, Activity, AlertTriangle,
  Play, Clock, Check, X, RefreshCw,
} from 'lucide-react';
import GlassCard from '@/components/ui/GlassCard';
import StatCard from '@/components/ui/StatCard';
import WarningCard from '@/components/ui/WarningCard';
import { useTaskStore } from '@/store/taskStore';
import { useWarningStore } from '@/store/warningStore';
import { useStatsStore } from '@/store/statsStore';
import { mockTasks, mockWarnings, mockDailyStats } from '@/data/mockData';
import { TaskStatus } from '@/types';
import { cn } from '@/lib/utils';

const statusLabel: Record<TaskStatus, string> = {
  [TaskStatus.PENDING_VERIFY]: '待校验', [TaskStatus.GRID_GENERATION]: '网格生成',
  [TaskStatus.INITIALIZATION]: '初始化', [TaskStatus.MICROMAG_CALC]: '微磁计算',
  [TaskStatus.COMPLETED]: '已完成', [TaskStatus.ABNORMAL]: '异常',
  [TaskStatus.WARNING]: '预警', [TaskStatus.APPROVAL_L1]: 'L1审批',
  [TaskStatus.APPROVAL_L2]: 'L2审批', [TaskStatus.PUSHED_TO_FAB]: '已流片',
};

const statusColor: Record<TaskStatus, string> = {
  [TaskStatus.PENDING_VERIFY]: '#FF8A00', [TaskStatus.GRID_GENERATION]: '#6366F1',
  [TaskStatus.INITIALIZATION]: '#8B5CF6', [TaskStatus.MICROMAG_CALC]: '#4F8EF7',
  [TaskStatus.COMPLETED]: '#00C48C', [TaskStatus.ABNORMAL]: '#FF4757',
  [TaskStatus.WARNING]: '#F59E0B', [TaskStatus.APPROVAL_L1]: '#06B6D4',
  [TaskStatus.APPROVAL_L2]: '#17C3B2', [TaskStatus.PUSHED_TO_FAB]: '#9B51E0',
};

const statusBadge: Record<TaskStatus, string> = {
  [TaskStatus.PENDING_VERIFY]: 'bg-status-warning/15 text-status-warning border-status-warning/30',
  [TaskStatus.GRID_GENERATION]: 'bg-indigo-500/15 text-indigo-400 border-indigo-500/30',
  [TaskStatus.INITIALIZATION]: 'bg-magnetic-purple/15 text-magnetic-purple border-magnetic-purple/30',
  [TaskStatus.MICROMAG_CALC]: 'bg-magnetic-blue/15 text-magnetic-blue border-magnetic-blue/30',
  [TaskStatus.COMPLETED]: 'bg-status-success/15 text-status-success border-status-success/30',
  [TaskStatus.ABNORMAL]: 'bg-status-danger/15 text-status-danger border-status-danger/30',
  [TaskStatus.WARNING]: 'bg-warning-500/15 text-warning-400 border-warning-500/30',
  [TaskStatus.APPROVAL_L1]: 'bg-info-500/15 text-info-400 border-info-500/30',
  [TaskStatus.APPROVAL_L2]: 'bg-status-info/15 text-status-info border-status-info/30',
  [TaskStatus.PUSHED_TO_FAB]: 'bg-magnetic-purple/15 text-magnetic-purple border-magnetic-purple/30',
};

function formatTime(date: Date): string {
  const d = new Date(date);
  const diff = new Date().getTime() - d.getTime();
  const m = Math.floor(diff / 60000), h = Math.floor(diff / 3600000);
  if (m < 60) return `${m}分钟前`;
  if (h < 24) return `${h}小时前`;
  return d.toLocaleDateString('zh-CN');
}

export default function Dashboard() {
  const { tasks, isSystemPaused, toggleSystemPause } = useTaskStore();
  const { markReviewed, getUnreviewedWarnings } = useWarningStore();
  const { getTotalStats, dailyStats } = useStatsStore();

  useEffect(() => {
    if (useTaskStore.getState().tasks.length === 0) mockTasks.forEach(t => useTaskStore.getState().addTask(t));
    if (useWarningStore.getState().warnings.length === 0) mockWarnings.forEach(w => useWarningStore.getState().addWarning(w));
    if (useStatsStore.getState().dailyStats.length === 0) mockDailyStats.forEach(s => useStatsStore.getState().addStats(s));
  }, []);

  const stats = getTotalStats();
  const unreviewed = getUnreviewedWarnings();
  const today = dailyStats[dailyStats.length - 1];

  const statusCounts = tasks.reduce<Record<string, number>>((a, t) => { a[t.status] = (a[t.status] || 0) + 1; return a; }, {});
  const present = Object.keys(statusCounts) as TaskStatus[];

  const doughnutData = {
    labels: present.map(s => statusLabel[s]),
    datasets: [{
      data: present.map(s => statusCounts[s]),
      backgroundColor: present.map(s => statusColor[s]),
      borderColor: 'rgba(10, 22, 40, 0.8)', borderWidth: 2, hoverOffset: 6,
    }],
  };

  const doughnutOptions = {
    cutout: '65%',
    plugins: {
      legend: { position: 'right' as const, labels: { color: '#94A3B8', padding: 12, font: { size: 11 }, usePointStyle: true, pointStyle: 'circle' } },
      tooltip: { backgroundColor: 'rgba(10, 22, 40, 0.95)', borderColor: 'rgba(79, 142, 247, 0.3)', borderWidth: 1, titleColor: '#F1F5F9', bodyColor: '#94A3B8' },
    },
  };

  const recentTasks = [...tasks].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 5);
  const handleAction = (id: string, action: 'accept' | 'recalculate' | 'reject') => markReviewed(id, '当前用户', action);

  return (
    <div className="space-y-5">
      <AnimatePresence>
        {isSystemPaused && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
            className="flex items-center justify-between px-5 py-4 rounded-xl bg-status-danger/10 border border-status-danger/30">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-status-danger/20 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-status-danger" />
              </div>
              <div>
                <p className="font-semibold text-status-danger">系统已暂停</p>
                <p className="text-sm text-text-secondary">连续3次异常翻转，已通知首席科学家</p>
              </div>
            </div>
            <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={toggleSystemPause}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-status-danger/20 text-status-danger border border-status-danger/40 hover:bg-status-danger/30 font-medium text-sm">
              <Play className="w-4 h-4" />恢复系统
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      <div>
        <h1 className="text-2xl font-bold text-gray-100">工作台仪表盘</h1>
        <p className="text-sm text-gray-500 mt-1">微磁学模拟平台运行总览</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard icon={LayoutDashboard} title="今日任务数" value={today?.totalTasks ?? stats.totalTasks} trend={8.3} trendLabel="较昨日" iconColor="blue" />
        <StatCard icon={CheckSquare} title="任务完成率" value={`${Math.round((today?.completionRate ?? stats.avgCompletionRate) * 100)}%`} trend={5.2} trendLabel="较昨日" iconColor="success" />
        <StatCard icon={Activity} title="平均翻转时间" value={`${(today?.averageFlipTime ?? stats.avgFlipTime).toFixed(2)}ns`} trend={-3.8} trendLabel="较昨日" iconColor="purple" />
        <StatCard icon={AlertTriangle} title="异常数量" value={today?.abnormalCount ?? stats.totalAbnormal} trend={2} trendLabel="新增" iconColor="danger" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-1 space-y-5">
          <GlassCard>
            <h2 className="text-lg font-semibold text-gray-100 mb-4">任务状态分布</h2>
            <div className="h-64 flex items-center justify-center">
              {tasks.length > 0 ? <Doughnut data={doughnutData} options={doughnutOptions} /> : <p className="text-gray-500">暂无任务数据</p>}
            </div>
          </GlassCard>

          <GlassCard>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-100">待复核预警</h2>
              <span className="badge badge-warning">{unreviewed.length} 条</span>
            </div>
            <div className="space-y-3 max-h-80 overflow-y-auto scrollbar-thin pr-1">
              {unreviewed.length > 0 ? unreviewed.map(w => {
                const task = tasks.find(t => t.id === w.taskId);
                return (
                  <WarningCard key={w.id} warning={w} taskName={task?.name}
                    onAccept={() => handleAction(w.id, 'accept')}
                    onRecalculate={() => handleAction(w.id, 'recalculate')}
                    onReject={() => handleAction(w.id, 'reject')} />
                );
              }) : (
                <div className="py-8 text-center text-gray-500">
                  <Check className="w-10 h-10 mx-auto mb-2 text-status-success/50" />
                  <p>暂无待复核预警</p>
                </div>
              )}
            </div>
          </GlassCard>
        </div>

        <GlassCard className="lg:col-span-2">
          <h2 className="text-lg font-semibold text-gray-100 mb-4">最近任务</h2>
          <div className="space-y-3">
            {recentTasks.length > 0 ? recentTasks.map(task => {
              const progress = task.totalSteps ? Math.round((task.currentStep ?? 0) / task.totalSteps * 100) : 0;
              const isRunning = task.currentStep !== undefined && task.totalSteps !== undefined
                && task.currentStep < task.totalSteps && task.status !== TaskStatus.COMPLETED && task.status !== TaskStatus.ABNORMAL;
              return (
                <motion.div key={task.id} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }}
                  className="p-4 rounded-xl bg-space-800/40 border border-magnetic-blue/5 hover:border-magnetic-blue/20 transition-colors">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-lg bg-magnetic-gradient/10 flex items-center justify-center shrink-0">
                        <Activity className="w-4 h-4 text-magnetic-blue" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-gray-100 truncate">{task.name}</p>
                        <p className="text-xs text-gray-500 flex items-center gap-1.5">
                          <Clock className="w-3 h-3" />{formatTime(task.createdAt)}
                          <span className="mx-1">·</span>{task.submittedBy}
                        </p>
                      </div>
                    </div>
                    <span className={cn('badge text-xs shrink-0', statusBadge[task.status])}>
                      {isRunning && <RefreshCw className="w-3 h-3 mr-1 animate-spin" />}
                      {statusLabel[task.status]}
                    </span>
                  </div>
                  {task.totalSteps && (
                    <div className="mt-3">
                      <div className="flex items-center justify-between text-xs text-gray-500 mb-1.5">
                        <span>进度</span><span>{progress}%</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-space-900/60 overflow-hidden">
                        <motion.div initial={{ width: 0 }} animate={{ width: `${progress}%` }} transition={{ duration: 0.8, ease: 'easeOut' }}
                          className={cn('h-full rounded-full',
                            task.status === TaskStatus.COMPLETED ? 'bg-status-success' :
                            task.status === TaskStatus.ABNORMAL ? 'bg-status-danger' : 'bg-magnetic-gradient')} />
                      </div>
                    </div>
                  )}
                  {task.warnings.length > 0 && (
                    <div className="mt-3 flex items-center gap-1.5 text-xs text-status-warning">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      <span>{task.warnings.length} 条预警</span>
                    </div>
                  )}
                </motion.div>
              );
            }) : (
              <div className="py-12 text-center text-gray-500">
                <X className="w-10 h-10 mx-auto mb-2 text-gray-600" />
                <p>暂无任务记录</p>
              </div>
            )}
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
