import { useState } from "react"
import type { DashboardSettings, NotificationItem } from "../services/agentApi"

interface SettingsProps {
  onClose: () => void
  settings: DashboardSettings
  onSave: (settings: DashboardSettings) => void
}

interface NotificationsProps {
  onClose: () => void
  notifications: NotificationItem[]
}

export function SettingsPanelConnected({ onClose, settings, onSave }: SettingsProps) {
  const [form, setForm] = useState(settings)

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 200 }} onClick={onClose}>
      <div style={{ position: "absolute", right: 0, top: 0, bottom: 0, width: 380, background: "#0e0b1a", borderLeft: "1px solid rgba(190,157,255,0.12)", padding: "1.5rem", overflowY: "auto" }} onClick={e => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "2rem" }}>
          <div>
            <div style={{ fontSize: "0.75rem", color: "#aaa" }}>Preferences</div>
            <h3 style={{ color: "#eee4fc" }}>Settings</h3>
          </div>
          <button onClick={onClose}>x</button>
        </div>

        <div style={{ marginBottom: "2rem" }}>
          <div style={{ fontSize: "0.75rem", marginBottom: "1rem", color: "#aaa" }}>General</div>
          <input style={{ padding: "0.4rem", width: "100%", marginBottom: "1rem" }} value={form.general.defaultModel} onChange={e => setForm({ ...form, general: { ...form.general, defaultModel: e.target.value } })} />
          <input style={{ padding: "0.4rem", width: "100%", marginBottom: "1rem" }} value={form.general.timezone} onChange={e => setForm({ ...form, general: { ...form.general, timezone: e.target.value } })} />
          <input style={{ padding: "0.4rem", width: "100%" }} value={form.general.maxConcurrentWorkflows} onChange={e => setForm({ ...form, general: { ...form.general, maxConcurrentWorkflows: e.target.value } })} />
        </div>

        <div style={{ marginBottom: "2rem" }}>
          <div style={{ fontSize: "0.75rem", marginBottom: "1rem", color: "#aaa" }}>Notifications</div>
          <input style={{ padding: "0.4rem", width: "100%", marginBottom: "1rem" }} value={form.notifications.notificationEmail} onChange={e => setForm({ ...form, notifications: { ...form.notifications, notificationEmail: e.target.value } })} />
        </div>

        <div style={{ marginBottom: "2rem" }}>
          <div style={{ fontSize: "0.75rem", marginBottom: "1rem", color: "#aaa" }}>API Keys</div>
          <input type="password" style={{ padding: "0.4rem", width: "100%", marginBottom: "1rem" }} value={form.apiKeys.geminiApiKey} onChange={e => setForm({ ...form, apiKeys: { ...form.apiKeys, geminiApiKey: e.target.value } })} />
          <input style={{ padding: "0.4rem", width: "100%", marginBottom: "1rem" }} value={form.apiKeys.slackWebhookUrl} onChange={e => setForm({ ...form, apiKeys: { ...form.apiKeys, slackWebhookUrl: e.target.value } })} />
          <input type="password" style={{ padding: "0.4rem", width: "100%" }} value={form.apiKeys.sendGridApiKey} onChange={e => setForm({ ...form, apiKeys: { ...form.apiKeys, sendGridApiKey: e.target.value } })} />
        </div>

        <button style={{ width: "100%", padding: "0.5rem" }} onClick={() => onSave(form)}>
          Save Settings
        </button>
      </div>
    </div>
  )
}

export function NotificationsPanelConnected({ onClose, notifications }: NotificationsProps) {
  return (
    <div style={{ position: "fixed", inset: 0 }} onClick={onClose}>
      <div style={{ position: "absolute", right: 0, width: 360, height: "100%", background: "#0e0b1a", padding: "1rem" }} onClick={e => e.stopPropagation()}>
        <h3>Notifications</h3>
        {notifications.map(n => (
          <div key={n.id} style={{ marginBottom: "1rem" }}>
            <strong>{n.title}</strong>
            <p>{n.desc}</p>
            <small>{n.time}</small>
          </div>
        ))}
        <button onClick={onClose}>Close</button>
      </div>
    </div>
  )
}
