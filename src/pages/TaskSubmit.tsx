import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Atom, Box, Settings, Send, Upload, ChevronDown } from 'lucide-react';
import GlassCard from '@/components/ui/GlassCard';
import { useTaskStore } from '@/store/taskStore';
import type { MaterialParams, DeviceGeometry, CalculationConfig, SimulationTask, DeviceShape } from '@/types';
import { TaskStatus } from '@/types';
import { cn } from '@/lib/utils';

interface FieldProps {
  label: string; unit: string; value: number | string;
  onChange: (v: number) => void; min?: number; max?: number;
  hint?: string; type?: 'number' | 'select';
  options?: { value: string; label: string }[];
}

function Field({ label, unit, value, onChange, min, max, hint, type = 'number', options }: FieldProps) {
  const invalid = type === 'number' && typeof value === 'number' && (
    (min !== undefined && value < min) || (max !== undefined && value > max)
  );
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <label className="text-sm font-medium text-gray-200">{label}</label>
        <span className="text-xs text-gray-500">{unit}</span>
      </div>
      {type === 'select' ? (
        <div className="relative">
          <select value={value as string} onChange={(e) => onChange(Number(e.target.value) || 0)}
            className="w-full input-field appearance-none pr-9 cursor-pointer">
            {options?.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
        </div>
      ) : (
        <input type="number" value={value} min={min} max={max}
          onChange={(e) => onChange(Number(e.target.value))}
          className={cn('input-field', invalid && 'border-status-danger/50 focus:border-status-danger')} />
      )}
      {hint && <p className={cn('text-xs mt-1', invalid ? 'text-status-danger' : 'text-gray-500')}>{hint}</p>}
    </div>
  );
}

const materialOptions = [
  { value: 'CoFeB', label: 'CoFeB' }, { value: 'Permalloy', label: 'Permalloy' },
  { value: 'FePt', label: 'FePt' }, { value: 'custom', label: '自定义' },
];
const shapeOptions = [
  { value: 'rectangle', label: '矩形' }, { value: 'ellipse', label: '椭圆' },
  { value: 'custom', label: '自定义' },
];

function SectionHeader({ icon: Icon, title, subtitle, color }: {
  icon: typeof Atom; title: string; subtitle: string; color: string;
}) {
  const colorClasses: Record<string, string> = {
    blue: 'bg-magnetic-blue/15 text-magnetic-blue',
    purple: 'bg-magnetic-purple/15 text-magnetic-purple',
    info: 'bg-status-info/15 text-status-info',
  };
  return (
    <div className="flex items-center gap-2.5 mb-5">
      <div className={cn('w-9 h-9 rounded-lg flex items-center justify-center', colorClasses[color])}>
        <Icon className="w-4.5 h-4.5" />
      </div>
      <div>
        <h2 className="text-lg font-semibold text-gray-100">{title}</h2>
        <p className="text-xs text-gray-500">{subtitle}</p>
      </div>
    </div>
  );
}

