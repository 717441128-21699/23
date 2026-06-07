import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Bell,
  ChevronDown,
  User,
  LogOut,
  Settings as SettingsIcon,
  HelpCircle,
  Circle,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

type SystemStatus = "normal" | "warning" | "danger";

interface TopBarProps {
  systemStatus?: SystemStatus;
  notificationCount?: number;
}

export default function TopBar({
  systemStatus = "normal",
  notificationCount = 3,
}: TopBarProps) {
  const [searchFocused, setSearchFocused] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setShowUserMenu(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const statusConfig = {
    normal: { color: "bg-status-success", label: "系统正常", pulse: false },
    warning: { color: "bg-status-warning", label: "存在预警", pulse: false },
    danger: { color: "bg-status-danger animate-pulse-danger", label: "连续异常", pulse: true },
  };

  const status = statusConfig[systemStatus];

  const notifications = [
    { id: 1, type: "warning", title: "任务 #T-2048 翻转时间超阈值", time: "5分钟前" },
    { id: 2, type: "info", title: "任务 #T-2047 计算完成，等待审批", time: "12分钟前" },
    { id: 3, type: "danger", title: "连续3次异常，新任务已暂停", time: "1小时前" },
  ];

  const notifTypeColors = {
    warning: "bg-status-warning",
    info: "bg-status-info",
    danger: "bg-status-danger",
  };

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="h-16 glass border-b border-magnetic-blue/10 flex items-center px-6 gap-4 shrink-0"
    >
      <div className={cn(
        "flex items-center gap-2 flex-1 max-w-md transition-all duration-300",
        searchFocused ? "max-w-lg" : "max-w-md"
      )}>
        <div className={cn(
          "relative w-full flex items-center gap-2 px-4 py-2 rounded-lg border transition-all duration-300",
          searchFocused
            ? "bg-space-700/50 border-magnetic-blue/40 shadow-glow-blue"
            : "bg-space-800/40 border-magnetic-blue/10 hover:border-magnetic-blue/20"
        )}>
          <Search className={cn(
            "w-4 h-4 transition-colors duration-300",
            searchFocused ? "text-magnetic-blue" : "text-gray-500"
          )} />
          <input
            type="text"
            placeholder="搜索任务、参数、报告..."
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
            className="flex-1 bg-transparent text-sm text-gray-200 placeholder-gray-500 outline-none"
          />
          {searchFocused && (
            <motion.kbd
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-xs text-gray-500 px-1.5 py-0.5 rounded border border-magnetic-blue/20 bg-space-900/80"
            >
              ⌘K
            </motion.kbd>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3 ml-auto">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-space-800/40 border border-magnetic-blue/10">
          <Circle
            className={cn(
              "w-2.5 h-2.5 fill-current",
              status.color
            )}
          />
          <span className="text-xs text-gray-400">{status.label}</span>
        </div>

        <div ref={notifRef} className="relative">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              setShowNotifications(!showNotifications);
              setShowUserMenu(false);
            }}
            className="relative w-10 h-10 rounded-lg flex items-center justify-center bg-space-800/40 border border-magnetic-blue/10 text-gray-400 hover:text-gray-100 hover:border-magnetic-blue/20 transition-all duration-200"
          >
            <Bell className="w-5 h-5" />
            {notificationCount > 0 && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-status-danger text-white text-xs font-bold flex items-center justify-center"
              >
                {notificationCount > 9 ? "9+" : notificationCount}
              </motion.span>
            )}
          </motion.button>

          <AnimatePresence>
            {showNotifications && (
              <motion.div
                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className="absolute right-0 top-12 w-80 glass rounded-xl shadow-glass border border-magnetic-blue/15 overflow-hidden z-50"
              >
                <div className="flex items-center justify-between px-4 py-3 border-b border-magnetic-blue/10">
                  <h3 className="text-sm font-semibold text-gray-100">通知</h3>
                  <button className="text-xs text-magnetic-blue hover:text-magnetic-purple transition-colors">
                    全部标为已读
                  </button>
                </div>
                <div className="max-h-80 overflow-y-auto">
                  {notifications.map((notif) => (
                    <div
                      key={notif.id}
                      className="flex items-start gap-3 px-4 py-3 hover:bg-space-700/30 transition-colors cursor-pointer border-b border-magnetic-blue/5 last:border-0"
                    >
                      <div className={cn(
                        "w-2 h-2 rounded-full mt-1.5 shrink-0",
                        notifTypeColors[notif.type as keyof typeof notifTypeColors]
                      )} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-200 leading-snug">{notif.title}</p>
                        <p className="text-xs text-gray-500 mt-1">{notif.time}</p>
                      </div>
                      <X className="w-3.5 h-3.5 text-gray-600 hover:text-gray-400 shrink-0" />
                    </div>
                  ))}
                </div>
                <div className="px-4 py-2.5 border-t border-magnetic-blue/10">
                  <button className="w-full text-sm text-magnetic-blue hover:text-magnetic-purple text-center transition-colors py-1">
                    查看全部通知
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div ref={userMenuRef} className="relative">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => {
              setShowUserMenu(!showUserMenu);
              setShowNotifications(false);
            }}
            className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-lg bg-space-800/40 border border-magnetic-blue/10 hover:border-magnetic-blue/20 transition-all duration-200"
          >
            <div className="w-8 h-8 rounded-lg bg-magnetic-gradient flex items-center justify-center shadow-glow-blue">
              <User className="w-4 h-4 text-white" />
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-sm font-medium text-gray-100 leading-tight">张工程师</p>
              <p className="text-xs text-gray-500 leading-tight">磁学研发</p>
            </div>
            <ChevronDown className={cn(
              "w-4 h-4 text-gray-500 transition-transform duration-200",
              showUserMenu && "rotate-180"
            )} />
          </motion.button>

          <AnimatePresence>
            {showUserMenu && (
              <motion.div
                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className="absolute right-0 top-12 w-56 glass rounded-xl shadow-glass border border-magnetic-blue/15 overflow-hidden z-50"
              >
                <div className="px-4 py-3 border-b border-magnetic-blue/10">
                  <p className="text-sm font-semibold text-gray-100">张工程师</p>
                  <p className="text-xs text-gray-500 mt-0.5">engineer.zhang@micromag.com</p>
                </div>
                <div className="py-1">
                  {[
                    { icon: User, label: "个人资料" },
                    { icon: SettingsIcon, label: "偏好设置" },
                    { icon: HelpCircle, label: "帮助中心" },
                  ].map((item) => (
                    <button
                      key={item.label}
                      className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-300 hover:text-gray-100 hover:bg-space-700/30 transition-colors"
                    >
                      <item.icon className="w-4 h-4" />
                      {item.label}
                    </button>
                  ))}
                </div>
                <div className="border-t border-magnetic-blue/10 py-1">
                  <button className="w-full flex items-center gap-3 px-4 py-2 text-sm text-status-danger hover:bg-status-danger/10 transition-colors">
                    <LogOut className="w-4 h-4" />
                    退出登录
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.header>
  );
}
