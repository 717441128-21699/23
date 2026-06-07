import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, Filter, ChevronDown, ChevronUp, ArrowUpDown, Check, FileSpreadsheet, FileCode, Database, Loader2, X } from 'lucide-react';
import GlassCard from '@/components/ui/GlassCard';
import { useTaskStore } from '@/store/taskStore';
import { useSettingsStore } from '@/store/settingsStore';
import { mockTasks } from '@/data/mockData';
import { TaskStatus } from '@/types';
import { cn } from '@/lib/utils';

type SortField = 'name' | 'material' | 'temperature' | 'flipTime' | 'accuracy';
type SortDir = 'asc' | 'desc';
type ExportFormat = 'csv' | 'vtk' | 'hdf5';

const MAT_OPTS = ['CoFeB', 'Permalloy', 'FePt', '自定义'];
const EXPORT_COLS = [{k:'name',l:'任务名'},{k:'material',l:'材料'},{k:'temperature',l:'温度(K)'},{k:'length',l:'长度(nm)'},{k:'width',l:'宽度(nm)'},{k:'thickness',l:'厚度(nm)'},{k:'flipTime',l:'翻转时间(ns)'},{k:'accuracy',l:'准确度(%)'},{k:'status',l:'状态'}];
const S_LABEL: Record<TaskStatus,string> = {[TaskStatus.PENDING_VERIFY]:'待校验',[TaskStatus.GRID_GENERATION]:'网格生成',[TaskStatus.INITIALIZATION]:'初始化',[TaskStatus.MICROMAG_CALC]:'微磁计算',[TaskStatus.COMPLETED]:'已完成',[TaskStatus.ABNORMAL]:'异常',[TaskStatus.WARNING]:'预警',[TaskStatus.APPROVAL_L1]:'L1审批',[TaskStatus.APPROVAL_L2]:'L2审批',[TaskStatus.PUSHED_TO_FAB]:'已流片'};
const S_BADGE: Record<TaskStatus,string> = {[TaskStatus.PENDING_VERIFY]:'bg-status-warning/15 text-status-warning border-status-warning/30',[TaskStatus.GRID_GENERATION]:'bg-indigo-500/15 text-indigo-400 border-indigo-500/30',[TaskStatus.INITIALIZATION]:'bg-magnetic-purple/15 text-magnetic-purple border-magnetic-purple/30',[TaskStatus.MICROMAG_CALC]:'bg-magnetic-blue/15 text-magnetic-blue border-magnetic-blue/30',[TaskStatus.COMPLETED]:'bg-status-success/15 text-status-success border-status-success/30',[TaskStatus.ABNORMAL]:'bg-status-danger/15 text-status-danger border-status-danger/30',[TaskStatus.WARNING]:'bg-warning-500/15 text-warning-400 border-warning-500/30',[TaskStatus.APPROVAL_L1]:'bg-info-500/15 text-info-400 border-info-500/30',[TaskStatus.APPROVAL_L2]:'bg-status-info/15 text-status-info border-status-info/30',[TaskStatus.PUSHED_TO_FAB]:'bg-magnetic-purple/15 text-magnetic-purple border-magnetic-purple/30'};

function genRows(){return Array.from({length:25},(_,i)=>{const t=mockTasks[i%mockTasks.length];return{id:`r-${i}`,name:`${t.name}-${i+1}`,material:MAT_OPTS[i%4],temperature:Math.round(200+Math.random()*500),length:Math.round(t.geometry.length),width:Math.round(t.geometry.width),thickness:Math.round(t.geometry.thickness*10)/10,flipTime:Math.round((t.results?.averageFlipTime??1+Math.random())*100)/100,accuracy:Math.round((0.88+Math.random()*0.11)*1000)/10,status:[TaskStatus.COMPLETED,TaskStatus.MICROMAG_CALC,TaskStatus.WARNING,TaskStatus.ABNORMAL][i%4]as TaskStatus};});}

