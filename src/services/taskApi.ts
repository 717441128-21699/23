import { apiGet, apiPost, apiPatch, apiDel } from './apiClient';
import type {
  SimulationTask,
  TaskStatus,
  MaterialParams,
  DeviceGeometry,
  CalculationConfig,
  SimulationResults,
} from '@/types';

export interface CreateTaskPayload {
  name: string;
  materialParams: MaterialParams;
  geometry: DeviceGeometry;
  config: CalculationConfig;
  submittedBy: string;
}

export type UpdateTaskPatch = Partial<{
  status: TaskStatus;
  currentStep: number;
  totalSteps: number;
  results: SimulationResults;
}>;

export interface SimulatePayload {
  materialParams: MaterialParams;
  geometry: DeviceGeometry;
  config: CalculationConfig;
}

export function fetchTasks(status?: TaskStatus): Promise<SimulationTask[]> {
  return apiGet<SimulationTask[]>('/tasks', status ? { status } : undefined);
}

export function fetchTask(id: string): Promise<SimulationTask> {
  return apiGet<SimulationTask>(`/tasks/${id}`);
}

export function createTask(payload: CreateTaskPayload): Promise<SimulationTask> {
  return apiPost<SimulationTask>('/tasks', payload);
}

export function updateTask(
  id: string,
  patch: UpdateTaskPatch
): Promise<SimulationTask> {
  return apiPatch<SimulationTask>(`/tasks/${id}`, patch);
}

export function deleteTask(id: string): Promise<void> {
  return apiDel<void>(`/tasks/${id}`);
}

export function simulateLLG(payload: SimulatePayload): Promise<SimulationResults> {
  return apiPost<SimulationResults>('/simulate', payload);
}
