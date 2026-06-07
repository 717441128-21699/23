import { create } from 'zustand';
import type { WarningRecord, WarningAction, CalculationConfig } from '@/types';

interface WarningStore {
  warnings: WarningRecord[];

  addWarning: (warning: WarningRecord) => void;
  markReviewed: (
    warningId: string,
    reviewedBy: string,
    action?: WarningAction,
    adjustedParams?: Partial<CalculationConfig>
  ) => void;
  updateWarning: (warningId: string, updates: Partial<WarningRecord>) => void;
  getWarningsByTaskId: (taskId: string) => WarningRecord[];
  getUnreviewedWarnings: () => WarningRecord[];
  getWarningById: (warningId: string) => WarningRecord | undefined;
}

export const useWarningStore = create<WarningStore>((set, get) => ({
  warnings: [],

  addWarning: (warning) =>
    set((state) => ({
      warnings: [...state.warnings, warning]
    })),

  markReviewed: (warningId, reviewedBy, action, adjustedParams) =>
    set((state) => ({
      warnings: state.warnings.map((warning) =>
        warning.id === warningId
          ? {
              ...warning,
              reviewed: true,
              reviewedBy,
              reviewedAt: new Date(),
              action: action ?? warning.action,
              adjustedParams: adjustedParams ?? warning.adjustedParams
            }
          : warning
      )
    })),

  updateWarning: (warningId, updates) =>
    set((state) => ({
      warnings: state.warnings.map((warning) =>
        warning.id === warningId ? { ...warning, ...updates } : warning
      )
    })),

  getWarningsByTaskId: (taskId) =>
    get().warnings.filter((w) => w.taskId === taskId),

  getUnreviewedWarnings: () =>
    get().warnings.filter((w) => !w.reviewed),

  getWarningById: (warningId) =>
    get().warnings.find((w) => w.id === warningId)
}));