export default function Export(){
  const{tasks,addTask}=useTaskStore();
  const{showToast}=useSettingsStore();
  useState(()=>{if(tasks.length===0)mockTasks.forEach(t=>addTask(t));return undefined;});

  const[selMat,setSelMat]=useState<string[]>([]);
  const[tR,setTR]=useState<[number,number]>([0,800]);
  const[sR,setSR]=useState({lMin:'',lMax:'',wMin:'',wMax:'',tMin:'',tMax:''});
  const[sF,setSF]=useState<SortField>('name');
  const[sD,setSD]=useState<SortDir>('asc');
  const[selR,setSelR]=useState<Set<string>>(new Set());
  const[page,setPage]=useState(1);
  const PS=8;
  const[mDD,setMDD]=useState(false);
  const[eF,setEF]=useState<ExportFormat>('csv');
  const[selC,setSelC]=useState<Set<string>>(new Set(EXPORT_COLS.map(c=>c.k)));
  const[exp,setExp]=useState(false);
  const[eP,setEP]=useState(0);

  const all=useMemo(genRows,[]);
  const rows=useMemo(()=>{let r=[...all];if(selMat.length>0)r=r.filter(x=>selMat.includes(x.material));r=r.filter(x=>x.temperature>=tR[0]&&x.temperature<=tR[1]);if(sR.lMin)r=r.filter(x=>x.length>=Number(sR.lMin));if(sR.lMax)r=r.filter(x=>x.length<=Number(sR.lMax));if(sR.wMin)r=r.filter(x=>x.width>=Number(sR.wMin));if(sR.wMax)r=r.filter(x=>x.width<=Number(sR.wMax));if(sR.tMin)r=r.filter(x=>x.thickness>=Number(sR.tMin));if(sR.tMax)r=r.filter(x=>x.thickness<=Number(sR.tMax));r.sort((a,b)=>{const av=a[sF]as string|number,bv=b[sF]as string|number;const c=typeof av==='number'?av-(bv as number):String(av).localeCompare(String(bv));return sD==='asc'?c:-c;});return r;},[all,selMat,tR,sR,sF,sD]);

  const tp=Math.max(1,Math.ceil(rows.length/PS));
  const pr=rows.slice((page-1)*PS,page*PS);
  const aop=pr.length>0&&pr.every(r=>selR.has(r.id));

  const tMat=(m:string)=>setSelMat(p=>p.includes(m)?p.filter(x=>x!==m):[...p,m]);
  const tRow=(id:string)=>setSelR(p=>{const n=new Set(p);n.has(id)?n.delete(id):n.add(id);return n;});
  const tAP=()=>setSelR(p=>{const n=new Set(p);aop?pr.forEach(r=>n.delete(r.id)):pr.forEach(r=>n.add(r.id));return n;});
  const tCol=(k:string)=>setSelC(p=>{const n=new Set(p);n.has(k)?n.delete(k):n.add(k);return n;});
  const hS=(f:SortField)=>{if(sF===f)setSD(d=>d==='asc'?'desc':'asc');else{setSF(f);setSD('asc');}};

  const hExp=()=>{if(selR.size===0){showToast('请先选择要导出的数据','error');return;}if(selC.size===0){showToast('请至少选择一个导出字段','error');return;}setExp(true);setEP(0);const iv=setInterval(()=>{setEP(p=>{if(p>=100){clearInterval(iv);setExp(false);showToast(`已成功导出 ${selR.size} 条数据 (${eF.toUpperCase()})`,'success');return 100;}return p+8;});},120);};

  const SI=({f}:{f:SortField})=>sF!==f?<ArrowUpDown className="w-3.5 h-3.5 text-gray-500"/>:sD==='asc'?<ChevronUp className="w-3.5 h-3.5 text-magnetic-blue"/>:<ChevronDown className="w-3.5 h-3.5 text-magnetic-blue"/>;

  return(
    <div className="space-y-5">
      <div><h1 className="text-2xl font-bold text-gray-100">数据导出中心</h1><p className="text-sm text-gray-500 mt-1">筛选并导出模拟任务数据</p></div>
      <GlassCard>
        <div className="flex items-center gap-2 mb-4"><Filter className="w-5 h-5 text-magnetic-blue"/><h2 className="text-lg font-semibold text-gray-100">筛选条件</h2></div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div>
            <label className="block text-sm text-gray-400 mb-2">材料类型</label>
            <div className="relative">
              <button onClick={()=>setMDD(v=>!v)} className="w-full input-field flex items-center justify-between text-left"><span className={selMat.length===0?'text-gray-500':''}>{selMat.length===0?'请选择材料类型':`已选 ${selMat.length} 项`}</span><ChevronDown className={cn('w-4 h-4 text-gray-400 transition-transform',mDD&&'rotate-180')}/></button>
              <AnimatePresence>{mDD&&(
                <motion.div initial={{opacity:0,y:-5}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-5}} className="absolute z-20 mt-1 w-full glass-panel p-2 max-h-56 overflow-y-auto scrollbar-thin">
                  {MAT_OPTS.map(m=>(<button key={m} onClick={()=>tMat(m)} className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-gray-200 hover:bg-magnetic-blue/10"><div className={cn('w-4 h-4 rounded border flex items-center justify-center',selMat.includes(m)?'bg-magnetic-blue border-magnetic-blue':'border-gray-600')}>{selMat.includes(m)&&<Check className="w-3 h-3 text-white"/>}</div>{m}</button>))}
                </motion.div>
              )}</AnimatePresence>
            </div>
            {selMat.length>0&&<div className="mt-2 flex flex-wrap gap-1.5">{selMat.map(m=>(<span key={m} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-magnetic-blue/15 text-magnetic-blue text-xs border border-magnetic-blue/30">{m}<button onClick={()=>tMat(m)}><X className="w-3 h-3 hover:text-white"/></button></span>))}</div>}
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-2">温度区间 (K)</label>
            <div className="space-y-2">
              <input type="range" min={0} max={800} value={tR[0]} onChange={e=>setTR([Math.min(Number(e.target.value),tR[1]-10),tR[1]])} className="w-full accent-magnetic-blue"/>
              <input type="range" min={0} max={800} value={tR[1]} onChange={e=>setTR([tR[0],Math.max(Number(e.target.value),tR[0]+10)])} className="w-full accent-magnetic-blue"/>
              <div className="flex items-center justify-between text-xs text-gray-400 font-mono"><span>{tR[0]}K</span><span>~</span><span>{tR[1]}K</span></div>
            </div>
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-2">器件尺寸范围 (nm)</label>
            <div className="grid grid-cols-3 gap-2">
              {(['l','w','t']as const).map((d,i)=>(
                <div key={d}>
                  <p className="text-xs text-gray-500 mb-1">{['长','宽','厚'][i]}</p>
                  <div className="flex gap-1">
                    <input type="number" placeholder="min" value={sR[`${d}Min`as keyof typeof sR]} onChange={e=>setSR(s=>({...s,[`${d}Min`]:e.target.value}))} className="input-field text-xs px-2 py-1.5 w-full"/>
                    <input type="number" placeholder="max" value={sR[`${d}Max`as keyof typeof sR]} onChange={e=>setSR(s=>({...s,[`${d}Max`]:e.target.value}))} className="input-field text-xs px-2 py-1.5 w-full"/>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </GlassCard>
      <GlassCard>
        <div className="flex items-center justify-between mb-4"><h2 className="text-lg font-semibold text-gray-100">数据预览</h2><span className="text-sm text-gray-500">共 {rows.length} 条，已选 {selR.size} 条</span></div>
        <div className="overflow-x-auto scrollbar-thin">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-magnetic-blue/10">
              <th className="py-3 px-3 text-left w-10"><input type="checkbox" checked={aop} onChange={tAP} className="accent-magnetic-blue"/></th>
              {(['name','material','temperature','flipTime','accuracy','status']as const).map((f,j)=>(
                f!=='status'?(<th key={f} className="py-3 px-3 text-left text-gray-400 font-medium cursor-pointer hover:text-gray-200 select-none" onClick={()=>hS(f as SortField)}><span className="flex items-center gap-1">{['任务名','材料','温度(K)','翻转时间(ns)','准确度(%)',''][j]}<SI f={f as SortField}/></span></th>):(<th key={f} className="py-3 px-3 text-left text-gray-400 font-medium">状态</th>)
              ))}
            </tr></thead>
            <tbody>{pr.length>0?pr.map(r=>(
              <tr key={r.id} className="border-b border-magnetic-blue/5 hover:bg-magnetic-blue/5">
                <td className="py-3 px-3"><input type="checkbox" checked={selR.has(r.id)} onChange={()=>tRow(r.id)} className="accent-magnetic-blue"/></td>
                <td className="py-3 px-3 text-gray-200 font-medium">{r.name}</td>
                <td className="py-3 px-3 text-gray-300">{r.material}</td>
                <td className="py-3 px-3 text-gray-300 font-mono">{r.temperature}</td>
                <td className="py-3 px-3 text-gray-300 font-mono">{r.flipTime.toFixed(2)}</td>
                <td className="py-3 px-3 text-gray-300 font-mono">{r.accuracy.toFixed(1)}%</td>
                <td className="py-3 px-3"><span className={cn('badge text-xs',S_BADGE[r.status])}>{S_LABEL[r.status]}</span></td>
              </tr>
            )):(<tr><td colSpan={7} className="py-12 text-center text-gray-500">暂无符合条件的数据</td></tr>)}</tbody>
          </table>
        </div>
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-magnetic-blue/10"><p className="text-sm text-gray-500">第 {page} / {tp} 页</p><div className="flex items-center gap-2"><button disabled={page<=1} onClick={()=>setPage(p=>p-1)} className="btn-secondary px-3 py-1.5 text-sm disabled:opacity-40">上一页</button><button disabled={page>=tp} onClick={()=>setPage(p=>p+1)} className="btn-secondary px-3 py-1.5 text-sm disabled:opacity-40">下一页</button></div></div>
      </GlassCard>
      <GlassCard>
        <div className="flex items-center gap-2 mb-4"><Download className="w-5 h-5 text-magnetic-blue"/><h2 className="text-lg font-semibold text-gray-100">导出设置</h2></div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div>
            <label className="block text-sm text-gray-400 mb-2">导出格式</label>
            <div className="grid grid-cols-3 gap-2">
              {([{k:'csv',i:FileSpreadsheet,l:'CSV'},{k:'vtk',i:FileCode,l:'VTK'},{k:'hdf5',i:Database,l:'HDF5'}]as const).map(({k,i:I,l})=>(<button key={k} onClick={()=>setEF(k)} className={cn('flex flex-col items-center gap-1.5 p-3 rounded-lg border transition-colors',eF===k?'bg-magnetic-blue/15 border-magnetic-blue/50 text-magnetic-blue':'border-gray-700 text-gray-400 hover:border-gray-600')}><I className="w-5 h-5"/><span className="text-xs font-medium">{l}</span></button>))}
            </div>
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-2">导出字段 ({selC.size}/{EXPORT_COLS.length})</label>
            <div className="grid grid-cols-2 gap-1.5 max-h-40 overflow-y-auto scrollbar-thin pr-1">
              {EXPORT_COLS.map(c=>(<label key={c.k} className="flex items-center gap-2 px-2 py-1.5 rounded text-sm text-gray-300 hover:bg-magnetic-blue/5 cursor-pointer"><input type="checkbox" checked={selC.has(c.k)} onChange={()=>tCol(c.k)} className="accent-magnetic-blue"/>{c.l}</label>))}
            </div>
          </div>
          <div className="flex flex-col justify-end gap-3">
            {exp&&(<div><div className="flex items-center justify-between text-xs text-gray-400 mb-1.5"><span className="flex items-center gap-1.5"><Loader2 className="w-3.5 h-3.5 animate-spin"/>正在导出...</span><span className="font-mono">{eP}%</span></div><div className="h-2 rounded-full bg-space-900/60 overflow-hidden"><motion.div initial={{width:0}} animate={{width:`${eP}%`}} className="h-full rounded-full bg-magnetic-gradient"/></div></div>)}
            <motion.button whileHover={{scale:1.02}} whileTap={{scale:0.98}} onClick={hExp} disabled={exp} className="btn-primary flex items-center justify-center gap-2 py-3">{exp?<Loader2 className="w-4 h-4 animate-spin"/>:<Download className="w-4 h-4"/>}{exp?'导出中...':`导出数据 (${selR.size} 条)`}</motion.button>
          </div>
        </div>
      </GlassCard>
    </div>
  );
}
