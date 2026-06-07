import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import { ArrowUpRight, ArrowDownRight, Minus } from "lucide-react";
import GlassCard from "./GlassCard";
import { cn } from "@/lib/utils";

type TrendDirection = "up" | "down" | "neutral";

interface StatCardProps {
  icon: LucideIcon;
  title: string;
  value: string | number;
  trend?: number;
  trendLabel?: string;
  iconColor?: "blue" | "purple" | "pink" | "success" | "warning" | "danger" | "info";
  className?: string;
}

const iconColorClasses: Record<string, string> = {
  blue: "from-magnetic-blue/20 to-magnetic-blue/5 text-magnetic-blue",
  purple: "from-magnetic-purple/20 to-magnetic-purple/5 text-magnetic-purple",
  pink: "from-magnetic-pink/20 to-magnetic-pink/5 text-magnetic-pink",
  success: "from-status-success/20 to-status-success/5 text-status-success",
  warning: "from-status-warning/20 to-status-warning/5 text-status-warning",
  danger: "from-status-danger/20 to-status-danger/5 text-status-danger",
  info: "from-status-info/20 to-status-info/5 text-status-info",
};

function getTrendInfo(trend: number): { direction: TrendDirection; color: string; Icon: LucideIcon } {
  if (trend > 0) {
    return { direction: "up", color: "text-status-success", Icon: ArrowUpRight };
  }
  if (trend < 0) {
    return { direction: "down", color: "text-status-danger", Icon: ArrowDownRight };
  }
  return { direction: "neutral", color: "text-gray-400", Icon: Minus };
}

export default function StatCard({
  icon: Icon,
  title,
  value,
  trend,
  trendLabel,
  iconColor = "blue",
  className,
}: StatCardProps) {
  const trendInfo = trend !== undefined ? getTrendInfo(trend) : null;
  const TrendIcon = trendInfo?.Icon;

  return (
    <GlassCard className={cn("relative overflow-hidden", className)}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm text-gray-400 mb-1">{title}</p>
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-3xl font-bold text-gradient-magnetic tracking-tight"
          >
            {value}
          </motion.div>
          {trendInfo && TrendIcon && (
            <div className="flex items-center gap-1 mt-2">
              <TrendIcon className={cn("w-4 h-4", trendInfo.color)} />
              <span className={cn("text-sm font-medium", trendInfo.color)}>
                {Math.abs(trend)}%
              </span>
              {trendLabel && (
                <span className="text-sm text-gray-500">{trendLabel}</span>
              )}
            </div>
          )}
        </div>
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className={cn(
            "w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-to-br",
            iconColorClasses[iconColor]
          )}
        >
          <Icon className="w-6 h-6" />
        </motion.div>
      </div>
      <div className="absolute -bottom-10 -right-10 w-32 h-32 rounded-full bg-gradient-to-br opacity-10 blur-2xl pointer-events-none"
        style={{
          background: iconColor === "purple"
            ? "linear-gradient(135deg, #9B51E0, transparent)"
            : iconColor === "pink"
            ? "linear-gradient(135deg, #F72585, transparent)"
            : iconColor === "success"
            ? "linear-gradient(135deg, #00C48C, transparent)"
            : iconColor === "warning"
            ? "linear-gradient(135deg, #FF8A00, transparent)"
            : iconColor === "danger"
            ? "linear-gradient(135deg, #FF4757, transparent)"
            : iconColor === "info"
            ? "linear-gradient(135deg, #17C3B2, transparent)"
            : "linear-gradient(135deg, #4F8EF7, transparent)",
        }}
      />
    </GlassCard>
  );
}
