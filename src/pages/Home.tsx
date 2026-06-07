import {
  LayoutDashboard,
  FilePlus,
  Activity,
  AlertTriangle,
  FileBarChart2,
  CheckSquare,
} from "lucide-react";
import GlassCard from "@/components/ui/GlassCard";
import StatCard from "@/components/ui/StatCard";

export default function Home() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-100">工作台仪表盘</h1>
        <p className="text-sm text-gray-500 mt-1">欢迎回来，今日系统运行正常</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard
          icon={LayoutDashboard}
          title="今日任务数"
          value="28"
          trend={12.5}
          trendLabel="较昨日"
          iconColor="blue"
        />
        <StatCard
          icon={CheckSquare}
          title="任务完成率"
          value="87.3%"
          trend={5.2}
          trendLabel="较昨日"
          iconColor="success"
        />
        <StatCard
          icon={Activity}
          title="平均翻转时间"
          value="14.2ns"
          trend={-3.8}
          trendLabel="较昨日"
          iconColor="purple"
        />
        <StatCard
          icon={AlertTriangle}
          title="待处理预警"
          value="5"
          trend={2}
          trendLabel="新增"
          iconColor="danger"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <GlassCard className="lg:col-span-2">
          <h2 className="text-lg font-semibold text-gray-100 mb-4">系统概览</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {[
              { icon: FilePlus, label: "待校验任务", value: "3", color: "text-status-warning" },
              { icon: Activity, label: "计算中任务", value: "8", color: "text-magnetic-blue" },
              { icon: CheckSquare, label: "已完成任务", value: "17", color: "text-status-success" },
              { icon: AlertTriangle, label: "异常任务", value: "2", color: "text-status-danger" },
              { icon: FileBarChart2, label: "待审批", value: "4", color: "text-magnetic-purple" },
              { icon: LayoutDashboard, label: "总任务数", value: "156", color: "text-gray-300" },
            ].map((item, idx) => (
              <div
                key={idx}
                className="p-3 rounded-lg bg-space-800/40 border border-magnetic-blue/5 hover:border-magnetic-blue/20 transition-colors"
              >
                <item.icon className={`w-5 h-5 ${item.color} mb-1`} />
                <p className="text-xs text-gray-500">{item.label}</p>
                <p className="text-xl font-semibold text-gray-100 mt-0.5">{item.value}</p>
              </div>
            ))}
          </div>
        </GlassCard>

        <GlassCard>
          <h2 className="text-lg font-semibold text-gray-100 mb-4">最近预警</h2>
          <div className="space-y-3">
            {[
              { type: "danger", title: "翻转时间超阈值", task: "#T-2048", time: "5分钟前" },
              { type: "warning", title: "涡旋态检测", task: "#T-2045", time: "22分钟前" },
              { type: "warning", title: "能量异常波动", task: "#T-2041", time: "1小时前" },
              { type: "info", title: "参数接近阈值", task: "#T-2038", time: "2小时前" },
            ].map((item, idx) => (
              <div
                key={idx}
                className="flex items-center gap-3 p-3 rounded-lg bg-space-800/30 hover:bg-space-700/40 transition-colors cursor-pointer"
              >
                <div
                  className={`w-1 h-10 rounded-full ${
                    item.type === "danger"
                      ? "bg-status-danger"
                      : item.type === "warning"
                      ? "bg-status-warning"
                      : "bg-status-info"
                  }`}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-200 truncate">{item.title}</p>
                  <p className="text-xs text-gray-500">{item.task} · {item.time}</p>
                </div>
              </div>
            ))}
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
