import { useEffect, useState, type ReactNode } from "react"
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

const modelOptions = ["Gemini 2.5 Flash", "Gemini 1.5 Pro", "GPT-4o", "Claude 3.5"]
const concurrencyOptions = ["1", "2", "3", "5", "10"]

const panelShell = "linear-gradient(180deg, rgba(17,12,30,0.98) 0%, rgba(12,9,22,0.98) 100%)"
const cardShell = "linear-gradient(180deg, rgba(30,22,49,0.82) 0%, rgba(19,13,32,0.92) 100%)"
const borderColor = "rgba(190,157,255,0.14)"
const inputStyle = {
  width: "100%",
  padding: "0.85rem 0.95rem",
  borderRadius: 14,
  background: "rgba(14,10,24,0.95)",
  border: "1px solid rgba(190,157,255,0.14)",
  color: "#eee4fc",
  outline: "none",
  boxSizing: "border-box" as const,
  fontSize: "0.92rem",
}
const selectStyle = {
  ...inputStyle,
  appearance: "none" as const,
  WebkitAppearance: "none" as const,
  MozAppearance: "none" as const,
  cursor: "pointer",
}

function ToggleRow({
  label,
  hint,
  checked,
  onChange,
}: {
  label: string
  hint: string
  checked: boolean
  onChange: (checked: boolean) => void
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      style={{
        width: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "1rem",
        padding: "0.95rem 1rem",
        borderRadius: 16,
        border: `1px solid ${checked ? "rgba(190,157,255,0.28)" : "rgba(190,157,255,0.12)"}`,
        background: checked ? "rgba(190,157,255,0.08)" : "rgba(14,10,24,0.78)",
        color: "#eee4fc",
        cursor: "pointer",
        textAlign: "left",
      }}
    >
      <div>
        <div style={{ fontSize: "0.9rem", fontWeight: 600, marginBottom: "0.2rem" }}>{label}</div>
        <div style={{ fontSize: "0.78rem", color: "rgba(238,228,252,0.5)", lineHeight: 1.55 }}>{hint}</div>
      </div>
      <div
        style={{
          width: 46,
          height: 26,
          borderRadius: 999,
          background: checked ? "linear-gradient(135deg, #be9dff, #dbc4ff)" : "rgba(255,255,255,0.12)",
          position: "relative",
          flexShrink: 0,
          transition: "all 0.2s ease",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: 3,
            left: checked ? 23 : 3,
            width: 20,
            height: 20,
            borderRadius: "50%",
            background: checked ? "#3d0088" : "#eee4fc",
            transition: "left 0.2s ease, background 0.2s ease",
          }}
        />
      </div>
    </button>
  )
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div
      style={{
        marginBottom: "1rem",
        padding: "1rem",
        borderRadius: 18,
        background: cardShell,
        border: `1px solid ${borderColor}`,
      }}
    >
      <div style={{ fontSize: "0.72rem", marginBottom: "0.95rem", color: "rgba(238,228,252,0.5)", letterSpacing: "0.12em", textTransform: "uppercase" }}>
        {title}
      </div>
      {children}
    </div>
  )
}

