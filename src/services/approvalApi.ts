import { apiGet, apiPost } from './apiClient';
import type { ApprovalRecord, ApprovalDecision } from '@/types';

export interface SubmitApprovalPayload {
  taskId: string;
  level: 1 | 2;
  decision: ApprovalDecision;
  comment: string;
  approver: string;
}

export function fetchApprovals(): Promise<ApprovalRecord[]> {
  return apiGet<ApprovalRecord[]>('/approvals');
}

export function fetchApprovalsByTask(
  taskId: string
): Promise<ApprovalRecord[]> {
  return apiGet<ApprovalRecord[]>(`/approvals/${taskId}`);
}

export function submitApproval(
  payload: SubmitApprovalPayload
): Promise<ApprovalRecord> {
  return apiPost<ApprovalRecord>('/approvals', payload);
}
