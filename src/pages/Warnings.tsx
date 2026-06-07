import { useState, useEffect, useMemo } from 'react';
import { Filter, RefreshCw } from 'lucide-react';
import WarningCard from '@/components/ui/WarningCard';
import ParamSlider from '@/components/ui/ParamSlider';
import { useWarningStore } from '@/store/warningStore';
import { useTaskStore } from '@/store/taskStore';
import { mockWarnings, mockTasks } from '@/data/mockData';
import type { WarningType, WarningAction, CalculationConfig } from '@/types';
import { cn } from '@/lib/utils';

type TabKey = 'all' | WarningType | 'reviewed';

const tabs: { key: TabKey; label: string }[] = [
  { key: 'all', label: '全部预警' },
  { key: 'flip_time_threshold', label: '翻转时间超阈值' },
  { key: 'vortex_state', label: '涡旋态' },
  { key: 'energy_anomaly', label: '能量异常' },
  { key: 'reviewed', label: '已处理' }
];

export default function Warnings() {
  const [activeTab, setActiveTab] = useState<TabKey>('all');
  const [expandedWarningId, setExpandedWarningId] = useState<string | null>(null);
  const [paramValues, setParamValues] = useState<Record<string, Partial<CalculationConfig>>>({});

  const { warnings, markReviewed } = useWarningStore();
  const { tasks, getTaskById } = useTaskStore();

  useEffect(() => {
    if (warnings.length === 0) {
      mockWarnings.forEach((w) => useWarningStore.getState().addWarning(w));
    }
    if (tasks.length === 0) {
      mockTasks.forEach((t) => useTaskStore.getState().addTask(t));
    }
  }, [warnings.length, tasks.length]);

  const filteredWarnings = useMemo(() => {
    if (activeTab === 'all') return warnings;
    if (activeTab === 'reviewed') return warnings.filter((w) => w.reviewed);
    return warnings.filter((w) => w.type === activeTab && !w.reviewed);
  }, [warnings, activeTab]);

  const handleAction = (warningId: string, action: WarningAction) => {
    markReviewed(warningId, '当前用户', action, paramValues[warningId]);
    setExpandedWarningId(null);
  };

  const toggleParamPanel = (warningId: string) => {
    setExpandedWarningId((prev) => (prev === warningId ? null : warningId));
  };

  const updateParam = (warningId: string, key: keyof CalculationConfig, value: number) => {
    setParamValues((prev) => ({
      ...prev,
      [warningId]: {
        ...prev[warningId],
        [key]: value
      }
    }));
  };

  const getDefaultParams = (warningId: string): CalculationConfig | undefined => {
    const warning = warnings.find((w) => w.id === warningId);
    if (!warning) return undefined;
    const task = getTaskById(warning.taskId);
    return task?.config;
  };

  return (
    <div className="min-h-screen p-8">
      <div className="bg-magnetic-field" />
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2 text-gradient">预警复核工作台</h1>
            <p className="text-text-secondary">审核模拟过程中触发的预警，决定是否通过、重算或驳回</p>
          </div>
          <button className="flex items-center gap-2 btn-secondary">
            <RefreshCw className="w-4 h-4" />
            刷新
          </button>
        </div>

        <div className="glass-panel p-1.5 mb-6 inline-flex">
          {tabs.map((tab) => {
            const count =
              tab.key === 'all'
                ? warnings.filter((w) => !w.reviewed).length
                : tab.key === 'reviewed'
                ? warnings.filter((w) => w.reviewed).length
                : warnings.filter((w) => w.type === tab.key && !w.reviewed).length;

            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={cn(
                  'relative px-4 py-2 rounded-lg text-sm font-medium transition-all',
                  activeTab === tab.key
                    ? 'bg-accent-gradient text-white shadow-lg shadow-info-500/20'
                    : 'text-text-secondary hover:text-text-primary hover:bg-white/5'
                )}
              >
                <span className="flex items-center gap-2">
                  <Filter className="w-3.5 h-3.5" />
                  {tab.label}
                  <span className={cn(
                    'px-1.5 py-0.5 rounded-full text-xs font-semibold',
                    activeTab === tab.key
                      ? 'bg-white/20 text-white'
                      : 'bg-white/5 text-text-muted'
                  )}>
                    {count}
                  </span>
                </span>
              </button>
            );
          })}
        </div>

        {filteredWarnings.length === 0 ? (
          <div className="glass-panel p-16 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-success-500/10 flex items-center justify-center">
              <svg className="w-8 h-8 text-success-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-text-primary mb-1">暂无待处理预警</h3>
            <p className="text-text-muted text-sm">当前分类下没有需要复核的预警记录</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {filteredWarnings.map((warning) => {
              const task = getTaskById(warning.taskId);
              const config = getDefaultParams(warning.id);
              const isExpanded = expandedWarningId === warning.id;
              const currentParams = paramValues[warning.id] || {};

              return (
                <WarningCard
                  key={warning.id}
                  warning={warning}
                  taskName={task?.name}
                  onAccept={() => handleAction(warning.id, 'accept')}
                  onRecalculate={() => toggleParamPanel(warning.id)}
                  onReject={() => handleAction(warning.id, 'reject')}
                  showParamPanel={isExpanded}
                >
                  {isExpanded && config && (
                    <div className="space-y-5">
                      <ParamSlider
                        label="外场强度"
                        unit=" Oe"
                        min={0}
                        max={1000}
                        originalValue={config.externalField.magnitude}
                        value={currentParams.externalField?.magnitude ?? config.externalField.magnitude}
                        onChange={(v) => updateParam(warning.id, 'externalField', { ...config.externalField, magnitude: v } as any)}
                        recommendedMin={100}
                        recommendedMax={500}
                      />
                      <ParamSlider
                        label="模拟时间"
                        unit=" ns"
                        min={1}
                        max={50}
                        originalValue={config.simulationTime}
                        value={currentParams.simulationTime ?? config.simulationTime}
                        onChange={(v) => updateParam(warning.id, 'simulationTime', v)}
                        recommendedMin={10}
                        recommendedMax={25}
                      />
                      <ParamSlider
                        label="翻转时间阈值"
                        unit=" ns"
                        min={0.5}
                        max={5}
                        originalValue={config.flipTimeThreshold}
                        value={currentParams.flipTimeThreshold ?? config.flipTimeThreshold}
                        onChange={(v) => updateParam(warning.id, 'flipTimeThreshold', v)}
                        recommendedMin={1}
                        recommendedMax={2}
                        step={0.1}
                      />
                      <div className="flex justify-end gap-2 pt-2">
                        <button
                          onClick={() => toggleParamPanel(warning.id)}
                          className="btn-secondary text-sm py-2 px-4"
                        >
                          取消
                        </button>
                        <button
                          onClick={() => handleAction(warning.id, 'recalculate')}
                          className="btn-primary text-sm py-2 px-4"
                        >
                          确认重算
                        </button>
                      </div>
                    </div>
                  )}
                </WarningCard>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
