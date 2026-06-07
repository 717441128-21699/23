import { useState, useEffect, useRef } from 'react';
import { ChevronDown, Maximize2, FileDown, Magnet, Clock, Zap, Loader2 } from 'lucide-react';
import HysteresisChart from '@/components/charts/HysteresisChart';
import Heatmap2D from '@/components/charts/Heatmap2D';
import { useTaskStore } from '@/store/taskStore';
import { useSettingsStore } from '@/store/settingsStore';
import { generateReport, type GenerateReportResponse } from '@/services/reportApi';
import { cn } from '@/lib/utils';
import type { SimulationTask } from '@/types';
import { TaskStatus } from '@/types';

export default function Reports() {
  const { tasks, loadTasks, getTaskById } = useTaskStore();
  const { showToast } = useSettingsStore();
  const [selectedTaskId, setSelectedTaskId] = useState<string>('');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [fullscreenChart, setFullscreenChart] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [reportData, setReportData] = useState<GenerateReportResponse | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

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
    if (!selectedTaskId && tasks.length > 0) {
      const completed = tasks.find((t) => t.status === TaskStatus.COMPLETED || t.results);
      if (completed) setSelectedTaskId(completed.id);
    }
  }, [tasks, selectedTaskId]);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const selectedTask: SimulationTask | undefined = selectedTaskId
    ? getTaskById(selectedTaskId)
    : undefined;

  const completedTasks = tasks.filter((t) => t.status === TaskStatus.COMPLETED || t.results);

  const handleGeneratePDF = async () => {
    if (!selectedTaskId) return;
    try {
      setGenerating(true);
      const resp = await generateReport(selectedTaskId);
      setReportData(resp);
      showToast('报告生成成功', 'success');
      if (resp.pdfBase64) {
        const link = document.createElement('a');
        link.href = 'data:application/pdf;base64,' + resp.pdfBase64;
        link.download = `${selectedTask?.name || 'report'}.pdf`;
        link.click();
      }
    } catch (err) {
      showToast(err instanceof Error ? err.message : '生成报告失败', 'error');
    } finally {
      setGenerating(false);
    }
  };

  const hysteresisData = reportData?.reportData?.results as unknown as { hysteresisLoop?: unknown } | undefined;

  const chartCards = [
    {
      key: 'hysteresis',
      title: '磁滞回线',
      icon: Magnet,
      content: <HysteresisChart data={selectedTask?.results?.hysteresisLoop ?? hysteresisData?.hysteresisLoop as any} />
    },
    {
      key: 'domain',
      title: '磁畴结构 (Mz分量)',
      icon: Zap,
      content: <Heatmap2D colorMode="magnetization" min={-1} max={1} />
    },
    {
      key: 'fliptime',
      title: '翻转时间分布',
      icon: Clock,
      content: <Heatmap2D colorMode="time" />
    },
    {
      key: 'energy',
      title: '能量云图',
      icon: Zap,
      content: <Heatmap2D colorMode="energy" />
    }
  ];

  const summaryStats = selectedTask?.results
    ? [
        { label: '矫顽力 Hc', value: `${selectedTask.results.hysteresisLoop.coercivity.toFixed(1)} Oe`, color: 'text-info-400' },
        { label: '剩磁 Mr', value: `±${selectedTask.results.hysteresisLoop.remanence.toFixed(3)}`, color: 'text-purple-400' },
        { label: '平均翻转时间', value: `${selectedTask.results.averageFlipTime.toFixed(2)} ns`, color: 'text-cyan-400' },
        { label: '拓扑荷数', value: selectedTask.results.vortexStates.map((v) => v.topologicalCharge).join(', ') || '0', color: 'text-orange-400' }
      ]
    : [
        { label: '矫顽力 Hc', value: '-- Oe', color: 'text-info-400' },
        { label: '剩磁 Mr', value: '--', color: 'text-purple-400' },
        { label: '平均翻转时间', value: '-- ns', color: 'text-cyan-400' },
        { label: '拓扑荷数', value: '--', color: 'text-orange-400' }
      ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-magnetic-blue" />
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8">
      <div className="bg-magnetic-field" />
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2 text-gradient">报告生成中心</h1>
            <p className="text-text-secondary">生成包含磁滞回线、磁畴结构等数据的完整微磁学报告</p>
          </div>
        </div>

        <div className="space-y-6">
          <div className="glass-panel p-5 flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <span className="text-sm text-text-secondary">选择任务:</span>
              <div ref={dropdownRef} className="relative">
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary-950/60 border border-white/10
                    text-sm text-text-primary hover:border-info-500/30 transition-all min-w-[240px] justify-between"
                >
                  <span className="truncate">
                    {selectedTask ? selectedTask.name : '请选择任务'}
                  </span>
                  <ChevronDown className={cn('w-4 h-4 text-text-muted transition-transform', dropdownOpen && 'rotate-180')} />
                </button>
                {dropdownOpen && (
                  <div className="absolute top-full left-0 right-0 mt-1 rounded-lg bg-primary-900 border border-white/10
                    shadow-xl shadow-black/50 overflow-hidden z-50 max-h-64 overflow-y-auto scrollbar-thin">
                    {completedTasks.length === 0 && (
                      <div className="px-4 py-3 text-sm text-text-muted text-center">暂无已完成任务</div>
                    )}
                    {completedTasks.map((task) => (
                      <button
                        key={task.id}
                        onClick={() => {
                          setSelectedTaskId(task.id);
                          setDropdownOpen(false);
                        }}
                        className={cn(
                          'w-full px-4 py-2.5 text-left text-sm transition-all',
                          selectedTaskId === task.id
                            ? 'bg-info-500/15 text-info-300'
                            : 'text-text-secondary hover:bg-white/5 hover:text-text-primary'
                        )}
                      >
                        {task.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <button
              onClick={handleGeneratePDF}
              className="flex items-center gap-2 btn-primary"
              disabled={!selectedTask || generating}
            >
              {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileDown className="w-4 h-4" />}
              {generating ? '生成中...' : '生成PDF报告'}
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {chartCards.map((card) => {
              const Icon = card.icon;
              return (
                <div
                  key={card.key}
                  className="glass-card p-5 relative"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-info-500/10 flex items-center justify-center">
                        <Icon className="w-4 h-4 text-info-400" />
                      </div>
                      <h3 className="font-semibold text-text-primary">{card.title}</h3>
                    </div>
                    <button
                      onClick={() => setFullscreenChart(fullscreenChart === card.key ? null : card.key)}
                      className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-white/5 transition-all"
                    >
                      <Maximize2 className="w-4 h-4" />
                    </button>
                  </div>
                  <div className={cn(
                    'transition-all duration-300',
                    fullscreenChart === card.key
                      ? 'fixed inset-0 z-50 bg-primary-950/95 backdrop-blur-xl p-8 flex flex-col'
                      : 'h-[280px]'
                  )}>
                    {fullscreenChart === card.key && (
                      <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-semibold text-gradient">{card.title}</h2>
                        <button
                          onClick={() => setFullscreenChart(null)}
                          className="btn-secondary text-sm"
                        >
                          关闭
                        </button>
                      </div>
                    )}
                    <div className={cn('flex-1 min-h-0', fullscreenChart !== card.key && 'h-full')}>
                      {card.content}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="glass-card p-5">
            <h3 className="font-semibold text-text-primary mb-4">模拟结果汇总</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {summaryStats.map((stat) => (
                <div
                  key={stat.label}
                  className="p-4 rounded-xl bg-black/20 border border-white/5"
                >
                  <p className="text-xs text-text-muted mb-1.5">{stat.label}</p>
                  <p className={cn('text-lg font-semibold font-mono', stat.color)}>
                    {stat.value}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
