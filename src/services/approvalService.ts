import { TaskStatus } from '@/types';
import type { ApprovalRecord, ApprovalDecision } from '@/types';
import { useTaskStore } from '@/store/taskStore';

const approvalHistoryStore = new Map<string, ApprovalRecord[]>();

function generateId(): string {
  return Math.random().toString(36).slice(2, 11);
}

export function submitApproval(
  taskId: string,
  level: 1 | 2,
  decision: ApprovalDecision,
  comment: string
): ApprovalRecord {
  const record: ApprovalRecord = {
    id: generateId(),
    taskId,
    level,
    approver: '当前用户',
    decision,
    comment,
    timestamp: new Date(),
  };

  const history = approvalHistoryStore.get(taskId) || [];
  history.push(record);
  approvalHistoryStore.set(taskId, history);

  if (decision === 'approved') {
    const nextStatus = level === 1 ? TaskStatus.APPROVAL_L2 : TaskStatus.PUSHED_TO_FAB;
    useTaskStore.getState().updateTaskStatus(taskId, nextStatus);
  }

  return record;
}

export function getApprovalHistory(taskId: string): ApprovalRecord[] {
  return approvalHistoryStore.get(taskId) || [];
}

export function pushToFabrication(taskId: string): void {
  useTaskStore.getState().updateTaskStatus(taskId, TaskStatus.PUSHED_TO_FAB);
}

export function rejectToRecalculate(taskId: string, comment: string): void {
  const record: ApprovalRecord = {
    id: generateId(),
    taskId,
    level: 1,
    approver: '当前用户',
    decision: 'rejected',
    comment,
    timestamp: new Date(),
  };

  const history = approvalHistoryStore.get(taskId) || [];
  history.push(record);
  approvalHistoryStore.set(taskId, history);

  useTaskStore.getState().updateTaskStatus(taskId, TaskStatus.PENDING_VERIFY);
}
