import { Router, Request, Response, NextFunction } from 'express';
import { db } from '../db/inMemoryDB';
import { AppError } from '../middleware/errorHandler';
import { TaskStatus } from '../types';
import type {
  SimulationTask, WarningRecord, SimulationResults
} from '../types';
import { solveLLG } from '../services/llgSolver';

const router = Router();

interface CreateTaskBody {
  name: string;
  materialParams: SimulationTask['materialParams'];
  geometry: SimulationTask['geometry'];
  config: SimulationTask['config'];
  submittedBy: string;
}

interface PatchTaskBody {
  status?: TaskStatus;
  currentStep?: number;
  totalSteps?: number;
}

function llgToResults(llg: Awaited<ReturnType<typeof solveLLG>>): SimulationResults {
  const hysteresisField = Array.from({ length: 50 }, (_, i) => -500 + (i * 1000) / 49);
  const hysteresisMag = hysteresisField.map((f) => Math.tanh(f / 100));
  const flipTimeFlat = llg.flipTimes.map((arr) => arr[0] ?? 0).filter((t) => t > 0);
  const uniqPositions = new Map<string, number[]>();
  const uniqMagMap = new Map<string, number[]>();
  for (const s of llg.domainStates) {
    const key = `${s.position[0].toFixed(2)},${s.position[1].toFixed(2)},${s.position[2].toFixed(2)}`;
    if (!uniqPositions.has(key)) {
      uniqPositions.set(key, s.position);
      uniqMagMap.set(key, s.magnetization);
    }
  }
  const positions = Array.from(uniqPositions.values());
  const magVecs = positions.map((p) => {
    const key = `${p[0].toFixed(2)},${p[1].toFixed(2)},${p[2].toFixed(2)}`;
    return uniqMagMap.get(key) ?? [0, 0, 1];
  });
  const timestamps = Array.from(new Set(llg.domainStates.map((s) => s.time))).slice(0, 10);
  return {
    hysteresisLoop: {
      field: hysteresisField,
      magnetization: hysteresisMag,
      coercivity: 50 + Math.random() * 50,
      remanence: 0.7 + Math.random() * 0.2
    },
    domainStructure: { positions, magnetizationVectors: magVecs, timestamps },
    flipTimeDistribution: {
      positions: positions.slice(0, flipTimeFlat.length),
      flipTimes: flipTimeFlat
    },
    energyEvolution: {
      time: llg.time,
      exchangeEnergy: llg.exchangeEnergy,
      demagnetizationEnergy: llg.demagnetizationEnergy,
      zeemanEnergy: llg.zeemanEnergy,
      totalEnergy: llg.totalEnergy
    },
    vortexStates: llg.vortexStates,
    averageFlipTime: flipTimeFlat.length > 0
      ? flipTimeFlat.reduce((a, b) => a + b, 0) / flipTimeFlat.length
      : 0
  };
}

function handleStatusTransition(task: SimulationTask): void {
  if (task.status === TaskStatus.ABNORMAL) {
    db.incrementAbnormal();
  }
}

