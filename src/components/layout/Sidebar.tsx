import { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  LayoutDashboard,
  FilePlus,
  Activity,
  AlertTriangle,
  FileBarChart2,
  Wand2,
  CheckSquare,
  BarChart3,
  Download,
  Settings,
  ChevronLeft,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface NavItem {
  path: string;
  label: string;
  icon: LucideIcon;
}

const navItems: NavItem[] = [
  { path: "/dashboard", label: "仪表盘", icon: LayoutDashboard },
  { path: "/tasks/submit", label: "任务提交", icon: FilePlus },
  { path: "/tasks/monitor", label: "任务监控", icon: Activity },
  { path: "/warnings", label: "预警复核", icon: AlertTriangle },
  { path: "/reports", label: "报告中心", icon: FileBarChart2 },
  { path: "/recommend", label: "智能推荐", icon: Wand2 },
  { path: "/approval", label: "审批流程", icon: CheckSquare },
  { path: "/statistics", label: "统计看板", icon: BarChart3 },
  { path: "/export", label: "数据导出", icon: Download },
  { path: "/settings", label: "系统管理", icon: Settings },
];

interface SidebarProps {
  collapsed?: boolean;
  onToggle?: (collapsed: boolean) => void;
}

export default function Sidebar({ collapsed: externalCollapsed, onToggle }: SidebarProps) {
  const [internalCollapsed, setInternalCollapsed] = useState(false);
  const location = useLocation();

  const collapsed = externalCollapsed !== undefined ? externalCollapsed : internalCollapsed;

  const handleToggle = () => {
    const newState = !collapsed;
    if (onToggle) {
      onToggle(newState);
    } else {
      setInternalCollapsed(newState);
    }
  };

  const isActive = (path: string) => {
    if (path === "/dashboard") {
      return location.pathname === "/" || location.pathname === path;
    }
    return location.pathname.startsWith(path);
  };

  return (
    <motion.aside
      initial={false}
      animate={{ width: collapsed ? 80 : 260 }}
      transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
      className="relative h-screen glass flex flex-col border-r border-magnetic-blue/10"
    >
      <div className={cn(
        "flex items-center h-16 px-4 border-b border-magnetic-blue/10",
        collapsed ? "justify-center" : "justify-between"
      )}>
        <div className="flex items-center gap-3 overflow-hidden">
          <motion.div
            className="w-10 h-10 rounded-xl bg-magnetic-gradient flex items-center justify-center shrink-0 shadow-glow-blue"
            whileHover={{ scale: 1.05 }}
          >
            <Sparkles className="w-5 h-5 text-white" />
          </motion.div>
          <AnimatePresence>
            {!collapsed && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
                className="whitespace-nowrap"
              >
                <h1 className="text-lg font-bold text-gradient-magnetic tracking-wide">
                  MicroMag
                </h1>
                <p className="text-xs text-gray-500">微磁学模拟平台</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <nav className="flex-1 py-4 overflow-y-auto overflow-x-hidden">
        <ul className="space-y-1 px-3">
          {navItems.map((item, index) => {
            const Icon = item.icon;
            const active = isActive(item.path);

            return (
              <motion.li
                key={item.path}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: index * 0.04 }}
              >
                <NavLink
                  to={item.path === "/dashboard" ? "/" : item.path}
                  className={cn(
                    "relative flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group",
                    active
                      ? "bg-magnetic-gradient/10 text-magnetic-blue shadow-glow-blue/20"
                      : "text-gray-400 hover:text-gray-100 hover:bg-space-700/50"
                  )}
                >
                  {active && (
                    <motion.div
                      layoutId="activeNav"
                      className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 rounded-r-full bg-magnetic-gradient"
                      transition={{ type: "spring", stiffness: 500, damping: 30 }}
                    />
                  )}
                  <Icon className={cn(
                    "w-5 h-5 shrink-0 transition-transform duration-200",
                    active && "scale-110"
                  )} />
                  <AnimatePresence>
                    {!collapsed && (
                      <motion.span
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="whitespace-nowrap text-sm font-medium"
                      >
                        {item.label}
                      </motion.span>
                    )}
                  </AnimatePresence>
                  {collapsed && (
                    <div className="absolute left-full ml-2 px-2 py-1 rounded-md glass text-xs whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-opacity duration-200 z-50">
                      {item.label}
                    </div>
                  )}
                </NavLink>
              </motion.li>
            );
          })}
        </ul>
      </nav>

      <div className="p-3 border-t border-magnetic-blue/10">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleToggle}
          className={cn(
            "w-full flex items-center gap-2 px-3 py-2 rounded-lg text-gray-400 hover:text-gray-100 hover:bg-space-700/50 transition-all duration-200",
            collapsed && "justify-center"
          )}
        >
          {collapsed ? (
            <ChevronRight className="w-5 h-5" />
          ) : (
            <>
              <ChevronLeft className="w-5 h-5" />
              <span className="text-sm">收起侧边栏</span>
            </>
          )}
        </motion.button>
      </div>
    </motion.aside>
  );
}
