import { TaskStatus } from '@/types';
import type {
  SimulationTask,
  WarningRecord,
  DailyStatistics,
  Recommendation,
  MaterialParams,
  DeviceGeometry,
  CalculationConfig,
  SimulationResults
} from '@/types';

const generateId = (): string => Math.random().toString(36).slice(2, 11);

const createMaterialParams = (type: string): MaterialParams => ({
  saturationMagnetization: 800000 + Math.random() * 200000,
  anisotropyConstant: 10000 + Math.random() * 5000,
  exchangeStiffness: 1e-11 + Math.random() * 5e-12,
  dampingCoefficient: 0.01 + Math.random() * 0.02,
  gyromagneticRatio: 2.21e5,
  temperature: 300 + Math.random() * 50,
  materialType: type
});

const createGeometry = (shape: 'rectangle' | 'ellipse' | 'custom'): DeviceGeometry => ({
  length: 100 + Math.random() * 200,
  width: 50 + Math.random() * 100,
  thickness: 1 + Math.random() * 5,
  meshSize: 2 + Math.random() * 3,
  shape
});

const createConfig = (): CalculationConfig => ({
  externalField: {
    magnitude: 100 + Math.random() * 400,
    directionX: Math.random(),
    directionY: Math.random(),
    directionZ: Math.random()
  },
  simulationTime: 10 + Math.random() * 20,
  timeStep: 0.01 + Math.random() * 0.05,
  flipTimeThreshold: 1 + Math.random() * 2,
  vortexDetectionEnabled: Math.random() > 0.3
});

const createResults = (): SimulationResults => {
  const points = 50;
  const field = Array.from({ length: points }, (_, i) => -500 + (i * 1000) / (points - 1));
  const magnetization = field.map((f) => Math.tanh(f / 100));

  const timePoints = 100;
  const time = Array.from({ length: timePoints }, (_, i) => i * 0.1);
  const exchangeEnergy = time.map((t) => 1e-18 * (1 + Math.exp(-t / 5)));
  const demagnetizationEnergy = time.map((t) => 5e-19 * (1 + 0.5 * Math.exp(-t / 3)));
  const zeemanEnergy = time.map((t) => -8e-19 * Math.tanh(t / 2));
  const totalEnergy = exchangeEnergy.map(
    (e, i) => e + demagnetizationEnergy[i] + zeemanEnergy[i]
  );

  const posCount = 20;
  const positions = Array.from({ length: posCount }, () => [
    Math.random() * 200,
    Math.random() * 100,
    Math.random() * 5
  ]);
  const flipTimes = positions.map(() => 0.5 + Math.random() * 1.5);

  return {
    hysteresisLoop: {
      field,
      magnetization,
      coercivity: 50 + Math.random() * 50,
      remanence: 0.7 + Math.random() * 0.2
    },
    domainStructure: {
      positions,
      magnetizationVectors: positions.map(() => [
        Math.random() - 0.5,
        Math.random() - 0.5,
        Math.random() - 0.5
      ]),
      timestamps: Array.from({ length: 10 }, (_, i) => i * 0.5)
    },
    flipTimeDistribution: {
      positions,
      flipTimes
    },
    energyEvolution: {
      time,
      exchangeEnergy,
      demagnetizationEnergy,
      zeemanEnergy,
      totalEnergy
    },
    vortexStates: [
      { time: 2.5, position: [100, 50, 2], topologicalCharge: 1 },
      { time: 5.0, position: [120, 60, 2], topologicalCharge: -1 }
    ],
    averageFlipTime: flipTimes.reduce((a, b) => a + b, 0) / flipTimes.length
  };
};

const now = new Date();
const hoursAgo = (h: number) => new Date(now.getTime() - h * 3600 * 1000);
const daysAgo = (d: number) => new Date(now.getTime() - d * 24 * 3600 * 1000);

const taskStatuses: TaskStatus[] = [
  TaskStatus.PENDING_VERIFY,
  TaskStatus.MICROMAG_CALC,
  TaskStatus.WARNING,
  TaskStatus.COMPLETED,
  TaskStatus.APPROVAL_L1
];

