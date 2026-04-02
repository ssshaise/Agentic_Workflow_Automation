import { useEffect, useMemo, useState } from "react"
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

type EmailProvider = "gmail" | "outlook" | "yahoo" | "custom"

const providerPresets: Record<Exclude<EmailProvider, "custom">, { label: string; host: string; port: string; help: string }> = {
  gmail: { label: "Gmail", host: "smtp.gmail.com", port: "587", help: "Use your Gmail address and a Google app password." },
  outlook: { label: "Outlook", host: "smtp.office365.com", port: "587", help: "Works for Outlook, Hotmail, and many Microsoft 365 accounts." },
  yahoo: { label: "Yahoo", host: "smtp.mail.yahoo.com", port: "587", help: "Use a Yahoo app password for sending." },
}

function isPresetProvider(provider: EmailProvider): provider is Exclude<EmailProvider, "custom"> {
  return provider !== "custom"
}

function inferProvider(settings: DashboardSettings): EmailProvider {
  const host = settings.apiKeys.smtpHost?.toLowerCase() || ""
  const email = settings.notifications.notificationEmail?.toLowerCase() || settings.apiKeys.smtpUser?.toLowerCase() || ""
  if (host.includes("gmail") || email.endsWith("@gmail.com")) return "gmail"
  if (host.includes("office365") || host.includes("outlook") || email.endsWith("@outlook.com") || email.endsWith("@hotmail.com") || email.endsWith("@live.com")) return "outlook"
  if (host.includes("yahoo") || email.endsWith("@yahoo.com")) return "yahoo"
  return "custom"
}

function applyProviderPreset(settings: DashboardSettings, provider: EmailProvider): DashboardSettings {
  if (!isPresetProvider(provider)) {
    return settings
  }
  const preset = providerPresets[provider]
  const senderEmail = settings.notifications.notificationEmail || settings.apiKeys.smtpUser || settings.apiKeys.smtpFromAddress
  return {
    ...settings,
    apiKeys: {
      ...settings.apiKeys,
      smtpHost: preset.host,
      smtpPort: preset.port,
      smtpUser: senderEmail,
      smtpFromAddress: senderEmail,
    },
  }
}

