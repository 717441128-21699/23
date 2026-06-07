import type { SimulationTask, SystemState, WarningRecord, ApprovalRecord, DailyStatistics } from '../types';
import { TaskStatus } from '../types';

const generateId = (): string =>
  Math.random().toString(36).slice(2, 11) + Date.now().toString(36).slice(-4);

class InMemoryDB {
  private tasks: Map<string, SimulationTask> = new Map();
  private warnings: Map<string, WarningRecord> = new Map();
  private approvals: Map<string, ApprovalRecord> = new Map();
  private systemState: SystemState = {
    consecutiveAbnormalCount: 0,
    isSystemPaused: false,
    chiefScientistNotified: false
  };

  generateId(): string {
    return generateId();
  }

  getSystemState(): SystemState {
    return { ...this.systemState };
  }

  updateSystemState(patch: Partial<SystemState>): SystemState {
    this.systemState = { ...this.systemState, ...patch };
    return { ...this.systemState };
  }

  incrementAbnormal(): SystemState {
    const newCount = this.systemState.consecutiveAbnormalCount + 1;
    this.systemState.consecutiveAbnormalCount = newCount;
    if (newCount >= 3) {
      this.systemState.isSystemPaused = true;
    }
    return { ...this.systemState };
  }

  resetAbnormalCount(): void {
    this.systemState.consecutiveAbnormalCount = 0;
  }

  pauseSystem(): SystemState {
    this.systemState.isSystemPaused = true;
    this.systemState.chiefScientistNotified = true;
    this.systemState.pausedAt = new Date();
    return { ...this.systemState };
  }

  resumeSystem(): SystemState {
    this.systemState.isSystemPaused = false;
    this.systemState.consecutiveAbnormalCount = 0;
    this.systemState.chiefScientistNotified = false;
    this.systemState.pausedAt = undefined;
    return { ...this.systemState };
  }

