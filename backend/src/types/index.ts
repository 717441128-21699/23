export enum TaskStatus {
  PENDING_VERIFY = 'pending_verify',
  GRID_GENERATION = 'grid_generation',
  INITIALIZATION = 'initialization',
  MICROMAG_CALC = 'micromag_calc',
  COMPLETED = 'completed',
  ABNORMAL = 'abnormal',
  WARNING = 'warning',
  APPROVAL_L1 = 'approval_l1',
  APPROVAL_L2 = 'approval_l2',
  PUSHED_TO_FAB = 'pushed_to_fab'
}

export type WarningType = 'flip_time_threshold' | 'vortex_state' | 'energy_anomaly';
export type WarningAction = 'accept' | 'recalculate' | 'reject';
export type RecommendationType = 'write_current' | 'pinned_layer';
export type ApprovalDecision = 'approved' | 'rejected';
export type DeviceShape = 'rectangle' | 'ellipse' | 'custom';

export interface MaterialParams {
  saturationMagnetization: number;
  anisotropyConstant: number;
  exchangeStiffness: number;
  dampingCoefficient: number;
  gyromagneticRatio: number;
  temperature: number;
  materialType: string;
}

export interface DeviceGeometry {
  length: number;
  width: number;
  thickness: number;
  meshSize: number;
  shape: DeviceShape;
  stlFile?: File;
}

export interface ExternalField {
  magnitude: number;
  directionX: number;
  directionY: number;
  directionZ: number;
}

export interface CalculationConfig {
  externalField: ExternalField;
  simulationTime: number;
  timeStep: number;
  flipTimeThreshold: number;
  vortexDetectionEnabled: boolean;
}

export interface WarningRecord {
  id: string;
  taskId: string;
  type: WarningType;
  message: string;
  triggerTime: Date;
  reviewed: boolean;
  reviewedBy?: string;
  reviewedAt?: Date;
  action?: WarningAction;
  adjustedParams?: Partial<CalculationConfig>;
}

export interface HysteresisLoop {
  field: number[];
  magnetization: number[];
  coercivity: number;
  remanence: number;
}

export interface DomainStructure {
  positions: number[][];
  magnetizationVectors: number[][];
  timestamps: number[];
}

export interface FlipTimeDistribution {
  positions: number[][];
  flipTimes: number[];
}

export interface EnergyEvolution {
  time: number[];
  exchangeEnergy: number[];
  demagnetizationEnergy: number[];
  zeemanEnergy: number[];
  totalEnergy: number[];
}

export interface VortexState {
  time: number;
  position: number[];
  topologicalCharge: number;
}

export interface SimulationResults {
  hysteresisLoop: HysteresisLoop;
  domainStructure: DomainStructure;
  flipTimeDistribution: FlipTimeDistribution;
  energyEvolution: EnergyEvolution;
  vortexStates: VortexState[];
  averageFlipTime: number;
}

export interface SimulationTask {
  id: string;
  name: string;
  status: TaskStatus;
  materialParams: MaterialParams;
  geometry: DeviceGeometry;
  config: CalculationConfig;
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  submittedBy: string;
  warnings: WarningRecord[];
  currentStep?: number;
  totalSteps?: number;
  results?: SimulationResults;
}

export interface Recommendation {
  id: string;
  type: RecommendationType;
  taskId?: string;
  recommendation: string;
  confidence: number;
  rationale: string;
  alternatives: string[];
}

export interface ApprovalRecord {
  id: string;
  taskId: string;
  level: 1 | 2;
  approver: string;
  decision: ApprovalDecision;
  comment: string;
  timestamp: Date;
}

export interface DailyStatistics {
  date: string;
  totalTasks: number;
  completedTasks: number;
  completionRate: number;
  averageFlipTime: number;
  accuracy: number;
  abnormalCount: number;
  warningCount: number;
}

export interface SystemState {
  consecutiveAbnormalCount: number;
  isSystemPaused: boolean;
  pausedAt?: Date;
  chiefScientistNotified?: boolean;
}

export interface LLGResult {
  time: number[];
  mx: number[];
  my: number[];
  mz: number[];
  exchangeEnergy: number[];
  demagnetizationEnergy: number[];
  zeemanEnergy: number[];
  totalEnergy: number[];
  flipTimes: number[][];
  domainStates: { position: number[]; magnetization: number[]; time: number }[];
  vortexStates: VortexState[];
}

export interface EnergyCloud {
  positions: number[][];
  energyDensity: number[];
}

export interface ReportData {
  hysteresisLoop: HysteresisLoop;
  domainStructure: DomainStructure;
  flipTimeDistribution: FlipTimeDistribution;
  energyCloud: EnergyCloud;
}

export interface WriteCurrentRecommendation {
  range: { min: number; max: number; optimal: number };
  confidence: number;
  rationale: string;
}

export interface PinnedLayerRecommendation {
  materials: string[];
  thicknesses: number[];
  confidence: number;
  expectedCoercivity: number;
  thermalStability: number;
}