export function SettingsPanelConnected({ onClose, settings, onSave }: SettingsProps) {
  const [form, setForm] = useState(settings)

  useEffect(() => {
    setForm(settings)
  }, [settings])

  const handleSave = () => {
    onSave({
      ...form,
      apiKeys: {
        ...form.apiKeys,
        sendGridApiKey: "",
        smtpHost: "",
        smtpPort: "",
        smtpUser: "",
        smtpPass: "",
        smtpFromAddress: "",
      },
    })
  }

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 200, background: "rgba(7,4,15,0.42)", backdropFilter: "blur(8px)" }} onClick={onClose}>
      <div style={{ position: "absolute", right: 0, top: 0, bottom: 0, width: 430, background: panelShell, borderLeft: "1px solid rgba(190,157,255,0.12)", padding: "1.25rem", overflowY: "auto", boxShadow: "-24px 0 60px rgba(0,0,0,0.35)" }} onClick={e => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "1rem", padding: "1rem", borderRadius: 22, background: "radial-gradient(circle at top left, rgba(190,157,255,0.18), rgba(190,157,255,0) 45%), linear-gradient(135deg, rgba(32,24,52,0.96), rgba(14,10,24,0.98))", border: `1px solid ${borderColor}` }}>
          <div>
            <div style={{ fontSize: "0.75rem", color: "rgba(238,228,252,0.56)" }}>Preferences</div>
            <h3 style={{ color: "#eee4fc", margin: "0.2rem 0 0" }}>Settings</h3>
          </div>
          <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: 999, border: `1px solid ${borderColor}`, background: "rgba(14,10,24,0.92)", color: "#eee4fc", cursor: "pointer" }}>x</button>
        </div>

        <Section title="General">
          <div style={{ display: "grid", gap: "0.85rem" }}>
            <div>
              <div style={{ fontSize: "0.8rem", color: "rgba(238,228,252,0.58)", marginBottom: "0.45rem" }}>Default model</div>
              <select style={selectStyle} value={form.general.defaultModel} onChange={e => setForm({ ...form, general: { ...form.general, defaultModel: e.target.value } })}>
                {modelOptions.map(option => <option key={option} value={option}>{option}</option>)}
              </select>
            </div>
            <div>
              <div style={{ fontSize: "0.8rem", color: "rgba(238,228,252,0.58)", marginBottom: "0.45rem" }}>Timezone</div>
              <input style={inputStyle} value={form.general.timezone} onChange={e => setForm({ ...form, general: { ...form.general, timezone: e.target.value } })} />
            </div>
            <div>
              <div style={{ fontSize: "0.8rem", color: "rgba(238,228,252,0.58)", marginBottom: "0.45rem" }}>Max concurrent workflows</div>
              <select style={selectStyle} value={form.general.maxConcurrentWorkflows} onChange={e => setForm({ ...form, general: { ...form.general, maxConcurrentWorkflows: e.target.value } })}>
                {concurrencyOptions.map(option => <option key={option} value={option}>{option}</option>)}
              </select>
            </div>
          </div>
        </Section>

        <Section title="Delivery Inbox">
          <div style={{ display: "grid", gap: "0.85rem" }}>
            <div style={{ padding: "0.95rem 1rem", borderRadius: 16, border: "1px solid rgba(74,222,128,0.16)", background: "rgba(74,222,128,0.08)" }}>
              <div style={{ fontSize: "0.76rem", color: "#86efac", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: "0.35rem" }}>Flow-managed delivery</div>
              <div style={{ fontSize: "0.84rem", color: "rgba(238,228,252,0.78)", lineHeight: 1.6 }}>
                FLOW sends automated emails from the platform mailbox. Users only choose where results should arrive.
              </div>
            </div>
            <div>
              <div style={{ fontSize: "0.8rem", color: "rgba(238,228,252,0.58)", marginBottom: "0.45rem" }}>Recipient inbox</div>
              <input
                style={inputStyle}
                placeholder="Where should workflow results and alerts go?"
                value={form.notifications.notificationEmail}
                onChange={e => setForm({ ...form, notifications: { ...form.notifications, notificationEmail: e.target.value } })}
              />
            </div>
            <ToggleRow
              label="Email on workflow complete"
              hint="Send a completion email when an automation finishes successfully."
              checked={form.notifications.emailOnWorkflowComplete}
              onChange={checked => setForm({ ...form, notifications: { ...form.notifications, emailOnWorkflowComplete: checked } })}
            />
            <ToggleRow
              label="Email on failure"
              hint="Send a failure alert to this inbox if FLOW cannot finish a run."
              checked={form.notifications.emailOnFailure}
              onChange={checked => setForm({ ...form, notifications: { ...form.notifications, emailOnFailure: checked } })}
            />
          </div>
        </Section>

        <Section title="Optional Overrides">
          <div style={{ display: "grid", gap: "0.85rem" }}>
            <div>
              <div style={{ fontSize: "0.8rem", color: "rgba(238,228,252,0.58)", marginBottom: "0.45rem" }}>Gemini API key</div>
              <input type="password" style={inputStyle} placeholder="Optional: use your own Gemini quota" value={form.apiKeys.geminiApiKey} onChange={e => setForm({ ...form, apiKeys: { ...form.apiKeys, geminiApiKey: e.target.value } })} />
              <div style={{ fontSize: "0.78rem", color: "rgba(238,228,252,0.45)", marginTop: "0.5rem", lineHeight: 1.55 }}>
                Leave this blank to use FLOW&apos;s default experience.
              </div>
            </div>
            <div>
              <div style={{ fontSize: "0.8rem", color: "rgba(238,228,252,0.58)", marginBottom: "0.45rem" }}>Slack webhook URL</div>
              <input style={inputStyle} placeholder="Optional: post workflow alerts to Slack" value={form.apiKeys.slackWebhookUrl} onChange={e => setForm({ ...form, apiKeys: { ...form.apiKeys, slackWebhookUrl: e.target.value } })} />
            </div>
          </div>
        </Section>

        <button style={{ width: "100%", padding: "0.95rem 1rem", borderRadius: 14, border: "none", background: "linear-gradient(135deg, #be9dff, #dbc4ff)", color: "#3d0088", fontWeight: 800, cursor: "pointer", boxShadow: "0 16px 36px rgba(122,78,201,0.28)" }} onClick={handleSave}>
          Save Settings
        </button>
      </div>
    </div>
  )
}

