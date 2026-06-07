import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sliders, Bell, Users, Info, Save, Check, X, Mail, Smartphone, MessageSquare, Shield, User, Edit3, Power } from 'lucide-react';
import GlassCard from '@/components/ui/GlassCard';
import { useSettingsStore, type UserRole, type NotificationChannel } from '@/store/settingsStore';
import { cn } from '@/lib/utils';

type TabKey = 'thresholds' | 'alerts' | 'users' | 'about';
const TABS: { k: TabKey; l: string; i: typeof Sliders }[] = [
  { k: 'thresholds', l: '阈值配置', i: Sliders },
  { k: 'alerts', l: '告警规则', i: Bell },
  { k: 'users', l: '用户权限', i: Users },
  { k: 'about', l: '关于', i: Info },
];
const R_L: Record<UserRole, string> = { admin: '管理员', chief_scientist: '首席科学家', engineer: '工程师', viewer: '访客' };
const R_C: Record<UserRole, string> = { admin: 'bg-status-danger/15 text-status-danger border-status-danger/30', chief_scientist: 'bg-magnetic-purple/15 text-magnetic-purple border-magnetic-purple/30', engineer: 'bg-magnetic-blue/15 text-magnetic-blue border-magnetic-blue/30', viewer: 'bg-gray-500/15 text-gray-400 border-gray-500/30' };
const CHS: { k: NotificationChannel; l: string; i: typeof Mail }[] = [{ k: 'in_app', l: '站内信', i: MessageSquare }, { k: 'email', l: '邮件', i: Mail }, { k: 'sms', l: '短信', i: Smartphone }];

