import { useMemo, useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Zap, Box, Activity, Layers, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTaskStore } from '@/store/taskStore';
import { useSettingsStore } from '@/store/settingsStore';
import { TaskStatus } from '@/types';
import GlassCard from '@/components/ui/GlassCard';
import TaskTimeline from '@/components/visual/TaskTimeline';
import TaskParamsCard from '@/components/visual/TaskParamsCard';
import VortexDetectionPanel from '@/components/visual/VortexDetectionPanel';
import EnergyChart from '@/components/charts/EnergyChart';
import MagnetizationChart from '@/components/charts/MagnetizationChart';
import DomainVisualizer from '@/components/visual/DomainVisualizer';
import { statusBadgeMap } from '@/components/visual/statusBadge';

type BottomTab = 'domain3d' | 'vortex';

export default function TaskMonitor() {
  const { tasks, loadTasks, loadTask, setCurrentTaskId, currentTaskId, getTaskById } = useTaskStore();
  const { showToast } = useSettingsStore();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [bottomTab, setBottomTab] = useState<BottomTab>('domain3d');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const intervalRef = useRef<number | null>(null);

  useEffect(() => {
    const init = async () => {
      try {
        setLoading(true);
        await loadTasks();
      } catch (err) {
        showToast(err instanceof Error ? err.message : '加载任务列表失败', 'error');
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [loadTasks, showToast]);

  useEffect(() => {
    if (tasks.length > 0 && !currentTaskId) {
      setCurrentTaskId(tasks[0].id);
    }
  }, [tasks, currentTaskId, setCurrentTaskId]);

  useEffect(() => {
    if (!currentTaskId) return;
    const fetchDetail = async () => {
      try {
        setRefreshing(true);
        await loadTask(currentTaskId);
      } catch (err) {
        showToast(err instanceof Error ? err.message : '加载任务详情失败', 'error');
      } finally {
        setRefreshing(false);
      }
    };
    fetchDetail();
  }, [currentTaskId, loadTask, showToast]);

  useEffect(() => {
    if (!currentTaskId) return;
    const task = getTaskById(currentTaskId);
    const isRunning = task && task.status !== TaskStatus.COMPLETED && task.status !== TaskStatus.ABNORMAL;
    if (isRunning) {
      intervalRef.current = window.setInterval(async () => {
        try {
          await loadTask(currentTaskId);
        } catch (err) {
          console.error('refresh failed:', err);
        }
      }, 2000);
    }
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [currentTaskId, getTaskById, loadTask]);

  const currentTask = useMemo(
    () => (currentTaskId ? getTaskById(currentTaskId) : undefined),
    [currentTaskId, getTaskById]
  );

  const statusInfo = currentTask
    ? statusBadgeMap[currentTask.status]
    : statusBadgeMap[TaskStatus.PENDING_VERIFY];
  const StatusIcon = statusInfo.icon;

  const progress =
    currentTask?.currentStep && currentTask?.totalSteps
      ? Math.round((currentTask.currentStep / currentTask.totalSteps) * 100)
      : 0;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-magnetic-blue" />
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-6 lg:p-8">
      <div className="bg-magnetic-field" />
      <div className="relative z-10 space-y-5">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row md:items-center md:justify-between gap-4"
        >
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gradient">任务监控中心</h1>
            <p className="text-sm text-text-secondary mt-1">实时监控微磁学模拟任务的运行状态与结果</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative">
              <button
                onClick={() => setDropdownOpen((v) => !v)}
                className="input-field flex items-center justify-between gap-2 min-w-[260px] pr-3"
              >
                <div className="flex flex-col items-start">
                  <span className="text-[11px] text-text-muted">当前任务</span>
                  <span className="text-sm font-medium text-text-primary truncate max-w-[200px]">
                    {currentTask?.name ?? '未选择'}
                  </span>
                </div>
                <ChevronDown
                  className={cn('w-4 h-4 text-text-muted transition-transform', dropdownOpen && 'rotate-180')}
                />
              </button>
              <AnimatePresence>
                {dropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -5, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -5, scale: 0.98 }}
                    className="absolute top-full left-0 right-0 mt-2 z-50 glass-panel p-1.5 max-h-64 overflow-y-auto scrollbar-thin"
                  >
                    {tasks.map((t) => {
                      const info = statusBadgeMap[t.status];
                      const Icon = info.icon;
                      const active = t.id === currentTask?.id;
                      return (
                        <button
                          key={t.id}
                          onClick={() => {
                            setCurrentTaskId(t.id);
                            setDropdownOpen(false);
                          }}
                          className={cn(
                            'w-full flex items-center justify-between gap-2 rounded-lg px-3 py-2 text-left transition-colors',
                            active ? 'bg-accent-blue/10' : 'hover:bg-bg-hover'
                          )}
                        >
                          <div className="flex-1 min-w-0">
                            <div className={cn('text-sm truncate', active ? 'text-text-primary' : 'text-text-secondary')}>
                              {t.name}
                            </div>
                            <div className="text-[11px] text-text-muted font-mono">{t.id}</div>
                          </div>
                          <span className={cn(info.className, 'text-[10px] flex items-center gap-1')}>
                            <Icon className="w-3 h-3" />
                            {info.label}
                          </span>
                        </button>
                      );
                    })}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            <span className={cn(statusInfo.className, 'flex items-center gap-1.5')}>
              <StatusIcon className="w-3.5 h-3.5" />
              {statusInfo.label}
              {refreshing && <Loader2 className="w-3 h-3 animate-spin ml-1" />}
            </span>
          </div>
        </motion.div>

        {currentTask?.totalSteps && (
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="glass-panel px-4 py-3 flex items-center gap-4"
          >
            <Activity className="w-4 h-4 text-accent-blue flex-shrink-0" />
            <div className="flex-1">
              <div className="flex justify-between text-xs mb-1">
                <span className="text-text-secondary">计算进度</span>
                <span className="text-text-primary font-mono">
                  {currentTask.currentStep ?? 0} / {currentTask.totalSteps} ({progress}%)
                </span>
              </div>
              <div className="h-1.5 bg-bg-secondary rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  className="h-full bg-gradient-to-r from-accent-blue via-accent-purple to-accent-cyan rounded-full"
                  transition={{ duration: 0.8, ease: 'easeOut' }}
                />
              </div>
            </div>
          </motion.div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          <div className="lg:col-span-3 flex flex-col gap-5">
            <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}>
              <GlassCard padding="md">
                <TaskTimeline currentStatus={currentTask?.status ?? TaskStatus.PENDING_VERIFY} />
              </GlassCard>
            </motion.div>
            <TaskParamsCard task={currentTask} />
          </div>

          <div className="lg:col-span-9 flex flex-col gap-5">
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
                <GlassCard padding="md" className="h-full">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Zap className="w-4 h-4 text-accent-blue" />
                      <span className="text-sm font-medium text-text-primary">能量演化曲线</span>
                    </div>
                    <span className="text-[11px] text-text-muted font-mono">×10⁻¹⁸ J</span>
                  </div>
                  <div className="h-[260px]">
                    <EnergyChart data={currentTask?.results?.energyEvolution} realtime />
                  </div>
                </GlassCard>
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                <GlassCard padding="md" className="h-full">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Activity className="w-4 h-4 text-accent-cyan" />
                      <span className="text-sm font-medium text-text-primary">磁化翻转曲线</span>
                    </div>
                    <span className="text-[11px] text-text-muted font-mono">M/Ms</span>
                  </div>
                  <div className="h-[260px]">
                    <MagnetizationChart
                      flipThreshold={currentTask?.config.flipTimeThreshold ? 0.9 : undefined}
                    />
                  </div>
                </GlassCard>
              </motion.div>
            </div>

            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
              <GlassCard padding="md">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-1 bg-bg-secondary rounded-lg p-1">
                    <button
                      onClick={() => setBottomTab('domain3d')}
                      className={cn(
                        'px-4 py-1.5 rounded-md text-xs font-medium transition-all flex items-center gap-1.5',
                        bottomTab === 'domain3d'
                          ? 'bg-accent-blue/15 text-accent-blue shadow-inner'
                          : 'text-text-muted hover:text-text-secondary'
                      )}
                    >
                      <Box className="w-3.5 h-3.5" />
                      磁畴 3D 视图
                    </button>
                    <button
                      onClick={() => setBottomTab('vortex')}
                      className={cn(
                        'px-4 py-1.5 rounded-md text-xs font-medium transition-all flex items-center gap-1.5',
                        bottomTab === 'vortex'
                          ? 'bg-accent-purple/15 text-accent-purple shadow-inner'
                          : 'text-text-muted hover:text-text-secondary'
                      )}
                    >
                      <Layers className="w-3.5 h-3.5" />
                      涡旋态检测
                    </button>
                  </div>
                  {bottomTab === 'vortex' && (
                    <div className="flex items-center gap-3 text-xs">
                      <span className="text-text-muted">检测到涡旋态:</span>
                      <span className="text-accent-purple font-mono font-medium">
                        {currentTask?.results?.vortexStates?.length ?? 0} 个
                      </span>
                    </div>
                  )}
                </div>

                <AnimatePresence mode="wait">
                  {bottomTab === 'domain3d' ? (
                    <motion.div
                      key="domain"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="h-[360px] rounded-lg overflow-hidden border border-border-primary"
                    >
                      <DomainVisualizer
                        deviceLength={currentTask?.geometry.length}
                        deviceWidth={currentTask?.geometry.width}
                        deviceThickness={currentTask?.geometry.thickness}
                        mockSeed={currentTask?.id ? parseInt(currentTask.id.slice(-3), 36) : 0}
                      />
                    </motion.div>
                  ) : (
                    <VortexDetectionPanel
                      vortexStates={currentTask?.results?.vortexStates}
                    />
                  )}
                </AnimatePresence>
              </GlassCard>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