export function SettingsPanelConnected({ onClose, settings, onSave }: SettingsProps) {
  const [form, setForm] = useState(settings)
  const [provider, setProvider] = useState<EmailProvider>(() => inferProvider(settings))
  const [showAdvancedEmail, setShowAdvancedEmail] = useState(false)

  useEffect(() => {
    setForm(settings)
    setProvider(inferProvider(settings))
  }, [settings])

  const selectedPreset = isPresetProvider(provider) ? providerPresets[provider] : null
  const senderEmail = form.notifications.notificationEmail || form.apiKeys.smtpUser || ""
  const senderReady = Boolean(form.apiKeys.smtpUser && form.apiKeys.smtpPass)
  const emailStatus = useMemo(() => {
    if (senderReady) {
      return `Ready to send from ${form.apiKeys.smtpFromAddress || form.apiKeys.smtpUser}`
    }
    return "Add an email and app password to enable delivery"
  }, [form.apiKeys.smtpFromAddress, form.apiKeys.smtpPass, form.apiKeys.smtpUser, senderReady])

  const updateNotificationEmail = (email: string) => {
    setForm(current => {
      const next = {
        ...current,
        notifications: { ...current.notifications, notificationEmail: email },
        apiKeys: {
          ...current.apiKeys,
          smtpUser: current.apiKeys.smtpUser || email,
          smtpFromAddress: current.apiKeys.smtpFromAddress || email,
        },
      }
      return provider === "custom" ? next : applyProviderPreset(next, provider)
    })
  }

  const chooseProvider = (nextProvider: EmailProvider) => {
    setProvider(nextProvider)
    setForm(current => applyProviderPreset(current, nextProvider))
  }

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
          <input style={{ padding: "0.4rem", width: "100%", marginBottom: "1rem" }} placeholder="Where should workflow updates go?" value={form.notifications.notificationEmail} onChange={e => updateNotificationEmail(e.target.value)} />
        </div>

        <div style={{ marginBottom: "2rem" }}>
          <div style={{ fontSize: "0.75rem", marginBottom: "1rem", color: "#aaa" }}>API Keys</div>
          <input type="password" style={{ padding: "0.4rem", width: "100%", marginBottom: "1rem" }} value={form.apiKeys.geminiApiKey} onChange={e => setForm({ ...form, apiKeys: { ...form.apiKeys, geminiApiKey: e.target.value } })} />
          <input style={{ padding: "0.4rem", width: "100%", marginBottom: "1rem" }} value={form.apiKeys.slackWebhookUrl} onChange={e => setForm({ ...form, apiKeys: { ...form.apiKeys, slackWebhookUrl: e.target.value } })} />
          <input type="password" style={{ padding: "0.4rem", width: "100%", marginBottom: "1rem" }} value={form.apiKeys.sendGridApiKey} onChange={e => setForm({ ...form, apiKeys: { ...form.apiKeys, sendGridApiKey: e.target.value } })} />
        </div>

        <div style={{ marginBottom: "2rem", padding: "1rem", borderRadius: 14, background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.18)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "0.75rem", marginBottom: "0.5rem" }}>
            <div style={{ fontSize: "0.75rem", color: "#fcd34d", letterSpacing: "0.08em", textTransform: "uppercase" }}>Email Delivery</div>
            <div style={{ fontSize: "0.72rem", color: senderReady ? "#86efac" : "rgba(255,255,255,0.65)" }}>{emailStatus}</div>
          </div>
          <div style={{ fontSize: "0.84rem", color: "rgba(255,255,255,0.78)", lineHeight: 1.6, marginBottom: "1rem" }}>
            Pick your email provider, enter the inbox you want to send from, and paste the app password. We will fill the SMTP details for you.
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: "0.625rem", marginBottom: "1rem" }}>
            {(["gmail", "outlook", "yahoo", "custom"] as EmailProvider[]).map(option => (
              (() => {
                const optionMeta = isPresetProvider(option)
                  ? providerPresets[option]
                  : { label: "Custom SMTP", help: "Show advanced fields and enter your own mail server details." }
                return (
                  <button
                    key={option}
                    type="button"
                    onClick={() => chooseProvider(option)}
                    style={{
                      padding: "0.75rem",
                      borderRadius: 12,
                      textAlign: "left",
                      border: provider === option ? "1px solid rgba(245,158,11,0.55)" : "1px solid rgba(255,255,255,0.12)",
                      background: provider === option ? "rgba(245,158,11,0.14)" : "rgba(255,255,255,0.04)",
                      color: "#fff8eb",
                      cursor: "pointer",
                    }}
                  >
                    <div style={{ fontWeight: 600, marginBottom: "0.2rem" }}>{optionMeta.label}</div>
                    <div style={{ fontSize: "0.72rem", color: "rgba(255,248,235,0.68)", lineHeight: 1.45 }}>
                      {optionMeta.help}
                    </div>
                  </button>
                )
              })()
            ))}
          </div>

          <input
            style={{ padding: "0.55rem", width: "100%", marginBottom: "0.85rem" }}
            placeholder="Sender email address"
            value={senderEmail}
            onChange={e => updateNotificationEmail(e.target.value)}
          />
          <input
            type="password"
            style={{ padding: "0.55rem", width: "100%", marginBottom: "0.85rem" }}
            placeholder={provider === "custom" ? "SMTP password" : "App password"}
            value={form.apiKeys.smtpPass}
            onChange={e => setForm({ ...form, apiKeys: { ...form.apiKeys, smtpPass: e.target.value } })}
          />

          {selectedPreset && (
            <div style={{ fontSize: "0.76rem", color: "rgba(255,248,235,0.68)", marginBottom: "0.85rem", lineHeight: 1.55 }}>
              {selectedPreset.help} Server details are filled automatically: `{selectedPreset.host}:{selectedPreset.port}`.
            </div>
          )}

          <button
            type="button"
            onClick={() => setShowAdvancedEmail(current => !current)}
            style={{ background: "none", border: "none", padding: 0, color: "#fcd34d", cursor: "pointer", fontSize: "0.8rem", marginBottom: showAdvancedEmail ? "0.85rem" : 0 }}
          >
            {showAdvancedEmail ? "Hide advanced email setup" : "Show advanced email setup"}
          </button>

          {(showAdvancedEmail || provider === "custom") && (
            <div style={{ marginTop: "0.85rem" }}>
              <input style={{ padding: "0.55rem", width: "100%", marginBottom: "0.75rem" }} placeholder="SMTP Host" value={form.apiKeys.smtpHost} onChange={e => setForm({ ...form, apiKeys: { ...form.apiKeys, smtpHost: e.target.value } })} />
              <input style={{ padding: "0.55rem", width: "100%", marginBottom: "0.75rem" }} placeholder="SMTP Port" value={form.apiKeys.smtpPort} onChange={e => setForm({ ...form, apiKeys: { ...form.apiKeys, smtpPort: e.target.value } })} />
              <input style={{ padding: "0.55rem", width: "100%", marginBottom: "0.75rem" }} placeholder="SMTP Username" value={form.apiKeys.smtpUser} onChange={e => setForm({ ...form, apiKeys: { ...form.apiKeys, smtpUser: e.target.value } })} />
              <input style={{ padding: "0.55rem", width: "100%" }} placeholder="From Address (optional)" value={form.apiKeys.smtpFromAddress} onChange={e => setForm({ ...form, apiKeys: { ...form.apiKeys, smtpFromAddress: e.target.value } })} />
            </div>
          )}
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