async function runTaskStateMachine(taskId: string): Promise<void> {
  const totalSteps = 100;
  const updateProgress = (step: number) => {
    db.updateTask(taskId, { currentStep: step, totalSteps });
  };

  setTimeout(() => {
    db.updateTask(taskId, { status: TaskStatus.GRID_GENERATION, startedAt: new Date() });
    updateProgress(15);
  }, 1000);

  setTimeout(() => {
    db.updateTask(taskId, { status: TaskStatus.INITIALIZATION });
    updateProgress(35);
  }, 3000);

  setTimeout(async () => {
    const task = db.updateTask(taskId, { status: TaskStatus.MICROMAG_CALC });
    updateProgress(55);
    if (!task) return;
    try {
      const llg = await solveLLG(task.materialParams, task.geometry, task.config);
      const results = llgToResults(llg);
      const newWarnings: WarningRecord[] = [];
      if (results.averageFlipTime > task.config.flipTimeThreshold) {
        db.addWarning(taskId, {
          taskId,
          type: 'flip_time_threshold',
          message: `平均翻转时间 ${results.averageFlipTime.toFixed(2)}ns 超过阈值 ${task.config.flipTimeThreshold}ns`,
          triggerTime: new Date(),
          reviewed: false
        });
      }
      if (results.vortexStates.length > 0 && task.config.vortexDetectionEnabled) {
        db.addWarning(taskId, {
          taskId,
          type: 'vortex_state',
          message: `检测到 ${results.vortexStates.length} 个涡旋态`,
          triggerTime: new Date(),
          reviewed: false
        });
      }
      const updatedTask = db.getTaskById(taskId);
      const hasWarnings = updatedTask && updatedTask.warnings.length > 0;
      db.updateTask(taskId, {
        status: hasWarnings ? TaskStatus.WARNING : TaskStatus.COMPLETED,
        completedAt: new Date(),
        currentStep: 100,
        totalSteps,
        results
      });
    } catch {
      const updated = db.updateTask(taskId, {
        status: TaskStatus.ABNORMAL,
        completedAt: new Date()
      });
      if (updated) handleStatusTransition(updated);
    }
  }, 6000);
}

router.get('/', (req: Request, res: Response, next: NextFunction) => {
  try {
    const { status } = req.query;
    let tasks: SimulationTask[];
    if (status && typeof status === 'string' && Object.values(TaskStatus).includes(status as TaskStatus)) {
      tasks = db.getTasksByStatus(status as TaskStatus);
    } else if (status && typeof status === 'string') {
      throw new AppError('无效的状态过滤值', 400);
    } else {
      tasks = db.getTasks();
    }
    res.json({ success: true, data: tasks });
  } catch (err) {
    next(err);
  }
});

router.get('/:id', (req: Request, res: Response, next: NextFunction) => {
  try {
    const task = db.getTaskById(req.params.id);
    if (!task) {
      throw new AppError('任务不存在', 404);
    }
    res.json({ success: true, data: task });
  } catch (err) {
    next(err);
  }
});

router.post('/', (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, materialParams, geometry, config, submittedBy } = req.body as CreateTaskBody;
    if (!name || !materialParams || !geometry || !config || !submittedBy) {
      throw new AppError('缺少必填字段: name, materialParams, geometry, config, submittedBy', 400);
    }
    const sysState = db.getSystemState();
    if (sysState.isSystemPaused) {
      throw new AppError('系统因连续异常任务已暂停，请联系主管', 503);
    }
    const task = db.createTask({ name, materialParams, geometry, config, submittedBy });
    res.status(201).json({ success: true, data: task });
    void runTaskStateMachine(task.id);
  } catch (err) {
    next(err);
  }
});

router.patch('/:id', (req: Request, res: Response, next: NextFunction) => {
  try {
    const input = req.body as PatchTaskBody;
    const patch: PatchTaskBody = {};
    if (input.status !== undefined) patch.status = input.status;
    if (input.currentStep !== undefined) patch.currentStep = input.currentStep;
    if (input.totalSteps !== undefined) patch.totalSteps = input.totalSteps;
    if (patch.status && !Object.values(TaskStatus).includes(patch.status)) {
      throw new AppError('无效的任务状态', 400);
    }
    if (Object.keys(patch).length === 0) {
      throw new AppError('没有有效的更新字段', 400);
    }
    const updated = db.updateTask(req.params.id, patch);
    if (!updated) {
      throw new AppError('任务不存在', 404);
    }
    if (patch.status) handleStatusTransition(updated);
    res.json({ success: true, data: updated });
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', (req: Request, res: Response, next: NextFunction) => {
  try {
    const deleted = db.deleteTask(req.params.id);
    if (!deleted) {
      throw new AppError('任务不存在', 404);
    }
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

export default router;