function Toasts() {
  const { toasts, dismissToast } = useSettingsStore();
  return (
    <div className="fixed top-5 right-5 z-50 space-y-2">
      <AnimatePresence>
        {toasts.map((t) => (
          <motion.div key={t.id} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className={cn('glass-panel px-4 py-3 flex items-center gap-3 min-w-64 shadow-glow-blue', t.type === 'success' && 'border-status-success/40', t.type === 'error' && 'border-status-danger/40')}>
            <div className={cn('w-7 h-7 rounded-full flex items-center justify-center shrink-0', t.type === 'success' ? 'bg-status-success/20 text-status-success' : t.type === 'error' ? 'bg-status-danger/20 text-status-danger' : 'bg-magnetic-blue/20 text-magnetic-blue')}>
              {t.type === 'success' ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
            </div>
            <p className="text-sm text-gray-200 flex-1">{t.message}</p>
            <button onClick={() => dismissToast(t.id)} className="text-gray-500 hover:text-gray-300"><X className="w-4 h-4" /></button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

export default function Settings() {
  const [tab, setTab] = useState<TabKey>('thresholds');
  const { thresholds, setThresholds, saveThresholds, alerts, setAlerts, toggleNotificationChannel, addNotifiedUser, removeNotifiedUser, saveAlerts, users, toggleUserStatus, updateUserRole, saveUsers } = useSettingsStore();

  const [th, setTh] = useState(thresholds);
  const [al, setAl] = useState(alerts);
  useEffect(() => { setTh(thresholds); }, [thresholds]);
  useEffect(() => { setAl(alerts); }, [alerts]);

  const saveTh = () => { setThresholds(th); saveThresholds(); };
  const saveAl = () => { setAlerts({ consecutiveAnomalyPauseCount: al.consecutiveAnomalyPauseCount, notificationChannels: al.notificationChannels, notifiedUsers: al.notifiedUsers }); saveAlerts(); };

  return (
    <div className="space-y-5">
      <Toasts />
      <div><h1 className="text-2xl font-bold text-gray-100">系统管理</h1><p className="text-sm text-gray-500 mt-1">平台参数配置与权限管理</p></div>
      <div className="flex flex-col lg:flex-row gap-5">
        <GlassCard padding="sm" className="lg:w-56 shrink-0">
          <div className="space-y-1">
            {TABS.map(({ k, l, i: I }) => (
              <button key={k} onClick={() => setTab(k)} className={cn('w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm transition-colors text-left', tab === k ? 'bg-magnetic-blue/15 text-magnetic-blue' : 'text-gray-400 hover:text-gray-200 hover:bg-magnetic-blue/5')}>
                <I className="w-4 h-4" />{l}
              </button>
            ))}
          </div>
        </GlassCard>

        <div className="flex-1 space-y-5">
          {tab === 'thresholds' && (
            <GlassCard>
              <div className="flex items-center justify-between mb-5"><div className="flex items-center gap-2"><Sliders className="w-5 h-5 text-magnetic-blue" /><h2 className="text-lg font-semibold text-gray-100">阈值配置</h2></div><motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={saveTh} className="btn-primary flex items-center gap-1.5 text-sm py-2"><Save className="w-4 h-4" />保存</motion.button></div>
              <div className="space-y-4">
                {[
                  { k: 'flipTimeThresholdNs', l: '翻转时间阈值', u: 'ns', d: '当磁畴翻转时间超过该值时触发预警，默认 1.5ns' },
                  { k: 'vortexDetectionThreshold', l: '涡旋态检测阈值', u: '', d: '拓扑电荷变化检测敏感度，值越高越不敏感，默认 0.8' },
                  { k: 'energyAnomalyCoefficient', l: '能量异常系数', u: '', d: '能量波动标准差倍数，超过即标记异常，默认 1.5' },
                ].map(({ k, l, u, d }) => (
                  <div key={k} className="p-4 rounded-xl bg-space-800/40 border border-magnetic-blue/5">
                    <div className="flex items-center justify-between">
                      <div><p className="text-sm font-medium text-gray-200">{l}</p><p className="text-xs text-gray-500 mt-0.5">{d}</p></div>
                      <div className="flex items-center gap-2"><input type="number" step="0.1" value={th[k as keyof typeof th]} onChange={(e) => setTh((p) => ({ ...p, [k]: Number(e.target.value) }))} className="input-field w-28 text-right font-mono text-sm" />{u && <span className="text-xs text-gray-500 w-6">{u}</span>}</div>
                    </div>
                  </div>
                ))}
              </div>
            </GlassCard>
          )}

          {tab === 'alerts' && (
            <GlassCard>
              <div className="flex items-center justify-between mb-5"><div className="flex items-center gap-2"><Bell className="w-5 h-5 text-magnetic-purple" /><h2 className="text-lg font-semibold text-gray-100">告警规则</h2></div><motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={saveAl} className="btn-primary flex items-center gap-1.5 text-sm py-2"><Save className="w-4 h-4" />保存</motion.button></div>
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-space-800/40 border border-magnetic-blue/5"><p className="text-sm font-medium text-gray-200 mb-1">连续异常暂停次数</p><p className="text-xs text-gray-500 mb-3">达到该次数后系统自动暂停任务</p><input type="number" min={1} max={10} value={al.consecutiveAnomalyPauseCount} onChange={(e) => setAl((p) => ({ ...p, consecutiveAnomalyPauseCount: Number(e.target.value) }))} className="input-field w-32 font-mono" /></div>
                <div className="p-4 rounded-xl bg-space-800/40 border border-magnetic-blue/5">
                  <p className="text-sm font-medium text-gray-200 mb-3">通知渠道</p>
                  <div className="flex flex-wrap gap-2">
                    {CHS.map(({ k, l, i: I }) => (
                      <button key={k} onClick={() => setAl((p) => ({ ...p, notificationChannels: { ...p.notificationChannels, [k]: !p.notificationChannels[k] } }))} className={cn('flex items-center gap-2 px-4 py-2 rounded-lg border text-sm transition-colors', al.notificationChannels[k] ? 'bg-magnetic-blue/15 border-magnetic-blue/50 text-magnetic-blue' : 'border-gray-700 text-gray-400 hover:border-gray-600')}>
                        <I className="w-4 h-4" />{l}<div className={cn('w-4 h-4 rounded border flex items-center justify-center ml-1', al.notificationChannels[k] ? 'bg-magnetic-blue border-magnetic-blue' : 'border-gray-600')}>{al.notificationChannels[k] && <Check className="w-3 h-3 text-white" />}</div>
                      </button>
                    ))}
                  </div>
                </div>
                <div className="p-4 rounded-xl bg-space-800/40 border border-magnetic-blue/5">
                  <p className="text-sm font-medium text-gray-200 mb-3">通知人列表</p>
                  <div className="space-y-1.5">
                    {users.filter((u) => u.status === 'active').map((u) => (
                      <label key={u.id} className="flex items-center justify-between p-2.5 rounded-lg hover:bg-magnetic-blue/5 cursor-pointer">
                        <div className="flex items-center gap-2.5"><div className="w-8 h-8 rounded-full bg-magnetic-gradient/20 flex items-center justify-center"><User className="w-4 h-4 text-magnetic-blue" /></div><div><p className="text-sm text-gray-200">{u.username}</p><p className="text-xs text-gray-500">{u.email}</p></div></div>
                        <div className="flex items-center gap-2"><span className={cn('badge text-xs', R_C[u.role])}>{R_L[u.role]}</span><input type="checkbox" checked={al.notifiedUsers.includes(u.id)} onChange={() => setAl((p) => ({ ...p, notifiedUsers: p.notifiedUsers.includes(u.id) ? p.notifiedUsers.filter((x) => x !== u.id) : [...p.notifiedUsers, u.id] }))} className="accent-magnetic-blue w-4 h-4" /></div>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </GlassCard>
          )}

          {tab === 'users' && (
            <GlassCard>
              <div className="flex items-center justify-between mb-5"><div className="flex items-center gap-2"><Shield className="w-5 h-5 text-status-success" /><h2 className="text-lg font-semibold text-gray-100">用户权限</h2></div><motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={saveUsers} className="btn-primary flex items-center gap-1.5 text-sm py-2"><Save className="w-4 h-4" />保存</motion.button></div>
              <div className="overflow-x-auto scrollbar-thin">
                <table className="w-full text-sm">
                  <thead><tr className="border-b border-magnetic-blue/10"><th className="py-3 px-3 text-left text-gray-400 font-medium">用户名</th><th className="py-3 px-3 text-left text-gray-400 font-medium">角色</th><th className="py-3 px-3 text-left text-gray-400 font-medium">状态</th><th className="py-3 px-3 text-right text-gray-400 font-medium">操作</th></tr></thead>
                  <tbody>
                    {users.map((u) => (
                      <tr key={u.id} className="border-b border-magnetic-blue/5 hover:bg-magnetic-blue/5">
                        <td className="py-3 px-3"><div className="flex items-center gap-2.5"><div className="w-8 h-8 rounded-full bg-magnetic-gradient/20 flex items-center justify-center"><User className="w-4 h-4 text-magnetic-blue" /></div><div><p className="text-gray-200 font-medium">{u.username}</p><p className="text-xs text-gray-500">{u.email}</p></div></div></td>
                        <td className="py-3 px-3"><select value={u.role} onChange={(e) => updateUserRole(u.id, e.target.value as UserRole)} className="bg-space-800/80 border border-magnetic-blue/20 rounded-lg px-2.5 py-1.5 text-sm text-gray-200 focus:border-magnetic-blue outline-none">{(Object.keys(R_L) as UserRole[]).map((r) => <option key={r} value={r}>{R_L[r]}</option>)}</select></td>
                        <td className="py-3 px-3"><span className={cn('badge text-xs', u.status === 'active' ? 'badge-success' : 'badge-danger')}>{u.status === 'active' ? '启用' : '禁用'}</span></td>
                        <td className="py-3 px-3"><div className="flex items-center justify-end gap-1.5"><button className="p-2 rounded-lg hover:bg-magnetic-blue/10 text-gray-400 hover:text-magnetic-blue"><Edit3 className="w-4 h-4" /></button><button onClick={() => toggleUserStatus(u.id)} className={cn('p-2 rounded-lg', u.status === 'active' ? 'hover:bg-status-danger/10 text-gray-400 hover:text-status-danger' : 'hover:bg-status-success/10 text-gray-400 hover:text-status-success')}><Power className="w-4 h-4" /></button></div></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </GlassCard>
          )}

          {tab === 'about' && (
            <GlassCard>
              <div className="space-y-6 text-center py-6">
                <div className="w-20 h-20 mx-auto rounded-2xl bg-magnetic-gradient/20 flex items-center justify-center"><Shield className="w-10 h-10 text-magnetic-blue" /></div>
                <div><h2 className="text-2xl font-bold text-gradient-magnetic">微磁学模拟平台</h2><p className="text-sm text-gray-500 mt-1">Micromagnetic Simulation Platform</p></div>
                <div className="grid grid-cols-3 gap-4 max-w-md mx-auto pt-4 border-t border-magnetic-blue/10">
                  {[['版本', 'v1.0.0'], ['构建', '2026.06'], ['引擎', 'µMag 3.0']].map(([k, v]) => (<div key={k}><p className="text-xs text-gray-500">{k}</p><p className="text-sm font-medium text-gray-200 mt-0.5 font-mono">{v}</p></div>))}
                </div>
                <p className="text-xs text-gray-500 max-w-md mx-auto">本平台用于自旋电子学器件的微磁学模拟与优化，支持多材料参数扫描、涡旋态检测及批量任务调度。</p>
              </div>
            </GlassCard>
          )}
        </div>
      </div>
    </div>
  );
}
