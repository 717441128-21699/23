import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import AppLayout from "@/components/layout/AppLayout";
import Dashboard from "@/pages/Dashboard";
import TaskSubmit from "@/pages/TaskSubmit";
import TaskMonitor from "@/pages/TaskMonitor";
import Warnings from "@/pages/Warnings";
import Reports from "@/pages/Reports";
import Recommend from "@/pages/Recommend";
import Approval from "@/pages/Approval";
import Statistics from "@/pages/Statistics";
import Export from "@/pages/Export";
import Settings from "@/pages/Settings";

export default function App() {
  return (
    <Router>
      <Routes>
        <Route element={<AppLayout systemStatus="normal" notificationCount={3} />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/tasks/submit" element={<TaskSubmit />} />
          <Route path="/tasks/monitor" element={<TaskMonitor />} />
          <Route path="/warnings" element={<Warnings />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/recommend" element={<Recommend />} />
          <Route path="/approval" element={<Approval />} />
          <Route path="/statistics" element={<Statistics />} />
          <Route path="/export" element={<Export />} />
          <Route path="/settings" element={<Settings />} />
        </Route>
      </Routes>
    </Router>
  );
}