  seed(): void {
    if (this.tasks.size > 0) return;
    const defaultMaterial = {
      saturationMagnetization: 1.2e6,
      anisotropyConstant: 5e4,
      exchangeStiffness: 1.3e-11,
      dampingCoefficient: 0.02,
      gyromagneticRatio: 2.21e5,
      temperature: 300,
      materialType: 'CoFeB'
    };
    const defaultGeometry = {
      length: 100,
      width: 50,
      thickness: 2,
      meshSize: 5,
      shape: 'rectangle' as const
    };
    const defaultConfig = {
      externalField: { magnitude: 300, directionX: 0, directionY: 0, directionZ: -1 },
      simulationTime: 5,
      timeStep: 0.02,
      flipTimeThreshold: 3.0,
      vortexDetectionEnabled: true
    };
    const statuses: TaskStatus[] = [
      TaskStatus.PENDING_VERIFY,
      TaskStatus.GRID_GENERATION,
      TaskStatus.MICROMAG_CALC,
      TaskStatus.COMPLETED,
      TaskStatus.WARNING
    ];
    const names = ['CoFeB-矩形器件-A1', 'Permalloy-椭圆磁畴-B2', 'FePt-高各向异性-C3', 'STT-MRAM单元-D4', 'SOT器件优化-E5'];
    statuses.forEach((status, i) => {
      const id = this.generateId();
      const now = new Date();
      now.setMinutes(now.getMinutes() - (i * 37 + 12));
      const task: SimulationTask = {
        id,
        name: names[i],
        status,
        materialParams: { ...defaultMaterial, materialType: i === 1 ? 'Permalloy' : i === 2 ? 'FePt' : 'CoFeB' },
        geometry: defaultGeometry,
        config: defaultConfig,
        createdAt: now,
        startedAt: status !== TaskStatus.PENDING_VERIFY ? now : undefined,
        completedAt: status === TaskStatus.COMPLETED || status === TaskStatus.WARNING ? new Date(now.getTime() + 180000) : undefined,
        submittedBy: '工程师-' + ((i % 3) + 1),
        warnings: [],
        currentStep: status === TaskStatus.MICROMAG_CALC ? 55 : status === TaskStatus.GRID_GENERATION ? 20 : status === TaskStatus.COMPLETED || status === TaskStatus.WARNING ? 100 : 5,
        totalSteps: 100,
        results: status === TaskStatus.COMPLETED || status === TaskStatus.WARNING ? {
          hysteresisLoop: {
            field: Array.from({ length: 50 }, (_, k) => -500 + (k * 1000) / 49),
            magnetization: Array.from({ length: 50 }, (_, k) => Math.tanh((-500 + (k * 1000) / 49) / 100)),
            coercivity: 78.5,
            remanence: 0.82
          },
          domainStructure: {
            positions: [[0, 0, 0], [50, 25, 0], [100, 50, 0]],
            magnetizationVectors: [[0, 0, 1], [0.1, 0.2, 0.97], [0, 0, -1]],
            timestamps: [0, 1, 2, 3, 4, 5]
          },
          flipTimeDistribution: {
            positions: [[0, 0, 0], [50, 25, 0], [100, 50, 0]],
            flipTimes: [1.8, 2.4, 2.9]
          },
          energyEvolution: {
            time: [0, 0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5],
            exchangeEnergy: [1e-18, 1.2e-18, 1.6e-18, 2.0e-18, 1.8e-18, 1.5e-18, 1.3e-18, 1.2e-18, 1.1e-18, 1.05e-18, 1e-18],
            demagnetizationEnergy: [5e-19, 5.5e-19, 6e-19, 5.8e-19, 5.5e-19, 5.2e-19, 5e-19, 4.9e-19, 4.8e-19, 4.75e-19, 4.7e-19],
            zeemanEnergy: [-2e-18, -1.8e-18, -1e-18, 0, 1e-18, 1.5e-18, 1.8e-18, 1.9e-18, 1.95e-18, 1.98e-18, 2e-18],
            totalEnergy: [-5e-19, -5e-20, 1.2e-18, 2.58e-18, 2.3e-18, 1.72e-18, 1.1e-18, 7.9e-19, 5.3e-19, 4.05e-19, 3.7e-19]
          },
          vortexStates: i === 4 ? [{ time: 1.8, position: [50, 25, 0], topologicalCharge: 0.5 }] : [],
          averageFlipTime: 2.35
        } : undefined
      };
      this.tasks.set(id, task);
      if (i === 4) {
        const wid = this.generateId();
        const warn: WarningRecord = {
          id: wid,
          taskId: id,
          type: 'flip_time_threshold',
          message: `平均翻转时间 2.9ns 超过阈值 ${defaultConfig.flipTimeThreshold}ns`,
          triggerTime: new Date(now.getTime() + 170000),
          reviewed: false
        };
        this.warnings.set(wid, warn);
        task.warnings.push(warn);
      }
    });
  }

  createTask(task: Omit<SimulationTask, 'id' | 'createdAt' | 'status' | 'warnings'>): SimulationTask {
    const id = this.generateId();
    const newTask: SimulationTask = {
      ...task,
      id,
      status: TaskStatus.PENDING_VERIFY,
      createdAt: new Date(),
      warnings: []
    };
    this.tasks.set(id, newTask);
    return this.cloneTask(newTask);
  }

  getTasks(): SimulationTask[] {
    return Array.from(this.tasks.values()).map((t) => this.cloneTask(t));
  }

  getTasksByStatus(status: TaskStatus): SimulationTask[] {
    return this.getTasks().filter((t) => t.status === status);
  }

  getTaskById(id: string): SimulationTask | undefined {
    const task = this.tasks.get(id);
    return task ? this.cloneTask(task) : undefined;
  }

  updateTask(id: string, patch: Partial<SimulationTask>): SimulationTask | undefined {
    const existing = this.tasks.get(id);
    if (!existing) return undefined;
    const updated = { ...existing, ...patch };
    this.tasks.set(id, updated);
    return this.cloneTask(updated);
  }

  deleteTask(id: string): boolean {
    return this.tasks.delete(id);
  }

  addWarning(taskId: string, warning: Omit<WarningRecord, 'id'>): WarningRecord | undefined {
    const task = this.tasks.get(taskId);
    if (!task) return undefined;
    const id = this.generateId();
    const newWarning: WarningRecord = { ...warning, id };
    this.warnings.set(id, newWarning);
    task.warnings.push(newWarning);
    return { ...newWarning };
  }

