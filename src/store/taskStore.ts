import { create } from 'zustand';
import type {
  SimulationTask,
  TaskStatus,
  WarningRecord,
  SimulationResults,
  CalculationConfig
} from '@/types';

interface TaskStore {
  tasks: SimulationTask[];
  currentTaskId: string | null;
  consecutiveAbnormalCount: number;
  isSystemPaused: boolean;

  addTask: (task: SimulationTask) => void;
  updateTaskStatus: (taskId: string, status: TaskStatus) => void;
  updateTaskProgress: (taskId: string, currentStep: number, totalSteps: number) => void;
  addWarning: (taskId: string, warning: WarningRecord) => void;
  setResults: (taskId: string, results: SimulationResults) => void;
  incrementAbnormal: () => void;
  toggleSystemPause: () => void;
  setCurrentTaskId: (taskId: string | null) => void;
  getTaskById: (taskId: string) => SimulationTask | undefined;
}

export const useTaskStore = create<TaskStore>((set, get) => ({
  tasks: [],
  currentTaskId: null,
  consecutiveAbnormalCount: 0,
  isSystemPaused: false,

  addTask: (task) =>
    set((state) => ({
      tasks: [...state.tasks, task]
    })),

  updateTaskStatus: (taskId, status) =>
    set((state) => ({
      tasks: state.tasks.map((task) => {
        if (task.id !== taskId) return task;
        const updates: Partial<SimulationTask> = { status };
        if (
          status !== 'pending_verify' &&
          status !== 'abnormal' &&
          !task.startedAt
        ) {
          updates.startedAt = new Date();
        }
        if (
          status === 'completed' ||
          status === 'abnormal' ||
          status === 'pushed_to_fab'
        ) {
          updates.completedAt = new Date();
        }
        return { ...task, ...updates };
      })
    })),

  updateTaskProgress: (taskId, currentStep, totalSteps) =>
    set((state) => ({
      tasks: state.tasks.map((task) =>
        task.id === taskId
          ? { ...task, currentStep, totalSteps }
          : task
      )
    })),

  addWarning: (taskId, warning) =>
    set((state) => ({
      tasks: state.tasks.map((task) =>
        task.id === taskId
          ? {
              ...task,
              warnings: [...task.warnings, warning],
              status: 'warning' as TaskStatus
            }
          : task
      )
    })),

  setResults: (taskId, results) =>
    set((state) => ({
      tasks: state.tasks.map((task) =>
        task.id === taskId
          ? { ...task, results, status: 'completed' as TaskStatus }
          : task
      )
    })),

  incrementAbnormal: () =>
    set((state) => {
      const newCount = state.consecutiveAbnormalCount + 1;
      return {
        consecutiveAbnormalCount: newCount,
        isSystemPaused: newCount >= 3 ? true : state.isSystemPaused
      };
    }),

  toggleSystemPause: () =>
    set((state) => ({
      isSystemPaused: !state.isSystemPaused,
      consecutiveAbnormalCount: !state.isSystemPaused
        ? state.consecutiveAbnormalCount
        : 0
    })),

  setCurrentTaskId: (taskId) =>
    set({ currentTaskId: taskId }),

  getTaskById: (taskId) => get().tasks.find((t) => t.id === taskId)
}));
