import { useState } from "react";
import { Outlet } from "react-router-dom";
import { motion } from "framer-motion";
import Sidebar from "./Sidebar";
import TopBar from "./TopBar";

type SystemStatus = "normal" | "warning" | "danger";

interface AppLayoutProps {
  systemStatus?: SystemStatus;
  notificationCount?: number;
}

export default function AppLayout({
  systemStatus = "normal",
  notificationCount = 3,
}: AppLayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-space-950">
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggle={setSidebarCollapsed}
      />
      <div className="flex flex-col flex-1 min-w-0">
        <TopBar
          systemStatus={systemStatus}
          notificationCount={notificationCount}
        />
        <motion.main
          key={sidebarCollapsed ? "collapsed" : "expanded"}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="flex-1 overflow-y-auto overflow-x-hidden p-6"
        >
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="max-w-[1600px] mx-auto w-full"
          >
            <Outlet />
          </motion.div>
        </motion.main>
      </div>
    </div>
  );
}