  createWarning(warning: Omit<WarningRecord, 'id'>): WarningRecord {
    const id = this.generateId();
    const newWarning: WarningRecord = { ...warning, id };
    this.warnings.set(id, newWarning);
    const task = this.tasks.get(warning.taskId);
    if (task) {
      task.warnings.push(newWarning);
    }
    return { ...newWarning, triggerTime: new Date(newWarning.triggerTime) };
  }

  getWarnings(): WarningRecord[] {
    return Array.from(this.warnings.values()).map((w) => ({
      ...w,
      triggerTime: new Date(w.triggerTime),
      reviewedAt: w.reviewedAt ? new Date(w.reviewedAt) : undefined
    }));
  }

  getWarningById(id: string): WarningRecord | undefined {
    const w = this.warnings.get(id);
    if (!w) return undefined;
    return {
      ...w,
      triggerTime: new Date(w.triggerTime),
      reviewedAt: w.reviewedAt ? new Date(w.reviewedAt) : undefined
    };
  }

  updateWarning(id: string, patch: Partial<WarningRecord>): WarningRecord | undefined {
    const existing = this.warnings.get(id);
    if (!existing) return undefined;
    const updated: WarningRecord = { ...existing, ...patch };
    this.warnings.set(id, updated);
    const task = this.tasks.get(updated.taskId);
    if (task) {
      const idx = task.warnings.findIndex((w) => w.id === id);
      if (idx >= 0) task.warnings[idx] = updated;
    }
    return {
      ...updated,
      triggerTime: new Date(updated.triggerTime),
      reviewedAt: updated.reviewedAt ? new Date(updated.reviewedAt) : undefined
    };
  }

  createApproval(approval: Omit<ApprovalRecord, 'id'>): ApprovalRecord {
    const id = this.generateId();
    const record: ApprovalRecord = { ...approval, id };
    this.approvals.set(id, record);
    return { ...record, timestamp: new Date(record.timestamp) };
  }

  getApprovals(): ApprovalRecord[] {
    return Array.from(this.approvals.values()).map((a) => ({
      ...a,
      timestamp: new Date(a.timestamp)
    }));
  }

  getApprovalsByTaskId(taskId: string): ApprovalRecord[] {
    return this.getApprovals().filter((a) => a.taskId === taskId);
  }

  getDailyStatistics(days: number = 30): DailyStatistics[] {
    const tasks = this.getTasks();
    const result: DailyStatistics[] = [];
    const now = new Date();
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      d.setHours(0, 0, 0, 0);
      const nextD = new Date(d);
      nextD.setDate(nextD.getDate() + 1);
      const dayTasks = tasks.filter((t) => t.createdAt >= d && t.createdAt < nextD);
      const completed = dayTasks.filter((t) => t.status === TaskStatus.COMPLETED || t.status === TaskStatus.PUSHED_TO_FAB);
      const abnormal = dayTasks.filter((t) => t.status === TaskStatus.ABNORMAL);
      const withWarnings = dayTasks.filter((t) => t.warnings.length > 0);
      const flipTimes = completed
        .map((t) => t.results?.averageFlipTime)
        .filter((v): v is number => typeof v === 'number');
      result.push({
        date: d.toISOString().split('T')[0],
        totalTasks: dayTasks.length,
        completedTasks: completed.length,
        completionRate: dayTasks.length > 0 ? completed.length / dayTasks.length : 0,
        averageFlipTime: flipTimes.length > 0 ? flipTimes.reduce((a, b) => a + b, 0) / flipTimes.length : 0,
        accuracy: 0.9 + Math.random() * 0.09,
        abnormalCount: abnormal.length,
        warningCount: withWarnings.length
      });
    }
    return result;
  }

  private cloneTask(task: SimulationTask): SimulationTask {
    return {
      ...task,
      createdAt: new Date(task.createdAt),
      startedAt: task.startedAt ? new Date(task.startedAt) : undefined,
      completedAt: task.completedAt ? new Date(task.completedAt) : undefined,
      warnings: task.warnings.map((w) => ({
        ...w,
        triggerTime: new Date(w.triggerTime),
        reviewedAt: w.reviewedAt ? new Date(w.reviewedAt) : undefined
      })),
      results: task.results ? JSON.parse(JSON.stringify(task.results)) : undefined
    };
  }
}

export const db = new InMemoryDB();
