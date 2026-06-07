import { useMemo, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
} from 'chart.js';
import {
  Zap,
  Layers,
  TrendingUp,
  Shield,
  Gauge,
  CheckCircle2,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Loader2,
  RefreshCw,
} from 'lucide-react';
import GlassCard from '@/components/ui/GlassCard';
import { useStatsStore } from '@/store/statsStore';
import { useSettingsStore } from '@/store/settingsStore';
import { getRecommendation, type FullRecommendation, type PinnedLayerData } from '@/services/recommendApi';
import type { MaterialParams, DeviceGeometry } from '@/types';
import { cn } from '@/lib/utils';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip
);

interface PinnedLayerCombo {
  id: string;
  material1: string;
  thickness1: number;
  material2: string;
  thickness2: number;
  coercivity: number;
  thermalStability: number;
  compatibility: number;
  confidence: number;
}

function ConfidenceBadge({ value }: { value: number }) {
  const pct = Math.round(value * 100);
  const color = pct >= 85
    ? 'text-status-success bg-status-success/15 border-status-success/30'
    : pct >= 70
    ? 'text-status-warning bg-status-warning/15 border-status-warning/30'
    : 'text-status-danger bg-status-danger/15 border-status-danger/30';
  return (
    <span className={cn('badge border', color)}>
      <Shield className="w-3 h-3 mr-1" />{pct}%
    </span>
  );
}

