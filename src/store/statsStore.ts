import { create } from 'zustand';
import type { DailyStatistics } from '@/types';
import {
  fetchDailyStats as apiFetchDailyStats,
  fetchStatsSummary,
  fetchSystemStatus as apiFetchSystemStatus,
  type StatsSummary,
  type SystemStatus,
} from '@/services/statsApi';

interface StatsStore {
  dailyStats: DailyStatistics[];
  summary: StatsSummary | null;
  systemStatus: SystemStatus | null;

  loadDailyStats: () => Promise<void>;
  loadSummary: () => Promise<void>;
  loadSystemStatus: () => Promise<void>;

  addStats: (stats: DailyStatistics) => void;
  getStatsByRange: (
    startDate: string,
    endDate: string
  ) => DailyStatistics[];
  getStatsByDate: (date: string) => DailyStatistics | undefined;
  getTotalStats: () => {
    totalTasks: number;
    completedTasks: number;
    avgCompletionRate: number;
    avgFlipTime: number;
    avgAccuracy: number;
    totalAbnormal: number;
    totalWarnings: number;
  };
}

export const useStatsStore = create<StatsStore>((set, get) => ({
  dailyStats: [],
  summary: null,
  systemStatus: null,

  loadDailyStats: async () => {
    const data = await apiFetchDailyStats();
    set({ dailyStats: data });
  },

  loadSummary: async () => {
    const data = await fetchStatsSummary();
    set({ summary: data });
  },

  loadSystemStatus: async () => {
    const data = await apiFetchSystemStatus();
    set({ systemStatus: data });
  },

  addStats: (stats) =>
    set((state) => {
      const existingIndex = state.dailyStats.findIndex(
        (s) => s.date === stats.date
      );
      if (existingIndex >= 0) {
        const updated = [...state.dailyStats];
        updated[existingIndex] = stats;
        return { dailyStats: updated };
      }
      return { dailyStats: [...state.dailyStats, stats] };
    }),

  getStatsByRange: (startDate, endDate) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    return get()
      .dailyStats.filter((s) => {
        const d = new Date(s.date);
        return d >= start && d <= end;
      })
      .sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
      );
  },

  getStatsByDate: (date) =>
    get().dailyStats.find((s) => s.date === date),

  getTotalStats: () => {
    const stats = get().dailyStats;
    if (stats.length === 0) {
      return {
        totalTasks: 0,
        completedTasks: 0,
        avgCompletionRate: 0,
        avgFlipTime: 0,
        avgAccuracy: 0,
        totalAbnormal: 0,
        totalWarnings: 0,
      };
    }
    const totalTasks = stats.reduce((sum, s) => sum + s.totalTasks, 0);
    const completedTasks = stats.reduce(
      (sum, s) => sum + s.completedTasks,
      0
    );
    const avgCompletionRate =
      stats.reduce((sum, s) => sum + s.completionRate, 0) / stats.length;
    const avgFlipTime =
      stats.reduce((sum, s) => sum + s.averageFlipTime, 0) / stats.length;
    const avgAccuracy =
      stats.reduce((sum, s) => sum + s.accuracy, 0) / stats.length;
    const totalAbnormal = stats.reduce(
      (sum, s) => sum + s.abnormalCount,
      0
    );
    const totalWarnings = stats.reduce(
      (sum, s) => sum + s.warningCount,
      0
    );

    return {
      totalTasks,
      completedTasks,
      avgCompletionRate: Math.round(avgCompletionRate * 100) / 100,
      avgFlipTime: Math.round(avgFlipTime * 100) / 100,
      avgAccuracy: Math.round(avgAccuracy * 100) / 100,
      totalAbnormal,
      totalWarnings,
    };
  },
}));
