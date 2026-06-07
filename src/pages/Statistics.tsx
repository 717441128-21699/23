import { useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { type ChartOptions } from 'chart.js';
import { Line, Bar, Pie } from 'react-chartjs-2';
import {
  LayoutDashboard, CheckSquare, Timer, Target, AlertTriangle,
  PieChart as PieIcon, BarChart3,
} from 'lucide-react';
import GlassCard from '@/components/ui/GlassCard';
import StatCard from '@/components/ui/StatCard';
import { useStatsStore } from '@/store/statsStore';
import { mockDailyStats } from '@/data/mockData';
import { chartThemeColors, baseChartOptions } from '@/components/charts/chartConfig';

const MATERIALS = ['CoFeB', 'Permalloy', 'FePt', '其他'];
const genBox = () => MATERIALS.map(() => { const b = 0.6 + Math.random() * 0.4; return [Math.max(0.2, b - 0.5), Math.max(0.3, b - 0.2), b, b + 0.2, Math.min(2.0, b + 0.5)]; });
const genAcc = () => {
  const labels = Array.from({ length: 20 }, (_, i) => `T${i + 1}`);
  const deviations = labels.map(() => Math.round(((Math.random() - 0.5) * 12) * 10) / 10);
  return { labels, deviations, isAnomaly: deviations.map((d) => Math.abs(d) > 8) };
};
const genPie = () => ({ labels: ['翻转时间异常', '涡旋态异常', '能量波动异常', '参数异常'], data: [42, 28, 18, 12], colors: ['#4F8EF7', '#9B51E0', '#F72585', '#FF8A00'] });
const genWarn = () => [
  { type: 'flip', label: '翻转时间阈值', count: 34, color: '#4F8EF7' },
  { type: 'vortex', label: '涡旋态检测', count: 22, color: '#9B51E0' },
  { type: 'energy', label: '能量异常', count: 15, color: '#F72585' },
];

export default function Statistics() {
  const { dailyStats, getTotalStats, addStats } = useStatsStore();
  useEffect(() => { if (dailyStats.length === 0) mockDailyStats.forEach((s) => addStats(s)); }, [dailyStats.length, addStats]);

  const stats = getTotalStats();
  const accData = useMemo(genAcc, []);
  const boxData = useMemo(genBox, []);
  const anomalyPie = useMemo(genPie, []);
  const warningStats = useMemo(genWarn, []);
  const last30 = dailyStats.slice(-30);

  const lineData = {
    labels: last30.map((s) => s.date.slice(5)),
    datasets: [{
      label: '完成率',
      data: last30.map((s) => Math.round(s.completionRate * 100)),
      borderColor: chartThemeColors.accentBlue,
      backgroundColor: (ctx: { chart: { ctx: CanvasRenderingContext2D; chartArea: { top: number; bottom: number } | null } }) => {
        const { ctx: c, chartArea } = ctx.chart;
        if (!chartArea) return 'rgba(59,130,246,0.1)';
        const g = c.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
        g.addColorStop(0, 'rgba(59,130,246,0.35)'); g.addColorStop(1, 'rgba(59,130,246,0.02)');
        return g;
      },
      fill: true, tension: 0.4, pointRadius: 2, pointHoverRadius: 6, borderWidth: 2,
    }],
  };

  const lineOpts: ChartOptions<'line'> = {
    ...baseChartOptions,
    scales: { ...baseChartOptions.scales, y: { ...(baseChartOptions.scales?.y as object), min: 0, max: 100, ticks: { color: chartThemeColors.textMuted, callback: (v) => `${v}%`, font: { family: 'JetBrains Mono', size: 10 } }, border: { display: false } } },
  };

  const accBarData = { labels: accData.labels, datasets: [{ label: '偏差(%)', data: accData.deviations, backgroundColor: accData.deviations.map((_, i) => accData.isAnomaly[i] ? chartThemeColors.red : chartThemeColors.accentBlue), borderWidth: 1, borderRadius: 4 }] };
  const accBarOpts: ChartOptions<'bar'> = { ...(baseChartOptions as unknown as ChartOptions<'bar'>), scales: { x: { grid: { color: chartThemeColors.gridLine }, ticks: { color: chartThemeColors.textMuted, font: { size: 9 } }, border: { display: false } }, y: { grid: { color: chartThemeColors.gridLine }, ticks: { color: chartThemeColors.textMuted, callback: (v) => `${v}%`, font: { size: 10 } }, border: { display: false } } } };

  const boxPlotData = {
    labels: MATERIALS,
    datasets: [
      { label: 'min', data: boxData.map((d) => d[0]), backgroundColor: 'transparent', borderColor: 'transparent' },
      { label: 'Q1', data: boxData.map((d) => d[1] - d[0]), backgroundColor: 'rgba(79,142,247,0.4)', borderColor: 'rgba(79,142,247,0.6)', borderWidth: 1 },
      { label: 'med', data: boxData.map((d) => d[2] - d[1]), backgroundColor: 'rgba(155,81,224,0.6)', borderColor: 'rgba(155,81,224,0.8)', borderWidth: 1 },
      { label: 'Q3', data: boxData.map((d) => d[3] - d[2]), backgroundColor: 'rgba(79,142,247,0.4)', borderColor: 'rgba(79,142,247,0.6)', borderWidth: 1 },
      { label: 'max', data: boxData.map((d) => d[4] - d[3]), backgroundColor: 'transparent', borderColor: 'transparent' },
    ],
  };
  const boxPlotOpts: ChartOptions<'bar'> = { ...(baseChartOptions as unknown as ChartOptions<'bar'>), plugins: { ...(baseChartOptions as unknown as ChartOptions<'bar'>).plugins, legend: { display: false } }, scales: { x: { stacked: true, grid: { color: chartThemeColors.gridLine }, ticks: { color: chartThemeColors.textSecondary }, border: { display: false } }, y: { stacked: true, grid: { color: chartThemeColors.gridLine }, ticks: { color: chartThemeColors.textMuted, callback: (v) => `${v}ns`, font: { size: 10 } }, border: { display: false } } } };

  const pieData = { labels: anomalyPie.labels, datasets: [{ data: anomalyPie.data, backgroundColor: anomalyPie.colors, borderColor: 'rgba(10,22,40,0.8)', borderWidth: 2, hoverOffset: 6 }] };
  const pieOpts: ChartOptions<'pie'> = { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'right' as const, labels: { color: chartThemeColors.textSecondary, padding: 12, font: { size: 11 }, usePointStyle: true, pointStyle: 'circle' } }, tooltip: { backgroundColor: chartThemeColors.tooltipBg, borderColor: chartThemeColors.tooltipBorder, borderWidth: 1, titleColor: chartThemeColors.textPrimary, bodyColor: chartThemeColors.textSecondary } } };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-gray-100">统计看板</h1>
        <p className="text-sm text-gray-500 mt-1">平台运行数据与模拟质量分析</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard icon={LayoutDashboard} title="总任务数" value={stats.totalTasks} trend={12.5} trendLabel="较上月" iconColor="blue" />
        <StatCard icon={CheckSquare} title="累计完成率" value={`${Math.round(stats.avgCompletionRate * 100)}%`} trend={3.2} trendLabel="较上月" iconColor="success" />
        <StatCard icon={Timer} title="平均翻转时间" value={`${stats.avgFlipTime.toFixed(2)}ns`} trend={-5.7} trendLabel="较上月" iconColor="purple" />
        <StatCard icon={Target} title="平均准确度" value={`${Math.round(stats.avgAccuracy * 100)}%`} trend={1.8} trendLabel="较上月" iconColor="info" />
      </div>
      <GlassCard>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-100">每日完成率趋势（近30天）</h2>
          <span className="badge badge-info">面积填充</span>
        </div>
        <div className="h-72">{last30.length > 0 ? <Line data={lineData} options={lineOpts} /> : <p className="text-gray-500 text-center py-20">暂无数据</p>}</div>
      </GlassCard>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <GlassCard>
          <div className="flex items-center gap-2 mb-4"><BarChart3 className="w-5 h-5 text-magnetic-purple" /><h2 className="text-lg font-semibold text-gray-100">平均翻转时间分布（按材料）</h2></div>
          <div className="h-64"><Bar data={boxPlotData} options={boxPlotOpts} /></div>
          <div className="mt-3 flex items-center gap-4 text-xs text-gray-500">
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-magnetic-purple/60" />中位数</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-magnetic-blue/40" />四分位区间</span>
          </div>
        </GlassCard>
        <GlassCard>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2"><Target className="w-5 h-5 text-magnetic-blue" /><h2 className="text-lg font-semibold text-gray-100">准确度分析（仿真vs实验）</h2></div>
            <span className="badge badge-danger">异常点红色高亮</span>
          </div>
          <div className="h-64"><Bar data={accBarData} options={accBarOpts} /></div>
          <p className="mt-3 text-xs text-gray-500">偏差阈值：±8%，超出阈值标记为异常</p>
        </GlassCard>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <GlassCard>
          <div className="flex items-center gap-2 mb-4"><PieIcon className="w-5 h-5 text-magnetic-pink" /><h2 className="text-lg font-semibold text-gray-100">异常分布</h2></div>
          <div className="h-64"><Pie data={pieData} options={pieOpts} /></div>
        </GlassCard>
        <GlassCard>
          <div className="flex items-center gap-2 mb-4"><AlertTriangle className="w-5 h-5 text-status-warning" /><h2 className="text-lg font-semibold text-gray-100">预警类型统计</h2></div>
          <div className="space-y-3">
            {warningStats.map((w) => (
              <motion.div key={w.type} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="p-3 rounded-lg bg-space-800/40 border border-magnetic-blue/5">
                <div className="flex items-center justify-between mb-2"><span className="text-sm font-medium text-gray-200">{w.label}</span><span className="text-sm font-bold" style={{ color: w.color }}>{w.count} 次</span></div>
                <div className="h-1.5 rounded-full bg-space-900/60 overflow-hidden">
                  <motion.div initial={{ width: 0 }} animate={{ width: `${(w.count / 34) * 100}%` }} transition={{ duration: 0.8, ease: 'easeOut' }} className="h-full rounded-full" style={{ backgroundColor: w.color }} />
                </div>
              </motion.div>
            ))}
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
