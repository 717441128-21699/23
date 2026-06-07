import { apiGet, apiPost } from './apiClient';
import type { DailyStatistics } from '@/types';

export interface StatsSummary {
  totalTasks: number;
  completionRate: number;
  averageFlipTime: number;
  averageAccuracy: number;
  totalAbnormal?: number;
  totalWarnings?: number;
  avgCompletionRate?: number;
  avgFlipTime?: number;
  avgAccuracy?: number;
}

export interface SystemStatus {
  isSystemPaused: boolean;
  consecutiveAbnormalCount: number;
  pausedAt?: string;
  chiefScientistNotified: boolean;
}

export function fetchDailyStats(): Promise<DailyStatistics[]> {
  return apiGet<DailyStatistics[]>('/stats/daily');
}

export function fetchStatsSummary(): Promise<StatsSummary> {
  return apiGet<StatsSummary>('/stats/summary');
}

export function fetchSystemStatus(): Promise<SystemStatus> {
  return apiGet<SystemStatus>('/stats/system-status');
}

export function pauseSystem(): Promise<SystemStatus> {
  return apiPost<SystemStatus>('/stats/system-pause');
}

export function resumeSystem(): Promise<SystemStatus> {
  return apiPost<SystemStatus>('/stats/system-resume');
}