export function NotificationsPanelConnected({ onClose, notifications }: NotificationsProps) {
  const unreadCount = notifications.filter(item => !item.isRead).length
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 220, background: "rgba(7,4,15,0.32)", backdropFilter: "blur(8px)" }} onClick={onClose}>
      <div
        style={{
          position: "absolute",
          right: 0,
          top: 0,
          bottom: 0,
          width: 390,
          background: panelShell,
          padding: "1.25rem",
          borderLeft: "1px solid rgba(190,157,255,0.12)",
          boxShadow: "-24px 0 60px rgba(0,0,0,0.35)",
          overflowY: "auto",
        }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "1rem", padding: "1rem", borderRadius: 22, background: "radial-gradient(circle at top left, rgba(190,157,255,0.18), rgba(190,157,255,0) 45%), linear-gradient(135deg, rgba(32,24,52,0.96), rgba(14,10,24,0.98))", border: `1px solid ${borderColor}` }}>
          <div>
            <div style={{ fontSize: "0.75rem", color: "rgba(238,228,252,0.56)" }}>Inbox</div>
            <h3 style={{ color: "#eee4fc", margin: "0.2rem 0 0" }}>Notifications</h3>
            <div style={{ fontSize: "0.82rem", color: "rgba(238,228,252,0.48)", marginTop: "0.3rem" }}>
              {unreadCount > 0 ? `${unreadCount} unread update${unreadCount === 1 ? "" : "s"}` : "All caught up"}
            </div>
          </div>
          <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: 999, border: `1px solid ${borderColor}`, background: "rgba(14,10,24,0.92)", color: "#eee4fc", cursor: "pointer" }}>x</button>
        </div>

        <div style={{ display: "grid", gap: "0.85rem" }}>
          {notifications.length > 0 ? notifications.map(n => (
            <div
              key={n.id}
              style={{
                padding: "1rem",
                borderRadius: 18,
                background: n.isRead ? cardShell : "linear-gradient(180deg, rgba(44,31,70,0.88) 0%, rgba(20,14,34,0.96) 100%)",
                border: `1px solid ${n.isRead ? borderColor : "rgba(190,157,255,0.24)"}`,
              }}
            >
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "0.75rem", marginBottom: "0.5rem" }}>
                <strong style={{ color: "#eee4fc", fontSize: "0.93rem", lineHeight: 1.4 }}>{n.title}</strong>
                {!n.isRead && <span style={{ flexShrink: 0, marginTop: "0.15rem", width: 8, height: 8, borderRadius: "50%", background: "#be9dff", boxShadow: "0 0 14px rgba(190,157,255,0.55)" }} />}
              </div>
              <p style={{ margin: 0, fontSize: "0.84rem", color: "rgba(238,228,252,0.58)", lineHeight: 1.65 }}>{n.desc}</p>
              <div style={{ marginTop: "0.8rem", fontSize: "0.72rem", color: "rgba(238,228,252,0.36)", letterSpacing: "0.06em", textTransform: "uppercase" }}>{n.time}</div>
            </div>
          )) : (
            <div style={{ padding: "1rem", borderRadius: 18, background: cardShell, border: `1px solid ${borderColor}`, color: "rgba(238,228,252,0.52)", lineHeight: 1.65 }}>
              No notifications yet. Workflow activity, delivery alerts, and failure updates will appear here.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