export const mockTasks: SimulationTask[] = [
  {
    id: 'task-001',
    name: 'MTJ-矩形-常规参数-批次A',
    status: taskStatuses[0],
    materialParams: createMaterialParams('CoFeB'),
    geometry: createGeometry('rectangle'),
    config: createConfig(),
    createdAt: hoursAgo(2),
    submittedBy: '张工',
    warnings: []
  },
  {
    id: 'task-002',
    name: 'STT-椭圆-高温测试',
    status: taskStatuses[1],
    materialParams: createMaterialParams('FePt'),
    geometry: createGeometry('ellipse'),
    config: createConfig(),
    createdAt: hoursAgo(5),
    startedAt: hoursAgo(3),
    submittedBy: '李工',
    warnings: [],
    currentStep: 450,
    totalSteps: 1000
  },
  {
    id: 'task-003',
    name: 'SOT-自定义-低阻尼实验',
    status: taskStatuses[2],
    materialParams: createMaterialParams('Co/Pt'),
    geometry: createGeometry('custom'),
    config: createConfig(),
    createdAt: hoursAgo(12),
    startedAt: hoursAgo(10),
    submittedBy: '王工',
    warnings: [],
    currentStep: 780,
    totalSteps: 1000
  },
  {
    id: 'task-004',
    name: 'MTJ-矩形-批次B-验证',
    status: taskStatuses[3],
    materialParams: createMaterialParams('CoFeB'),
    geometry: createGeometry('rectangle'),
    config: createConfig(),
    createdAt: daysAgo(1),
    startedAt: hoursAgo(20),
    completedAt: hoursAgo(15),
    submittedBy: '赵工',
    warnings: [],
    currentStep: 1000,
    totalSteps: 1000,
    results: createResults()
  },
  {
    id: 'task-005',
    name: 'VCM-椭圆-量产参数-007',
    status: taskStatuses[4],
    materialParams: createMaterialParams('FePd'),
    geometry: createGeometry('ellipse'),
    config: createConfig(),
    createdAt: daysAgo(2),
    startedAt: daysAgo(1),
    completedAt: hoursAgo(8),
    submittedBy: '钱工',
    warnings: [],
    currentStep: 1000,
    totalSteps: 1000,
    results: createResults()
  }
];

export const mockWarnings: WarningRecord[] = [
  {
    id: 'warn-001',
    taskId: 'task-003',
    type: 'flip_time_threshold',
    message: '检测到部分磁畴翻转时间1.8ns超过阈值1.5ns，请核查参数设置',
    triggerTime: hoursAgo(1),
    reviewed: false
  },
  {
    id: 'warn-002',
    taskId: 'task-003',
    type: 'vortex_state',
    message: '模拟过程中检测到涡旋态拓扑电荷异常变化，可能影响翻转稳定性',
    triggerTime: hoursAgo(0.5),
    reviewed: false
  },
  {
    id: 'warn-003',
    taskId: 'task-004',
    type: 'energy_anomaly',
    message: '总能量曲线出现局部波动，已由张工标记通过，波动在可接受范围内',
    triggerTime: hoursAgo(16),
    reviewed: true,
    reviewedBy: '张工',
    reviewedAt: hoursAgo(14),
    action: 'accept'
  }
];

export const mockDailyStats: DailyStatistics[] = Array.from({ length: 30 }, (_, i) => {
  const date = daysAgo(29 - i);
  const dateStr = date.toISOString().split('T')[0];
  const isWeekend = date.getDay() === 0 || date.getDay() === 6;
  const hasAnomalyPeak = i === 15;

  const totalTasks = isWeekend ? 3 + Math.floor(Math.random() * 3) : 8 + Math.floor(Math.random() * 8);
  const completionRate = hasAnomalyPeak
    ? 0.5 + Math.random() * 0.1
    : 0.82 + Math.random() * 0.15;
  const abnormalCount = hasAnomalyPeak ? 3 + Math.floor(Math.random() * 2) : Math.floor(Math.random() * 2);

  return {
    date: dateStr,
    totalTasks,
    completedTasks: Math.floor(totalTasks * completionRate),
    completionRate: Math.round(completionRate * 100) / 100,
    averageFlipTime: 0.8 + Math.random() * 0.6,
    accuracy: 0.92 + Math.random() * 0.07,
    abnormalCount,
    warningCount: Math.floor(Math.random() * 3) + (hasAnomalyPeak ? 3 : 0)
  };
});

export const mockRecommendations: Recommendation[] = [
  {
    id: 'rec-001',
    type: 'write_current',
    taskId: 'task-005',
    recommendation: '推荐写入电流值：45μA，脉宽：0.5ns',
    confidence: 0.94,
    rationale:
      '基于近30天120组同类器件统计，该电流参数可实现98.5%的翻转成功率，并将翻转时间控制在1.2ns以内，满足良率要求。',
    alternatives: ['40μA / 0.6ns（低功耗方案）', '50μA / 0.4ns（高速方案）']
  },
  {
    id: 'rec-002',
    type: 'pinned_layer',
    recommendation: '推荐钉扎层组合：CoFeB(1.2nm)/MgO(0.8nm)/CoFeB(1.0nm)',
    confidence: 0.89,
    rationale:
      '该结构在保持高隧道磁阻比(TMR>150%)的同时，可有效降低Dzyaloshinskii-Moriya相互作用，减少涡旋态形成概率。',
    alternatives: [
      'CoFeB(1.5nm)/MgO(1.0nm)/CoFeB(1.2nm)（高TMR方案）',
      'Co/Pt多层膜结构（垂直各向异性增强方案）'
    ]
  },
  {
    id: 'rec-003',
    type: 'write_current',
    recommendation: '推荐写入电流值：38μA，采用梯度脉冲波形',
    confidence: 0.87,
    rationale:
      '针对低阻尼材料(α<0.015)，梯度脉冲可降低预振幅振荡，减少能量耗散，相比方波功耗降低约22%。',
    alternatives: ['35μA / 方波（低复杂度）', '42μA / 正弦波（高稳定性）']
  }
];