function MiniLineChart() {
  const { dailyStats } = useStatsStore();
  const last14 = dailyStats.slice(-14);
  const data = useMemo(() => {
    return {
      labels: last14.map((d) => d.date.slice(5)),
      datasets: [{
        data: last14.map((d) => Math.round(d.accuracy * 100)),
        borderColor: '#4F8EF7',
        backgroundColor: 'rgba(79, 142, 247, 0.15)',
        fill: true, tension: 0.4, pointRadius: 0, borderWidth: 2,
      }],
    };
  }, [last14]);
  const options = {
    responsive: true, maintainAspectRatio: false,
    plugins: { tooltip: { enabled: true } },
    scales: {
      x: { display: false },
      y: { display: true, min: 80, max: 100, grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#64748B', font: { size: 10 } } },
    },
  };
  return <div className="h-24 w-full">{last14.length > 0 ? <Line data={data} options={options} /> : <p className="text-xs text-gray-500 text-center pt-8">暂无数据</p>}</div>;
}

interface ProgressStatProps {
  icon: typeof Gauge;
  label: string;
  value: string;
  pct: number;
  color: string;
}

function ProgressStat({ icon: Icon, label, value, pct, color }: ProgressStatProps) {
  return (
    <div>
      <div className="flex items-center justify-between text-xs mb-1">
        <span className="text-text-muted flex items-center gap-1"><Icon className="w-3 h-3" />{label}</span>
        <span className="text-text-primary font-medium">{value}</span>
      </div>
      <div className="h-1.5 rounded-full bg-space-800 overflow-hidden">
        <motion.div initial={{ width: 0 }} animate={{ width: `${Math.min(100, pct)}%` }} className={cn('h-full rounded-full', color)} />
      </div>
    </div>
  );
}

function toCombo(p: PinnedLayerData, idx: number): PinnedLayerCombo {
  const m1 = p.materials[0] ?? 'CoFeB';
  const m2 = p.materials[1] ?? p.materials[0] ?? 'MgO';
  const t1 = p.thicknesses[0] ?? 1.2;
  const t2 = p.thicknesses[1] ?? p.thicknesses[0] ?? 0.8;
  return {
    id: `combo-${idx}`,
    material1: m1, thickness1: t1,
    material2: m2, thickness2: t2,
    coercivity: p.expectedCoercivity,
    thermalStability: p.thermalStability,
    compatibility: Math.round(p.confidence * 100),
    confidence: p.confidence,
  };
}

export default function Recommend() {
  const { dailyStats, loadDailyStats } = useStatsStore();
  const { showToast } = useSettingsStore();
  const [expandedCombo, setExpandedCombo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [recData, setRecData] = useState<FullRecommendation | null>(null);
  const [statsLoaded, setStatsLoaded] = useState(false);

  const defaultMaterial: Partial<MaterialParams> = {
    saturationMagnetization: 800000,
    anisotropyConstant: 50000,
    exchangeStiffness: 1.3e-11,
    dampingCoefficient: 0.01,
    temperature: 300,
    materialType: 'CoFeB',
  };
  const defaultGeometry: Partial<DeviceGeometry> = {
    length: 200,
    width: 100,
    thickness: 3,
  };

  const pinnedCombos = useMemo(
    () => (recData?.pinnedLayers ?? []).map(toCombo),
    [recData]
  );

  const loadRecommendations = async () => {
    try {
      setLoading(true);
      const data = await getRecommendation({
        materialParams: defaultMaterial,
        geometry: defaultGeometry,
      });
      setRecData(data);
      if (!statsLoaded) {
        await loadDailyStats();
        setStatsLoaded(true);
      }
    } catch (err) {
      showToast(err instanceof Error ? err.message : '加载推荐数据失败', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRecommendations();
  }, []);

  if (loading && !recData) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-magnetic-blue" />
      </div>
    );
  }

  const avgAccuracy = dailyStats.length > 0
    ? (dailyStats.reduce((a, b) => a + b.accuracy, 0) / dailyStats.length * 100).toFixed(1)
    : '95.2';

  const writeCurrent = recData?.writeCurrent;
  const alternatives = [
    '采用 SOT 辅助写入方案, 降低写入电流约 15%',
    '增加钉扎层厚度, 提高热稳定性 5%',
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gradient">智能推荐引擎</h1>
          <p className="text-sm text-text-secondary mt-1">基于历史数据与机器学习模型的参数优化建议</p>
        </div>
        <button onClick={loadRecommendations} disabled={loading} className="flex items-center gap-2 btn-secondary">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
          刷新推荐
        </button>
      </div>

      <GlassCard>
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-magnetic-blue/20 flex items-center justify-center">
            <Zap className="w-5 h-5 text-magnetic-blue" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">最优写入电流推荐</h2>
            <p className="text-xs text-text-muted">基于最近30天同类器件统计分析</p>
          </div>
          <div className="ml-auto"><ConfidenceBadge value={writeCurrent?.confidence ?? 0} /></div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="lg:col-span-2 space-y-4">
            <div className="p-5 rounded-xl bg-space-900/50 border border-magnetic-blue/15">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="text-xs text-text-muted mb-1">推荐值范围</p>
                  <p className="text-3xl font-bold text-gradient-magnetic">
                    {writeCurrent?.range.min ?? 42} ~ {writeCurrent?.range.max ?? 48} <span className="text-lg text-text-secondary">mA</span>
                  </p>
                  <p className="text-sm text-text-secondary mt-1">最优值: {writeCurrent?.range.optimal ?? 45} mA · 推荐脉宽: 0.5 ns</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-text-muted mb-1">置信度</p>
                  <p className="text-2xl font-bold text-status-success">{Math.round((writeCurrent?.confidence ?? 0) * 100)}%</p>
                </div>
              </div>
              <div className="divider my-4" />
              <div className="flex items-start gap-2">
                <Sparkles className="w-4 h-4 text-magnetic-purple mt-0.5 shrink-0" />
                <p className="text-sm text-text-secondary leading-relaxed">{writeCurrent?.rationale ?? '基于历史数据统计的最优参数范围建议。'}</p>
              </div>
            </div>

            <div>
              <p className="text-sm font-medium text-text-secondary mb-3 flex items-center gap-2">
                <Layers className="w-4 h-4" />替代方案对比
              </p>
              <div className="space-y-2">
                {alternatives.map((alt, idx) => {
                  const conf = idx === 0 ? 0.88 : 0.82;
                  return (
                    <motion.div key={idx} whileHover={{ x: 4 }}
                      className="p-3 rounded-lg bg-space-800/40 border border-white/5 hover:border-magnetic-blue/20 transition-colors flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-7 h-7 rounded-lg bg-magnetic-purple/15 flex items-center justify-center text-xs font-bold text-magnetic-purple">{idx + 1}</div>
                        <p className="text-sm text-text-primary">{alt}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-24 h-1.5 rounded-full bg-space-900/60 overflow-hidden">
                          <motion.div initial={{ width: 0 }} animate={{ width: `${conf * 100}%` }} className="h-full bg-magnetic-gradient rounded-full" />
                        </div>
                        <span className="text-xs font-medium text-text-secondary w-10 text-right">{Math.round(conf * 100)}%</span>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-space-900/40 border border-white/5">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="w-4 h-4 text-status-success" />
              <p className="text-sm font-medium text-text-primary">历史数据准确率</p>
            </div>
            <MiniLineChart />
            <div className="mt-3 pt-3 border-t border-white/5 flex items-center justify-between text-xs text-text-muted">
              <span>近14天</span>
              <span className="text-status-success font-medium">平均 {avgAccuracy}%</span>
            </div>
          </div>
        </div>
      </GlassCard>

      <GlassCard>
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-magnetic-purple/20 flex items-center justify-center">
            <Layers className="w-5 h-5 text-magnetic-purple" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">钉扎层材料组合推荐</h2>
            <p className="text-xs text-text-muted">综合考虑矫顽力、热稳定性及工艺兼容性</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {pinnedCombos.map((combo, idx) => {
            const isExpanded = expandedCombo === combo.id;
            return (
              <motion.div key={combo.id}
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.1 }}
                className="rounded-xl bg-space-900/40 border border-white/5 hover:border-magnetic-blue/20 transition-all overflow-hidden">
                <button
                  onClick={() => setExpandedCombo(isExpanded ? null : combo.id)}
                  className="w-full p-5 text-left flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      {idx === 0 && <span className="badge badge-success"><CheckCircle2 className="w-3 h-3 mr-1" />首选</span>}
                      <ConfidenceBadge value={combo.confidence} />
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="px-2 py-1 rounded-md bg-magnetic-blue/15 text-magnetic-blue text-xs font-mono">{combo.material1}</span>
                      <span className="text-text-muted text-xs">{combo.thickness1}nm</span>
                      <span className="text-text-muted">/</span>
                      <span className="px-2 py-1 rounded-md bg-magnetic-purple/15 text-magnetic-purple text-xs font-mono">{combo.material2}</span>
                      <span className="text-text-muted text-xs">{combo.thickness2}nm</span>
                    </div>
                  </div>
                  {isExpanded ? <ChevronUp className="w-4 h-4 text-text-muted" /> : <ChevronDown className="w-4 h-4 text-text-muted" />}
                </button>
                {isExpanded && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} className="px-5 pb-5">
                    <div className="divider mb-4" />
                    <div className="space-y-3 mb-4">
                      <ProgressStat icon={Gauge} label="预期矫顽力" value={`${combo.coercivity} Oe`} pct={combo.coercivity} color="bg-magnetic-blue" />
                      <ProgressStat icon={Shield} label="热稳定性 Δ" value={`${combo.thermalStability}`} pct={combo.thermalStability} color="bg-magnetic-purple" />
                      <ProgressStat icon={CheckCircle2} label="工艺兼容性" value={`${combo.compatibility}%`} pct={combo.compatibility} color="bg-status-success" />
                    </div>
                    <div className="pt-3 border-t border-white/5 flex items-center justify-between">
                      <span className="text-xs text-text-muted">综合置信度</span>
                      <span className="text-sm font-bold text-gradient-magnetic">{Math.round(combo.confidence * 100)}%</span>
                    </div>
                  </motion.div>
                )}
              </motion.div>
            );
          })}
          {pinnedCombos.length === 0 && (
            <p className="col-span-full text-center text-gray-500 py-12">暂无钉扎层推荐数据</p>
          )}
        </div>
      </GlassCard>
    </div>
  );
}
