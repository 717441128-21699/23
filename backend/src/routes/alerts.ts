import { Router, Request, Response, NextFunction } from 'express';
import { db } from '../db/inMemoryDB';
import { AppError } from '../middleware/errorHandler';
import type { WarningType, WarningAction, WarningRecord, CalculationConfig } from '../types';
import { TaskStatus } from '../types';
import { solveLLG } from '../services/llgSolver';

const router = Router();

interface CreateAlertBody {
  type: WarningType;
  taskId: string;
  message: string;
}

interface ReviewAlertBody {
  action: WarningAction;
  adjustedParams?: Partial<CalculationConfig>;
  reviewedBy: string;
}

router.get('/', (req: Request, res: Response, next: NextFunction) => {
  try {
    const { reviewed } = req.query;
    let alerts = db.getWarnings();
    if (reviewed !== undefined) {
      const isReviewed = reviewed === 'true';
      alerts = alerts.filter((a) => a.reviewed === isReviewed);
    }
    res.json({ success: true, data: alerts });
  } catch (err) {
    next(err);
  }
});

router.get('/:id', (req: Request, res: Response, next: NextFunction) => {
  try {
    const alert = db.getWarningById(req.params.id);
    if (!alert) {
      throw new AppError('预警不存在', 404);
    }
    res.json({ success: true, data: alert });
  } catch (err) {
    next(err);
  }
});

router.post('/', (req: Request, res: Response, next: NextFunction) => {
  try {
    const { type, taskId, message } = req.body as CreateAlertBody;
    if (!type || !taskId || !message) {
      throw new AppError('缺少必填字段: type, taskId, message', 400);
    }
    const task = db.getTaskById(taskId);
    if (!task) {
      throw new AppError('关联任务不存在', 404);
    }
    const alert: Omit<WarningRecord, 'id'> = {
      type,
      taskId,
      message,
      triggerTime: new Date(),
      reviewed: false
    };
    const created = db.createWarning(alert);
    db.updateTask(taskId, { status: TaskStatus.WARNING });
    res.status(201).json({ success: true, data: created });
  } catch (err) {
    next(err);
  }
});

router.post('/:id/review', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { action, adjustedParams, reviewedBy } = req.body as ReviewAlertBody;
    if (!action || !reviewedBy) {
      throw new AppError('缺少必填字段: action, reviewedBy', 400);
    }
    const alert = db.getWarningById(req.params.id);
    if (!alert) {
      throw new AppError('预警不存在', 404);
    }
    if (alert.reviewed) {
      throw new AppError('该预警已复核', 400);
    }
    const task = db.getTaskById(alert.taskId);
    if (!task) {
      throw new AppError('关联任务不存在', 404);
    }

    db.updateWarning(req.params.id, {
      reviewed: true,
      reviewedBy,
      reviewedAt: new Date(),
      action,
      adjustedParams
    });

    if (action === 'recalculate') {
      const newConfig = adjustedParams ? { ...task.config, ...adjustedParams } : task.config;
      db.updateTask(alert.taskId, {
        status: TaskStatus.MICROMAG_CALC,
        config: newConfig,
        startedAt: new Date()
      });
      solveLLG(task.materialParams, task.geometry, newConfig)
        .then((result) => {
          const hysteresisField = Array.from({ length: 50 }, (_, i) => -500 + (i * 1000) / 49);
          const hysteresisMag = hysteresisField.map((f) => Math.tanh(f / 100));
          const flipTimeFlat = result.flipTimes.map((arr) => arr[0] ?? 0).filter((t) => t > 0);
          const positions = result.domainStates.map((s) => s.position);
          const magVecs = result.domainStates.map((s) => s.magnetization);
          const timestamps = Array.from(new Set(result.domainStates.map((s) => s.time))).slice(0, 10);
          db.updateTask(alert.taskId, {
            status: TaskStatus.COMPLETED,
            completedAt: new Date(),
            results: {
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
                time: result.time,
                exchangeEnergy: result.exchangeEnergy,
                demagnetizationEnergy: result.demagnetizationEnergy,
                zeemanEnergy: result.zeemanEnergy,
                totalEnergy: result.totalEnergy
              },
              vortexStates: result.vortexStates,
              averageFlipTime: flipTimeFlat.length > 0
                ? flipTimeFlat.reduce((a, b) => a + b, 0) / flipTimeFlat.length
                : 0
            }
          });
        })
        .catch(() => {
          db.updateTask(alert.taskId, { status: TaskStatus.ABNORMAL });
          db.incrementAbnormal();
        });
    } else if (action === 'accept') {
      const unreviewed = db.getWarnings().filter(
        (w) => w.taskId === alert.taskId && !w.reviewed
      );
      if (unreviewed.length === 0) {
        const target = task.results ? TaskStatus.APPROVAL_L1 : TaskStatus.MICROMAG_CALC;
        db.updateTask(alert.taskId, { status: target });
      }
    }

    const updated = db.getWarningById(req.params.id);
    res.json({ success: true, data: updated });
  } catch (err) {
    next(err);
  }
});

export default router;
