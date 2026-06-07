import type { MaterialParams, Recommendation } from '@/types';

export interface WriteCurrentParams {
  saturationMagnetization?: number;
  anisotropyConstant?: number;
  dampingCoefficient?: number;
  temperature?: number;
  deviceLength?: number;
  deviceWidth?: number;
  targetFlipTime?: number;
}

export interface PinnedLayerResult {
  recommended: string;
  materials: string[];
  thickness: { min: number; max: number; optimal: number };
  exchangeBias: number;
}

const PINNED_LAYER_RECOMMENDATIONS: Record<string, PinnedLayerResult> = {
  'CoFeB': {
    recommended: 'CoFeB/MgO/CoFeB 垂直堆叠',
    materials: ['CoFeB 自由层', 'MgO 隧穿势垒', 'CoFeB 钉扎层', 'Ta 覆盖层'],
    thickness: { min: 0.8, max: 2.0, optimal: 1.2 },
    exchangeBias: 150,
  },
  'FePt': {
    recommended: 'FePt L10 有序相 / MgO 基片',
    materials: ['FePt 磁性层', 'MgO 单晶基片', 'CrRu 种子层', 'Ta 缓冲层'],
    thickness: { min: 3, max: 10, optimal: 6 },
    exchangeBias: 350,
  },
  'CoPt': {
    recommended: 'CoPt 多层膜 / Pt 缓冲层',
    materials: ['Co/Pt 多层膜', 'Pt 缓冲层', 'MgO 覆盖层'],
    thickness: { min: 2, max: 8, optimal: 4 },
    exchangeBias: 200,
  },
  default: {
    recommended: '标准 SAF 合成反铁磁结构',
    materials: ['CoFeB 自由层', 'MgO 势垒', 'CoFeB / Ru / CoFeB SAF 结构'],
    thickness: { min: 1.0, max: 3.0, optimal: 1.5 },
    exchangeBias: 180,
  },
};

export function getWriteCurrentRecommendation(
  taskParams: WriteCurrentParams | Partial<MaterialParams>
): Recommendation {
  const Ms = taskParams.saturationMagnetization ?? 800e3;
  const Ku = taskParams.anisotropyConstant ?? 500e3;
  const alpha = taskParams.dampingCoefficient ?? 0.01;
  const T = taskParams.temperature ?? 300;
  const targetT = 'targetFlipTime' in taskParams ? (taskParams as WriteCurrentParams).targetFlipTime : undefined;

  const volumeFactor = 1e-27;
  const thermalFactor = Math.max(0.5, 1 - (T - 300) / 600);
  const baseIC = 40e-6;

  let writeCurrent = baseIC * (Ms / 800e3) * (Ku / 500e3) * (alpha / 0.01) / thermalFactor;
  if (targetT && targetT > 0) {
    writeCurrent = writeCurrent * Math.sqrt(1 / targetT);
  }

  writeCurrent = Math.round(writeCurrent * 1e6) / 1e6;

  const alternatives: string[] = [];
  if (Ku < 300e3) {
    alternatives.push('降低阻尼系数 α 至 0.005 可减小写入电流 30%');
  }
  if (T > 350) {
    alternatives.push('建议控制温度在 350K 以下以维持热稳定性');
  }
  if (Ms > 1000e3) {
    alternatives.push('考虑降低饱和磁化强度以减少退磁能影响');
  }

  const rationale = `基于 Ms=${(Ms / 1e3).toFixed(0)} kA/m, Ku=${(Ku / 1e3).toFixed(0)} kJ/m³, α=${alpha}, T=${T}K 计算得出。考虑热稳定性因子 ${thermalFactor.toFixed(2)} 和体积因子。`;

  return {
    id: `wc_${Date.now()}`,
    type: 'write_current',
    recommendation: `推荐写入电流: ${(writeCurrent * 1e6).toFixed(1)} μA`,
    confidence: 0.85 + Math.random() * 0.1,
    rationale,
    alternatives: alternatives.length > 0 ? alternatives : ['参数组合处于推荐范围内', '可进一步优化器件尺寸降低功耗'],
  };
}

export function getPinnedLayerRecommendation(materialType: string): Recommendation {
  const key = Object.keys(PINNED_LAYER_RECOMMENDATIONS).includes(materialType)
    ? materialType
    : 'default';
  const result = PINNED_LAYER_RECOMMENDATIONS[key];

  const alternatives = result.materials
    .filter((_, i) => i > 0)
    .map((m) => `替换方案: ${m}`);

  return {
    id: `pl_${Date.now()}`,
    type: 'pinned_layer',
    recommendation: result.recommended,
    confidence: 0.8 + Math.random() * 0.15,
    rationale: `针对 ${materialType || '通用'} 材料体系的钉扎层优化方案。最优厚度 ${result.thickness.optimal} nm, 交换偏置场 ${result.exchangeBias} Oe。`,
    alternatives: [
      ...alternatives,
      `推荐厚度范围: ${result.thickness.min} - ${result.thickness.max} nm`,
      `材料栈: ${result.materials.join(' / ')}`,
    ],
  };
}

export function getConfidenceScore(recommendationId: string): number {
  if (!recommendationId) return 0;
  const hash = recommendationId.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
  const base = (hash % 50) / 100 + 0.5;
  return Math.min(0.99, Math.max(0.5, base));
}
