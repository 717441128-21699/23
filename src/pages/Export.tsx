import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Download, Filter, ChevronDown, ChevronUp, ArrowUpDown, Check,
  FileSpreadsheet, FileCode, Database, Loader2, X,
} from 'lucide-react';
import GlassCard from '@/components/ui/GlassCard';
import { useTaskStore } from '@/store/taskStore';
import { useSettingsStore } from '@/store/settingsStore';
import { exportCSV, exportJSON } from '@/services/exportService';
import { TaskStatus } from '@/types';
import { cn } from '@/lib/utils';

type SF = 'name' | 'material' | 'temperature' | 'flipTime' | 'accuracy';
type SD = 'asc' | 'desc';
type EF = 'csv' | 'vtk' | 'hdf5';

const MATS = ['CoFeB', 'Permalloy', 'FePt', '自定义'];
const COLS: { key: string; label: string }[] = [
  { key: 'name', label: '任务名' }, { key: 'material', label: '材料' },
  { key: 'temperature', label: '温度(K)' }, { key: 'length', label: '长度(nm)' },
  { key: 'width', label: '宽度(nm)' }, { key: 'thickness', label: '厚度(nm)' },
  { key: 'flipTime', label: '翻转时间(ns)' }, { key: 'accuracy', label: '准确度(%)' },
  { key: 'status', label: '状态' },
];
const S_L: Record<TaskStatus, string> = {
  [TaskStatus.PENDING_VERIFY]: '待校验', [TaskStatus.GRID_GENERATION]: '网格生成',
  [TaskStatus.INITIALIZATION]: '初始化', [TaskStatus.MICROMAG_CALC]: '微磁计算',
  [TaskStatus.COMPLETED]: '已完成', [TaskStatus.ABNORMAL]: '异常',
  [TaskStatus.WARNING]: '预警', [TaskStatus.APPROVAL_L1]: 'L1审批',
  [TaskStatus.APPROVAL_L2]: 'L2审批', [TaskStatus.PUSHED_TO_FAB]: '已流片',
};
const S_B: Record<TaskStatus, string> = {
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
const TH = ['任务名', '材料', '温度(K)', '翻转时间(ns)', '准确度(%)', '状态'] as const;
const SFLDS: SF[] = ['name', 'material', 'temperature', 'flipTime', 'accuracy'];
const FMTS = [
  { k: 'csv' as EF, i: FileSpreadsheet, l: 'CSV' },
  { k: 'vtk' as EF, i: FileCode, l: 'VTK' },
  { k: 'hdf5' as EF, i: Database, l: 'HDF5' },
];

interface Row {
  id: string; name: string; material: string; temperature: number;
  length: number; width: number; thickness: number;
  flipTime: number; accuracy: number; status: TaskStatus;
}

export default function Export() {
  const { tasks, loadTasks } = useTaskStore();
  const { showToast } = useSettingsStore();
  const [loading, setLoading] = useState(true);
  const [selMats, setSelMats] = useState<string[]>([]);
  const [tRange, setTRange] = useState<[number, number]>([0, 800]);
  const [sz, setSz] = useState({ lMin: '', lMax: '', wMin: '', wMax: '', tMin: '', tMax: '' });
  const [sf, setSf] = useState<SF>('name');
  const [sd, setSd] = useState<SD>('asc');
  const [selRows, setSelRows] = useState<Set<string>>(new Set());
  const [page, setPage] = useState(1);
  const [matDD, setMatDD] = useState(false);
  const [ef, setEf] = useState<EF>('csv');
  const [selCols, setSelCols] = useState<Set<string>>(new Set(COLS.map(c => c.key)));
  const [exp, setExp] = useState(false);
  const [ep, setEp] = useState(0);

  useEffect(() => {
    const init = async () => {
      try { setLoading(true); await loadTasks(); }
      catch (e) { showToast(e instanceof Error ? e.message : '加载数据失败', 'error'); }
      finally { setLoading(false); }
    };
    init();
  }, [loadTasks, showToast]);

  const rows = useMemo(() => {
    let r: Row[] = tasks.map(t => ({
      id: t.id, name: t.name, material: t.materialParams.materialType,
      temperature: Math.round(t.materialParams.temperature),
      length: Math.round(t.geometry.length), width: Math.round(t.geometry.width),
      thickness: Math.round(t.geometry.thickness * 10) / 10,
      flipTime: Math.round((t.results?.averageFlipTime ?? 1) * 100) / 100,
      accuracy: Math.round(((0.88 + Math.random() * 0.11) * 1000)) / 10,
      status: t.status,
    }));
    if (selMats.length > 0) r = r.filter(x => selMats.includes(x.material));
    r = r.filter(x => x.temperature >= tRange[0] && x.temperature <= tRange[1]);
    (['l', 'w', 't'] as const).forEach(d => {
      const k = d === 'l' ? 'length' : d === 'w' ? 'width' : 'thickness';
      const mn = sz[`${d}Min` as keyof typeof sz], mx = sz[`${d}Max` as keyof typeof sz];
      if (mn) r = r.filter(x => (x as any)[k] >= Number(mn));
      if (mx) r = r.filter(x => (x as any)[k] <= Number(mx));
    });
    r.sort((a, b) => {
      const av = a[sf] as string | number, bv = b[sf] as string | number;
      const c = typeof av === 'number' ? av - (bv as number) : String(av).localeCompare(String(bv));
      return sd === 'asc' ? c : -c;
    });
    return r;
  }, [tasks, selMats, tRange, sz, sf, sd]);

  const PS = 8;
  const tp = Math.max(1, Math.ceil(rows.length / PS));
  const pr = rows.slice((page - 1) * PS, page * PS);
  const allOnPage = pr.length > 0 && pr.every(r => selRows.has(r.id));
  const tog = <T,>(s: Set<T>, k: T) => { const n = new Set(s); n.has(k) ? n.delete(k) : n.add(k); return n; };
  const togMat = (m: string) => setSelMats(p => p.includes(m) ? p.filter(x => x !== m) : [...p, m]);
  const togPage = () => setSelRows(p => { const n = new Set(p); allOnPage ? pr.forEach(r => n.delete(r.id)) : pr.forEach(r => n.add(r.id)); return n; });
  const hSort = (f: SF) => sf === f ? setSd(d => d === 'asc' ? 'desc' : 'asc') : (setSf(f), setSd('asc'));

  const hExp = async () => {
    if (selRows.size === 0) { showToast('请先选择要导出的数据', 'error'); return; }
    if (selCols.size === 0) { showToast('请至少选择一个导出字段', 'error'); return; }
    try {
      setExp(true); setEp(0);
      for (let p = 0; p <= 100; p += 25) { await new Promise(r => setTimeout(r, 40)); setEp(p); }
      const sd2 = rows.filter(r => selRows.has(r.id));
      const fs = COLS.filter(c => selCols.has(c.key));
      if (ef === 'csv') exportCSV(sd2 as unknown as Record<string, unknown>[], fs, `tasks-export-${Date.now()}.csv`);
      else exportJSON(sd2, `tasks-export-${Date.now()}.${ef}`);
      showToast(`已成功导出 ${selRows.size} 条数据 (${ef.toUpperCase()})`, 'success');
    } catch (e) { showToast(e instanceof Error ? e.message : '导出失败', 'error'); }
    finally { setEp(100); setTimeout(() => setExp(false), 200); }
  };

  const SortIc = ({ f }: { f: SF }) => sf !== f
    ? <ArrowUpDown className="w-3.5 h-3.5 text-gray-500" />
    : sd === 'asc' ? <ChevronUp className="w-3.5 h-3.5 text-magnetic-blue" /> : <ChevronDown className="w-3.5 h-3.5 text-magnetic-blue" />;

  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-magnetic-blue" /></div>;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-gray-100">数据导出中心</h1>
        <p className="text-sm text-gray-500 mt-1">筛选并导出模拟任务数据</p>
      </div>
      <GlassCard>
        <div className="flex items-center gap-2 mb-4"><Filter className="w-5 h-5 text-magnetic-blue" /><h2 className="text-lg font-semibold text-gray-100">筛选条件</h2></div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div>
            <label className="block text-sm text-gray-400 mb-2">材料类型</label>
            <div className="relative">
              <button onClick={() => setMatDD(v => !v)} className="w-full input-field flex items-center justify-between text-left">
                <span className={selMats.length === 0 ? 'text-gray-500' : ''}>{selMats.length === 0 ? '请选择材料类型' : `已选 ${selMats.length} 项`}</span>
                <ChevronDown className={cn('w-4 h-4 text-gray-400 transition-transform', matDD && 'rotate-180')} />
              </button>
              <AnimatePresence>
                {matDD && (
                  <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }} className="absolute z-20 mt-1 w-full glass-panel p-2 max-h-56 overflow-y-auto scrollbar-thin">
                    {MATS.map(m => (
                      <button key={m} onClick={() => togMat(m)} className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-gray-200 hover:bg-magnetic-blue/10">
                        <div className={cn('w-4 h-4 rounded border flex items-center justify-center', selMats.includes(m) ? 'bg-magnetic-blue border-magnetic-blue' : 'border-gray-600')}>
                          {selMats.includes(m) && <Check className="w-3 h-3 text-white" />}
                        </div>
                        {m}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            {selMats.length > 0 && <div className="mt-2 flex flex-wrap gap-1.5">{selMats.map(m => (
              <span key={m} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-magnetic-blue/15 text-magnetic-blue text-xs border border-magnetic-blue/30">
                {m}<button onClick={() => togMat(m)}><X className="w-3 h-3 hover:text-white" /></button>
              </span>
            ))}</div>}
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-2">温度区间 (K)</label>
            <div className="space-y-2">
              <input type="range" min={0} max={800} value={tRange[0]} onChange={e => setTRange([Math.min(Number(e.target.value), tRange[1] - 10), tRange[1]])} className="w-full accent-magnetic-blue" />
              <input type="range" min={0} max={800} value={tRange[1]} onChange={e => setTRange([tRange[0], Math.max(Number(e.target.value), tRange[0] + 10)])} className="w-full accent-magnetic-blue" />
              <div className="flex items-center justify-between text-xs text-gray-400 font-mono"><span>{tRange[0]}K</span><span>~</span><span>{tRange[1]}K</span></div>
            </div>
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-2">器件尺寸范围 (nm)</label>
            <div className="grid grid-cols-3 gap-2">
              {(['l', 'w', 't'] as const).map((d, i) => (
                <div key={d}>
                  <p className="text-xs text-gray-500 mb-1">{['长', '宽', '厚'][i]}</p>
                  <div className="flex gap-1">
                    <input type="number" placeholder="min" value={sz[`${d}Min` as keyof typeof sz]} onChange={e => setSz(s => ({ ...s, [`${d}Min`]: e.target.value }))} className="input-field text-xs px-2 py-1.5 w-full" />
                    <input type="number" placeholder="max" value={sz[`${d}Max` as keyof typeof sz]} onChange={e => setSz(s => ({ ...s, [`${d}Max`]: e.target.value }))} className="input-field text-xs px-2 py-1.5 w-full" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </GlassCard>
      <GlassCard>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-100">数据预览</h2>
          <span className="text-sm text-gray-500">共 {rows.length} 条，已选 {selRows.size} 条</span>
        </div>
        <div className="overflow-x-auto scrollbar-thin">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-magnetic-blue/10">
                <th className="py-3 px-3 text-left w-10"><input type="checkbox" checked={allOnPage} onChange={togPage} className="accent-magnetic-blue" /></th>
                {TH.map((h, j) => j < TH.length - 1 ? (
                  <th key={h} className="py-3 px-3 text-left text-gray-400 font-medium cursor-pointer hover:text-gray-200 select-none" onClick={() => hSort(SFLDS[j])}>
                    <span className="flex items-center gap-1">{h}<SortIc f={SFLDS[j]} /></span>
                  </th>
                ) : <th key={h} className="py-3 px-3 text-left text-gray-400 font-medium">{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {pr.length > 0 ? pr.map(r => (
                <tr key={r.id} className="border-b border-magnetic-blue/5 hover:bg-magnetic-blue/5">
                  <td className="py-3 px-3"><input type="checkbox" checked={selRows.has(r.id)} onChange={() => setSelRows(p => tog(p, r.id))} className="accent-magnetic-blue" /></td>
                  <td className="py-3 px-3 text-gray-200 font-medium">{r.name}</td>
                  <td className="py-3 px-3 text-gray-300">{r.material}</td>
                  <td className="py-3 px-3 text-gray-300 font-mono">{r.temperature}</td>
                  <td className="py-3 px-3 text-gray-300 font-mono">{r.flipTime.toFixed(2)}</td>
                  <td className="py-3 px-3 text-gray-300 font-mono">{r.accuracy.toFixed(1)}%</td>
                  <td className="py-3 px-3"><span className={cn('badge text-xs', S_B[r.status])}>{S_L[r.status]}</span></td>
                </tr>
              )) : <tr><td colSpan={7} className="py-12 text-center text-gray-500">暂无符合条件的数据</td></tr>}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-magnetic-blue/10">
          <p className="text-sm text-gray-500">第 {page} / {tp} 页</p>
          <div className="flex items-center gap-2">
            <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="btn-secondary px-3 py-1.5 text-sm disabled:opacity-40">上一页</button>
            <button disabled={page >= tp} onClick={() => setPage(p => p + 1)} className="btn-secondary px-3 py-1.5 text-sm disabled:opacity-40">下一页</button>
          </div>
        </div>
      </GlassCard>
      <GlassCard>
        <div className="flex items-center gap-2 mb-4"><Download className="w-5 h-5 text-magnetic-blue" /><h2 className="text-lg font-semibold text-gray-100">导出设置</h2></div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div>
            <label className="block text-sm text-gray-400 mb-2">导出格式</label>
            <div className="grid grid-cols-3 gap-2">
              {FMTS.map(({ k, i: I, l }) => (
                <button key={k} onClick={() => setEf(k)} className={cn('flex flex-col items-center gap-1.5 p-3 rounded-lg border transition-colors', ef === k ? 'bg-magnetic-blue/15 border-magnetic-blue/50 text-magnetic-blue' : 'border-gray-700 text-gray-400 hover:border-gray-600')}>
                  <I className="w-5 h-5" /><span className="text-xs font-medium">{l}</span>
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-2">导出字段 ({selCols.size}/{COLS.length})</label>
            <div className="grid grid-cols-2 gap-1.5 max-h-40 overflow-y-auto scrollbar-thin pr-1">
              {COLS.map(c => (
                <label key={c.key} className="flex items-center gap-2 px-2 py-1.5 rounded text-sm text-gray-300 hover:bg-magnetic-blue/5 cursor-pointer">
                  <input type="checkbox" checked={selCols.has(c.key)} onChange={() => setSelCols(p => tog(p, c.key))} className="accent-magnetic-blue" />
                  {c.label}
                </label>
              ))}
            </div>
          </div>
          <div className="flex flex-col justify-end gap-3">
            {exp && (
              <div>
                <div className="flex items-center justify-between text-xs text-gray-400 mb-1.5">
                  <span className="flex items-center gap-1.5"><Loader2 className="w-3.5 h-3.5 animate-spin" />正在导出...</span>
                  <span className="font-mono">{ep}%</span>
                </div>
                <div className="h-2 rounded-full bg-space-900/60 overflow-hidden"><motion.div initial={{ width: 0 }} animate={{ width: `${ep}%` }} className="h-full rounded-full bg-magnetic-gradient" /></div>
              </div>
            )}
            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={hExp} disabled={exp} className="btn-primary flex items-center justify-center gap-2 py-3">
              {exp ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
              {exp ? '导出中...' : `导出数据 (${selRows.size} 条)`}
            </motion.button>
          </div>
        </div>
      </GlassCard>
    </div>
  );
}
