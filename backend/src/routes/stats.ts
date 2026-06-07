import { Router, Request, Response, NextFunction } from 'express';
import { db } from '../db/inMemoryDB';
import { AppError } from '../middleware/errorHandler';
import { TaskStatus } from '../types';

const router = Router();

router.get('/daily', (_req: Request, res: Response, next: NextFunction) => {
  try {
    const stats = db.getDailyStatistics(30);
    res.json({ success: true, data: stats });
  } catch (err) {
    next(err);
  }
});

router.get('/summary', (_req: Request, res: Response, next: NextFunction) => {
  try {
    const tasks = db.getTasks();
    const totalTasks = tasks.length;
    const completedStatuses = [TaskStatus.COMPLETED, TaskStatus.APPROVAL_L1, TaskStatus.APPROVAL_L2, TaskStatus.PUSHED_TO_FAB];
    const completedTasks = tasks.filter((t) => completedStatuses.includes(t.status));
    const completionRate = totalTasks > 0 ? completedTasks.length / totalTasks : 0;

    const flipTimes = completedTasks
      .map((t) => t.results?.averageFlipTime)
      .filter((v): v is number => typeof v === 'number');
    const averageFlipTime = flipTimes.length > 0
      ? flipTimes.reduce((a, b) => a + b, 0) / flipTimes.length
      : 0;

    const daily = db.getDailyStatistics(30);
    const avgAccuracy = daily.length > 0
      ? daily.reduce((a, d) => a + d.accuracy, 0) / daily.length
      : 0.9;

    res.json({
      success: true,
      data: {
        totalTasks,
        completionRate,
        averageFlipTime,
        averageAccuracy: avgAccuracy
      }
    });
  } catch (err) {
    next(err);
  }
});

router.get('/system-status', (_req: Request, res: Response, next: NextFunction) => {
  try {
    const state = db.getSystemState();
    res.json({
      success: true,
      data: {
        isSystemPaused: state.isSystemPaused,
        consecutiveAbnormalCount: state.consecutiveAbnormalCount,
        pausedAt: state.pausedAt,
        chiefScientistNotified: state.chiefScientistNotified ?? false
      }
    });
  } catch (err) {
    next(err);
  }
});

router.post('/system-pause', (_req: Request, res: Response, next: NextFunction) => {
  try {
    const state = db.pauseSystem();
    res.json({ success: true, data: state });
  } catch (err) {
    next(err);
  }
});

router.post('/system-resume', (_req: Request, res: Response, next: NextFunction) => {
  try {
    const state = db.resumeSystem();
    res.json({ success: true, data: state });
  } catch (err) {
    next(err);
  }
});

export default router;
