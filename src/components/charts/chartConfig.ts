import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  type ChartOptions,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export const chartThemeColors = {
  textPrimary: '#F1F5F9',
  textSecondary: '#94A3B8',
  textMuted: '#64748B',
  gridLine: 'rgba(59, 130, 246, 0.1)',
  borderPrimary: 'rgba(59, 130, 246, 0.2)',
  background: 'rgba(13, 31, 53, 0.4)',
  tooltipBg: 'rgba(10, 22, 40, 0.95)',
  tooltipBorder: 'rgba(59, 130, 246, 0.4)',
  accentBlue: '#3B82F6',
  accentPurple: '#8B5CF6',
  accentCyan: '#06B6D4',
  accentPink: '#F72585',
  red: '#EF4444',
  green: '#10B981',
  yellow: '#F59E0B',
};

export const baseChartOptions: ChartOptions<'line'> = {
  responsive: true,
  maintainAspectRatio: false,
  interaction: {
    mode: 'index',
    intersect: false,
  },
  plugins: {
    legend: {
      display: true,
      position: 'top',
      align: 'end',
      labels: {
        color: chartThemeColors.textSecondary,
        font: { family: 'Space Grotesk', size: 11 },
        usePointStyle: true,
        pointStyle: 'circle',
        padding: 16,
        boxWidth: 8,
      },
    },
    tooltip: {
      enabled: true,
      backgroundColor: chartThemeColors.tooltipBg,
      titleColor: chartThemeColors.textPrimary,
      bodyColor: chartThemeColors.textSecondary,
      borderColor: chartThemeColors.tooltipBorder,
      borderWidth: 1,
      cornerRadius: 8,
      padding: 12,
      titleFont: { family: 'Space Grotesk', size: 12, weight: 600 },
      bodyFont: { family: 'JetBrains Mono', size: 11 },
    },
  },
  scales: {
    x: {
      grid: {
        color: chartThemeColors.gridLine,
      },
      ticks: {
        color: chartThemeColors.textMuted,
        font: { family: 'JetBrains Mono', size: 10 },
      },
      border: {
        display: false,
      },
    },
    y: {
      grid: {
        color: chartThemeColors.gridLine,
      },
      ticks: {
        color: chartThemeColors.textMuted,
        font: { family: 'JetBrains Mono', size: 10 },
      },
      border: {
        display: false,
      },
    },
  },
};
