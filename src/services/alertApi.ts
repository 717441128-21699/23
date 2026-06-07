import { apiGet, apiPost } from './apiClient';
import type {
  WarningRecord,
  WarningType,
  WarningAction,
  CalculationConfig,
} from '@/types';

export interface CreateAlertPayload {
  taskId: string;
  type: WarningType;
  message: string;
}

export interface ReviewAlertPayload {
  action: WarningAction;
  adjustedParams?: Partial<CalculationConfig>;
  reviewedBy: string;
}

export function fetchAlerts(reviewed?: boolean): Promise<WarningRecord[]> {
  return apiGet<WarningRecord[]>('/alerts',
    reviewed !== undefined ? { reviewed } : undefined
  );
}

export function fetchAlert(id: string): Promise<WarningRecord> {
  return apiGet<WarningRecord>(`/alerts/${id}`);
}

export function createAlert(payload: CreateAlertPayload): Promise<WarningRecord> {
  return apiPost<WarningRecord>('/alerts', payload);
}

export function reviewAlert(
  id: string,
  payload: ReviewAlertPayload
): Promise<WarningRecord> {
  return apiPost<WarningRecord>(`/alerts/${id}/review`, payload);
}
