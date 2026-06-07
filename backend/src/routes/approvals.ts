import { Router, Request, Response, NextFunction } from 'express';
import { db } from '../db/inMemoryDB';
import { AppError } from '../middleware/errorHandler';
import type { ApprovalDecision, ApprovalRecord } from '../types';
import { TaskStatus } from '../types';

const router = Router();

interface CreateApprovalBody {
  taskId: string;
  level: 1 | 2;
  approver: string;
  decision: ApprovalDecision;
  comment: string;
}

router.get('/', (_req: Request, res: Response, next: NextFunction) => {
  try {
    const approvals = db.getApprovals();
    res.json({ success: true, data: approvals });
  } catch (err) {
    next(err);
  }
});

router.get('/:taskId', (req: Request, res: Response, next: NextFunction) => {
  try {
    const approvals = db.getApprovalsByTaskId(req.params.taskId);
    res.json({ success: true, data: approvals });
  } catch (err) {
    next(err);
  }
});

router.post('/', (req: Request, res: Response, next: NextFunction) => {
  try {
    const { taskId, level, approver, decision, comment } = req.body as CreateApprovalBody;
    if (!taskId || !level || !approver || !decision) {
      throw new AppError('缺少必填字段: taskId, level, approver, decision', 400);
    }
    if (level !== 1 && level !== 2) {
      throw new AppError('level 必须为 1 或 2', 400);
    }
    const task = db.getTaskById(taskId);
    if (!task) {
      throw new AppError('任务不存在', 404);
    }

    const record: Omit<ApprovalRecord, 'id'> = {
      taskId,
      level,
      approver,
      decision,
      comment: comment ?? '',
      timestamp: new Date()
    };
    const created = db.createApproval(record);

    if (decision === 'approved') {
      if (level === 1) {
        db.updateTask(taskId, { status: TaskStatus.APPROVAL_L2 });
      } else if (level === 2) {
        db.updateTask(taskId, {
          status: TaskStatus.PUSHED_TO_FAB,
          completedAt: new Date()
        });
      }
    } else if (decision === 'rejected') {
      db.updateTask(taskId, { status: TaskStatus.MICROMAG_CALC });
    }

    res.status(201).json({ success: true, data: created });
  } catch (err) {
    next(err);
  }
});

export default router;
