import { create } from 'zustand';
import type {
  SimulationTask,
  TaskStatus,
  WarningRecord,
  SimulationResults,
} from '@/types';
import {
  fetchTasks,
  fetchTask,
  createTask,
  updateTask,
  type CreateTaskPayload,
  type UpdateTaskPatch,
} from '@/services/taskApi';
import {
  fetchSystemStatus as apiFetchSystemStatus,
  pauseSystem as apiPauseSystem,
  resumeSystem as apiResumeSystem,
} from '@/services/statsApi';

interface TaskStore {
  tasks: SimulationTask[];
  currentTaskId: string | null;
  consecutiveAbnormalCount: number;
  isSystemPaused: boolean;

  loadTasks: (status?: TaskStatus) => Promise<void>;
  loadTask: (id: string) => Promise<SimulationTask | undefined>;
  createTaskAndRun: (payload: CreateTaskPayload) => Promise<SimulationTask>;
  patchTask: (id: string, patch: UpdateTaskPatch) => Promise<void>;
  fetchSystemStatus: () => Promise<void>;
  pauseSystem: () => Promise<void>;
  resumeSystem: () => Promise<void>;

  addTask: (task: SimulationTask) => void;
  updateTaskStatus: (taskId: string, status: TaskStatus) => void;
  updateTaskProgress: (
    taskId: string,
    currentStep: number,
    totalSteps: number
  ) => void;
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

  loadTasks: async (status) => {
    const data = await fetchTasks(status);
    set({ tasks: data });
  },

  loadTask: async (id) => {
    const data = await fetchTask(id);
    set((state) => ({
      tasks: state.tasks.map((t) => (t.id === id ? data : t)),
    }));
    return data;
  },

  createTaskAndRun: async (payload) => {
    const task = await createTask(payload);
    set((state) => ({ tasks: [...state.tasks, task] }));
    return task;
  },

  patchTask: async (id, patch) => {
    const updated = await updateTask(id, patch);
    set((state) => ({
      tasks: state.tasks.map((t) => (t.id === id ? updated : t)),
    }));
  },

  fetchSystemStatus: async () => {
    const status = await apiFetchSystemStatus();
    set({
      isSystemPaused: status.isSystemPaused,
      consecutiveAbnormalCount: status.consecutiveAbnormalCount,
    });
  },

  pauseSystem: async () => {
    const status = await apiPauseSystem();
    set({
      isSystemPaused: status.isSystemPaused,
      consecutiveAbnormalCount: status.consecutiveAbnormalCount,
    });
  },

  resumeSystem: async () => {
    const status = await apiResumeSystem();
    set({
      isSystemPaused: status.isSystemPaused,
      consecutiveAbnormalCount: status.consecutiveAbnormalCount,
    });
  },

  addTask: (task) =>
    set((state) => ({
      tasks: [...state.tasks, task],
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
      }),
    })),

  updateTaskProgress: (taskId, currentStep, totalSteps) =>
    set((state) => ({
      tasks: state.tasks.map((task) =>
        task.id === taskId ? { ...task, currentStep, totalSteps } : task
      ),
    })),

  addWarning: (taskId, warning) =>
    set((state) => ({
      tasks: state.tasks.map((task) =>
        task.id === taskId
          ? {
              ...task,
              warnings: [...task.warnings, warning],
              status: 'warning' as TaskStatus,
            }
          : task
      ),
    })),

  setResults: (taskId, results) =>
    set((state) => ({
      tasks: state.tasks.map((task) =>
        task.id === taskId
          ? { ...task, results, status: 'completed' as TaskStatus }
          : task
      ),
    })),

  incrementAbnormal: () =>
    set((state) => {
      const newCount = state.consecutiveAbnormalCount + 1;
      return {
        consecutiveAbnormalCount: newCount,
        isSystemPaused: newCount >= 3 ? true : state.isSystemPaused,
      };
    }),

  toggleSystemPause: () =>
    set((state) => ({
      isSystemPaused: !state.isSystemPaused,
      consecutiveAbnormalCount: !state.isSystemPaused
        ? state.consecutiveAbnormalCount
        : 0,
    })),

  setCurrentTaskId: (taskId) => set({ currentTaskId: taskId }),

  getTaskById: (taskId) => get().tasks.find((t) => t.id === taskId),
}));
