import { create } from 'zustand';

export type UserRole = 'admin' | 'chief_scientist' | 'engineer' | 'viewer';
export type NotificationChannel = 'in_app' | 'email' | 'sms';

export interface SystemUser {
  id: string;
  username: string;
  role: UserRole;
  status: 'active' | 'disabled';
  email?: string;
}

export interface ThresholdConfig {
  flipTimeThresholdNs: number;
  vortexDetectionThreshold: number;
  energyAnomalyCoefficient: number;
}

export interface AlertConfig {
  consecutiveAnomalyPauseCount: number;
  notificationChannels: Record<NotificationChannel, boolean>;
  notifiedUsers: string[];
}

export interface ToastState {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

interface SettingsStore {
  thresholds: ThresholdConfig;
  alerts: AlertConfig;
  users: SystemUser[];
  toasts: ToastState[];

  setThresholds: (thresholds: Partial<ThresholdConfig>) => void;
  saveThresholds: () => void;

  setAlerts: (alerts: Partial<AlertConfig>) => void;
  toggleNotificationChannel: (channel: NotificationChannel) => void;
  addNotifiedUser: (userId: string) => void;
  removeNotifiedUser: (userId: string) => void;
  saveAlerts: () => void;

  toggleUserStatus: (userId: string) => void;
  updateUserRole: (userId: string, role: UserRole) => void;
  saveUsers: () => void;

  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  dismissToast: (id: string) => void;
}

const defaultThresholds: ThresholdConfig = {
  flipTimeThresholdNs: 1.5,
  vortexDetectionThreshold: 0.8,
  energyAnomalyCoefficient: 1.5,
};

const defaultAlerts: AlertConfig = {
  consecutiveAnomalyPauseCount: 3,
  notificationChannels: {
    in_app: true,
    email: true,
    sms: false,
  },
  notifiedUsers: ['user-001', 'user-002'],
};

const defaultUsers: SystemUser[] = [
  { id: 'user-001', username: '首席科学家', role: 'chief_scientist', status: 'active', email: 'chief@lab.com' },
  { id: 'user-002', username: '张工', role: 'engineer', status: 'active', email: 'zhang@lab.com' },
  { id: 'user-003', username: '李工', role: 'engineer', status: 'active', email: 'li@lab.com' },
  { id: 'user-004', username: '王工', role: 'viewer', status: 'disabled', email: 'wang@lab.com' },
  { id: 'user-005', username: '管理员', role: 'admin', status: 'active', email: 'admin@lab.com' },
];

export const useSettingsStore = create<SettingsStore>((set, get) => ({
  thresholds: defaultThresholds,
  alerts: defaultAlerts,
  users: defaultUsers,
  toasts: [],

  setThresholds: (thresholds) =>
    set((state) => ({ thresholds: { ...state.thresholds, ...thresholds } })),

  saveThresholds: () => {
    get().showToast('阈值配置已保存', 'success');
  },

  setAlerts: (alerts) =>
    set((state) => ({ alerts: { ...state.alerts, ...alerts } })),

  toggleNotificationChannel: (channel) =>
    set((state) => ({
      alerts: {
        ...state.alerts,
        notificationChannels: {
          ...state.alerts.notificationChannels,
          [channel]: !state.alerts.notificationChannels[channel],
        },
      },
    })),

  addNotifiedUser: (userId) =>
    set((state) => ({
      alerts: {
        ...state.alerts,
        notifiedUsers: state.alerts.notifiedUsers.includes(userId)
          ? state.alerts.notifiedUsers
          : [...state.alerts.notifiedUsers, userId],
      },
    })),

  removeNotifiedUser: (userId) =>
    set((state) => ({
      alerts: {
        ...state.alerts,
        notifiedUsers: state.alerts.notifiedUsers.filter((id) => id !== userId),
      },
    })),

  saveAlerts: () => {
    get().showToast('告警规则已保存', 'success');
  },

  toggleUserStatus: (userId) =>
    set((state) => ({
      users: state.users.map((u) =>
        u.id === userId ? { ...u, status: u.status === 'active' ? 'disabled' : 'active' } : u
      ),
    })),

  updateUserRole: (userId, role) =>
    set((state) => ({
      users: state.users.map((u) => (u.id === userId ? { ...u, role } : u)),
    })),

  saveUsers: () => {
    get().showToast('用户权限已保存', 'success');
  },

  showToast: (message, type = 'success') => {
    const id = Math.random().toString(36).slice(2, 11);
    set((state) => ({ toasts: [...state.toasts, { id, message, type }] }));
    setTimeout(() => get().dismissToast(id), 3000);
  },

  dismissToast: (id) =>
    set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),
}));