export default function TaskSubmit() {
  const navigate = useNavigate();
  const { addTask } = useTaskStore();
  const [dragActive, setDragActive] = useState(false);
  const [stlFile, setStlFile] = useState<File | null>(null);

  const [material, setMaterial] = useState<MaterialParams>({
    saturationMagnetization: 800000, anisotropyConstant: 10000, exchangeStiffness: 1e-11,
    dampingCoefficient: 0.01, gyromagneticRatio: 2.21e5, temperature: 300, materialType: 'CoFeB',
  });
  const [geometry, setGeometry] = useState<DeviceGeometry>({
    length: 200, width: 100, thickness: 3, meshSize: 3, shape: 'rectangle',
  });
  const [config, setConfig] = useState<CalculationConfig>({
    externalField: { magnitude: 200, directionX: 1, directionY: 0, directionZ: 0 },
    simulationTime: 15, timeStep: 0.02, flipTimeThreshold: 1.5, vortexDetectionEnabled: true,
  });

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault(); setDragActive(false);
    const f = e.dataTransfer.files?.[0];
    if (f && f.name.endsWith('.stl')) setStlFile(f);
  };

  const handleSubmit = () => {
    addTask({
      id: `task-${Date.now()}`,
      name: `${material.materialType}-${geometry.shape}-${new Date().toLocaleDateString('zh-CN')}`,
      status: TaskStatus.PENDING_VERIFY, materialParams: material,
      geometry: { ...geometry, stlFile: stlFile ?? undefined }, config,
      createdAt: new Date(), submittedBy: '当前用户', warnings: [],
    } as SimulationTask);
    navigate('/tasks/monitor');
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-gray-100">任务提交中心</h1>
        <p className="text-sm text-gray-500 mt-1">配置微磁学模拟参数并提交计算任务</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <GlassCard>
          <SectionHeader icon={Atom} title="材料参数" subtitle="定义磁材料物理特性" color="blue" />
          <div className="space-y-4">
            <Field label="饱和磁化强度 Ms" unit="A/m" value={material.saturationMagnetization}
              onChange={(v) => setMaterial({ ...material, saturationMagnetization: v })}
              min={10000} max={2000000} hint="推荐范围：10,000 ~ 2,000,000" />
            <Field label="各向异性常数 K1" unit="J/m³" value={material.anisotropyConstant}
              onChange={(v) => setMaterial({ ...material, anisotropyConstant: v })}
              min={0} max={100000} hint="推荐范围：0 ~ 100,000" />
            <Field label="交换刚度 A" unit="J/m" value={material.exchangeStiffness}
              onChange={(v) => setMaterial({ ...material, exchangeStiffness: v })}
              min={1e-13} max={1e-10} hint="推荐范围：1e-13 ~ 1e-10" />
            <Field label="阻尼系数 α" unit="-" value={material.dampingCoefficient}
              onChange={(v) => setMaterial({ ...material, dampingCoefficient: v })}
              min={0.001} max={0.1} hint="推荐范围：0.001 ~ 0.1" />
            <Field label="旋磁比 γ" unit="rad/(s·A/m)" value={material.gyromagneticRatio}
              onChange={(v) => setMaterial({ ...material, gyromagneticRatio: v })} hint="通常为 2.21e5" />
            <Field label="温度 T" unit="K" value={material.temperature}
              onChange={(v) => setMaterial({ ...material, temperature: v })}
              min={0} max={1000} hint="推荐范围：0 ~ 1000" />
            <Field label="材料类型" unit="-" value={material.materialType} type="select"
              onChange={(v) => setMaterial({ ...material, materialType: String(v) || 'CoFeB' })}
              options={materialOptions} />
          </div>
        </GlassCard>

        <GlassCard>
          <SectionHeader icon={Box} title="器件几何" subtitle="设置器件尺寸与形状" color="purple" />
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-3">
              <Field label="长 L" unit="nm" value={geometry.length}
                onChange={(v) => setGeometry({ ...geometry, length: v })} min={10} max={5000} hint="10~5000" />
              <Field label="宽 W" unit="nm" value={geometry.width}
                onChange={(v) => setGeometry({ ...geometry, width: v })} min={5} max={2000} hint="5~2000" />
              <Field label="厚 t" unit="nm" value={geometry.thickness}
                onChange={(v) => setGeometry({ ...geometry, thickness: v })} min={0.5} max={50} hint="0.5~50" />
            </div>
            <Field label="网格尺寸" unit="nm" value={geometry.meshSize}
              onChange={(v) => setGeometry({ ...geometry, meshSize: v })} min={0.5} max={10} hint="建议 ≤ 交换长度" />
            <Field label="形状选择" unit="-" value={geometry.shape} type="select"
              onChange={(v) => setGeometry({ ...geometry, shape: String(v) as DeviceShape || 'rectangle' })}
              options={shapeOptions} />
            <div onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
              onDragLeave={() => setDragActive(false)} onDrop={handleFileDrop}
              className={cn(
                'mt-2 border-2 border-dashed rounded-xl p-6 text-center transition-colors cursor-pointer',
                dragActive ? 'border-magnetic-blue/60 bg-magnetic-blue/5' : 'border-white/10 hover:border-magnetic-blue/30',
              )}>
              <Upload className={cn('w-8 h-8 mx-auto mb-2', dragActive ? 'text-magnetic-blue' : 'text-gray-500')} />
              {stlFile ? <p className="text-sm text-gray-200">{stlFile.name}</p> : (
                <><p className="text-sm text-gray-300">拖拽 STL 文件到此处</p>
                <p className="text-xs text-gray-500 mt-1">或点击选择（自定义形状时可用）</p></>
              )}
            </div>
          </div>
        </GlassCard>

        <GlassCard>
          <SectionHeader icon={Settings} title="计算配置" subtitle="外场与仿真参数设置" color="info" />
          <div className="space-y-4">
            <Field label="外磁场强度" unit="Oe" value={config.externalField.magnitude}
              onChange={(v) => setConfig({ ...config, externalField: { ...config.externalField, magnitude: v } })}
              min={0} max={10000} hint="推荐范围：0 ~ 10,000" />
            <div className="grid grid-cols-3 gap-3">
              <Field label="X 分量" unit="-" value={config.externalField.directionX}
                onChange={(v) => setConfig({ ...config, externalField: { ...config.externalField, directionX: v } })}
                min={-1} max={1} hint="-1~1" />
              <Field label="Y 分量" unit="-" value={config.externalField.directionY}
                onChange={(v) => setConfig({ ...config, externalField: { ...config.externalField, directionY: v } })}
                min={-1} max={1} hint="-1~1" />
              <Field label="Z 分量" unit="-" value={config.externalField.directionZ}
                onChange={(v) => setConfig({ ...config, externalField: { ...config.externalField, directionZ: v } })}
                min={-1} max={1} hint="-1~1" />
            </div>
            <Field label="模拟时间" unit="ns" value={config.simulationTime}
              onChange={(v) => setConfig({ ...config, simulationTime: v })}
              min={0.1} max={100} hint="推荐范围：0.1 ~ 100" />
            <Field label="时间步长" unit="ps" value={config.timeStep}
              onChange={(v) => setConfig({ ...config, timeStep: v })}
              min={0.001} max={1} hint="推荐范围：0.001 ~ 1" />
            <Field label="翻转时间阈值" unit="ns" value={config.flipTimeThreshold}
              onChange={(v) => setConfig({ ...config, flipTimeThreshold: v })}
              min={0.1} max={10} hint="超过将触发预警" />
            <div className="flex items-center justify-between p-3 rounded-lg bg-space-800/40 border border-magnetic-blue/10">
              <div>
                <p className="text-sm font-medium text-gray-200">涡旋态检测</p>
                <p className="text-xs text-gray-500">实时检测拓扑电荷变化</p>
              </div>
              <button onClick={() => setConfig({ ...config, vortexDetectionEnabled: !config.vortexDetectionEnabled })}
                className={cn('relative w-11 h-6 rounded-full transition-colors',
                  config.vortexDetectionEnabled ? 'bg-magnetic-blue' : 'bg-gray-600')}>
                <motion.div animate={{ x: config.vortexDetectionEnabled ? 20 : 2 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  className="absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-lg" />
              </button>
            </div>
          </div>
        </GlassCard>
      </div>

      <div className="flex justify-end">
        <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
          onClick={handleSubmit}
          className="flex items-center gap-2 px-6 py-2.5 rounded-xl btn-primary font-medium shadow-glow-blue">
          <Send className="w-4 h-4" />提交任务
        </motion.button>
      </div>
    </div>
  );
}
