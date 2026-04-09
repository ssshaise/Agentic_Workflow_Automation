import { useEffect, useState, type ReactNode } from "react"
import {
  getSettings,
  getViewer,
  requestEmailVerification,
  saveSettings,
  type SettingsPayload,
  type ViewerPayload,
} from "../services/agentApi"

interface PanelProps {
  onClose: () => void
}

const shellColor = "#0f1724"
const panelColor = "linear-gradient(180deg, rgba(16,25,38,0.98) 0%, rgba(10,16,27,0.98) 100%)"
const cardColor = "linear-gradient(180deg, rgba(29,43,60,0.9) 0%, rgba(15,22,34,0.96) 100%)"
const borderColor = "rgba(123, 162, 255, 0.18)"
const inputBg = "rgba(9, 14, 24, 0.88)"
const labelColor = "#d8e4ff"
const muted = "rgba(202, 217, 246, 0.66)"
const accent = "#7ba2ff"
const accentSoft = "rgba(123, 162, 255, 0.16)"
const success = "#63d2a1"
const warning = "#f2b766"

const timezones = ["UTC", "IST (UTC+5:30)", "EST (UTC-5)"]
const models = ["Gemini 2.5 Flash", "GPT-4o", "Claude 3.5", "Gemini 1.5 Pro"]

const notifications = [
  { title: "Workflow completed", desc: "Task finished", time: "2 min ago" },
  { title: "Running workflow", desc: "Processing...", time: "5 min ago" },
  { title: "Workflow failed", desc: "Error occurred", time: "1 hour ago" },
]

const fieldStyle = {
  width: "100%",
  borderRadius: 12,
  border: `1px solid ${borderColor}`,
  background: inputBg,
  color: "#f5f8ff",
  padding: "0.8rem 0.9rem",
  outline: "none",
  fontSize: "0.9rem",
  boxSizing: "border-box" as const,
}

function Toggle({
  checked,
  onChange,
}: {
  checked: boolean
  onChange: (value: boolean) => void
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      style={{
        width: 46,
        height: 26,
        borderRadius: 999,
        border: `1px solid ${checked ? "rgba(99,210,161,0.35)" : borderColor}`,
        background: checked ? "linear-gradient(135deg, rgba(99,210,161,0.75), rgba(123,162,255,0.75))" : "rgba(24,34,48,0.9)",
        position: "relative",
        cursor: "pointer",
      }}
    >
      <span
        style={{
          position: "absolute",
          top: 2,
          left: checked ? 22 : 2,
          width: 20,
          height: 20,
          borderRadius: "50%",
          background: "#f7fbff",
          boxShadow: "0 4px 12px rgba(0,0,0,0.28)",
          transition: "left 0.18s ease",
        }}
      />
    </button>
  )
}

function Section({
  title,
  eyebrow,
  children,
}: {
  title: string
  eyebrow: string
  children: ReactNode
}) {
  return (
    <section
      style={{
        marginBottom: "1rem",
        padding: "1rem",
        borderRadius: 18,
        background: cardColor,
        border: `1px solid ${borderColor}`,
        boxShadow: "0 20px 40px rgba(0,0,0,0.24)",
      }}
    >
      <div style={{ fontSize: "0.7rem", letterSpacing: "0.12em", textTransform: "uppercase", color: muted, marginBottom: "0.4rem" }}>
        {eyebrow}
      </div>
      <div style={{ fontSize: "1rem", color: "#f4f8ff", fontWeight: 700, marginBottom: "0.9rem" }}>{title}</div>
      {children}
    </section>
  )
}

export function SettingsPanel({ onClose }: PanelProps) {
  const [settings, setSettings] = useState<SettingsPayload | null>(null)
  const [viewer, setViewer] = useState<ViewerPayload | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [status, setStatus] = useState("")
  const [verifyStatus, setVerifyStatus] = useState("")

  useEffect(() => {
    let active = true
    Promise.all([getSettings(), getViewer()])
      .then(([settingsData, viewerData]) => {
        if (!active) return
        setSettings(settingsData)
        setViewer(viewerData)
      })
      .catch((error) => {
        if (!active) return
        setStatus(error instanceof Error ? error.message : "Failed to load settings.")
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [])

  const updateGeneral = (key: string, value: string) => {
    if (!settings) return
    setSettings({ ...settings, general: { ...settings.general, [key]: value } })
  }

  const updateNotifications = (key: string, value: string | boolean) => {
    if (!settings) return
    setSettings({ ...settings, notifications: { ...settings.notifications, [key]: value } })
  }

  const updateApiKeys = (key: string, value: string) => {
    if (!settings) return
    setSettings({ ...settings, apiKeys: { ...settings.apiKeys, [key]: value } })
  }

  const handleSave = async () => {
    if (!settings) return
    setSaving(true)
    setStatus("")
    try {
      const updated = await saveSettings(settings)
      setSettings(updated)
      setStatus("Settings saved.")
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Unable to save settings.")
    } finally {
      setSaving(false)
    }
  }

  const handleVerify = async () => {
    setVerifyStatus("")
    try {
      const response = await requestEmailVerification()
      setVerifyStatus(response.message || "Verification email requested.")
    } catch (error) {
      setVerifyStatus(error instanceof Error ? error.message : "Unable to request verification.")
    }
  }

  const verificationLabel = viewer?.user.emailVerified ? "Verified" : "Verification pending"
  const verificationColor = viewer?.user.emailVerified ? success : warning

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 200, background: "rgba(3,7,13,0.46)", backdropFilter: "blur(10px)" }} onClick={onClose}>
      <div
        style={{
          position: "absolute",
          right: 0,
          top: 0,
          bottom: 0,
          width: 430,
          background: panelColor,
          borderLeft: `1px solid ${borderColor}`,
          padding: "1.25rem",
          overflowY: "auto",
          boxShadow: "-24px 0 60px rgba(0,0,0,0.35)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            marginBottom: "1rem",
            padding: "1rem",
            borderRadius: 22,
            background: "radial-gradient(circle at top left, rgba(123,162,255,0.28), rgba(123,162,255,0) 45%), linear-gradient(135deg, rgba(32,49,70,0.96), rgba(10,15,24,0.98))",
            border: `1px solid ${borderColor}`,
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <div style={{ fontSize: "0.72rem", letterSpacing: "0.12em", textTransform: "uppercase", color: muted, marginBottom: "0.3rem" }}>Preferences</div>
              <h3 style={{ color: "#f4f8ff", margin: 0, fontSize: "1.4rem" }}>Settings</h3>
              <p style={{ color: muted, margin: "0.55rem 0 0", lineHeight: 1.5, fontSize: "0.92rem" }}>
                Configure runtime behavior, delivery channels, and account security without mixing website login credentials with mailbox credentials.
              </p>
            </div>
            <button
              onClick={onClose}
              style={{
                width: 34,
                height: 34,
                borderRadius: 999,
                border: `1px solid ${borderColor}`,
                background: "rgba(12,18,29,0.82)",
                color: "#f4f8ff",
                cursor: "pointer",
              }}
            >
              x
            </button>
          </div>
        </div>

        {loading || !settings || !viewer ? (
          <div style={{ color: muted, padding: "1rem 0" }}>Loading settings...</div>
        ) : (
          <>
            <Section title="Account And Verification" eyebrow="Identity">
              <div style={{ display: "grid", gap: "0.85rem" }}>
                <div style={{ padding: "0.95rem", borderRadius: 14, background: shellColor, border: `1px solid ${borderColor}` }}>
                  <div style={{ color: muted, fontSize: "0.76rem", marginBottom: "0.35rem" }}>Signed-in account</div>
                  <div style={{ color: "#f5f8ff", fontSize: "0.96rem", fontWeight: 600 }}>{viewer.user.email}</div>
                  <div style={{ marginTop: "0.55rem", display: "inline-flex", alignItems: "center", gap: 8, color: verificationColor, fontSize: "0.82rem" }}>
                    <span style={{ width: 8, height: 8, borderRadius: "50%", background: verificationColor }} />
                    {verificationLabel}
                  </div>
                </div>
                <div style={{ padding: "0.95rem", borderRadius: 14, background: "rgba(10,16,27,0.85)", border: `1px solid ${borderColor}`, color: muted, lineHeight: 1.55, fontSize: "0.86rem" }}>
                  Your Flow account password is only for signing in to this website.
                  <br />
                  An email app password is different: it comes from your mailbox provider, such as Gmail, and is used only when Flow sends mail through that mailbox over SMTP.
                </div>
                {!viewer.user.emailVerified && (
                  <div>
                    <button
                      type="button"
                      onClick={handleVerify}
                      style={{
                        border: "none",
                        borderRadius: 12,
                        background: `linear-gradient(135deg, ${accent}, #9cc0ff)`,
                        color: "#08111f",
                        padding: "0.8rem 1rem",
                        fontWeight: 700,
                        cursor: "pointer",
                      }}
                    >
                      Send Verification Email
                    </button>
                    {verifyStatus && <div style={{ color: muted, marginTop: "0.65rem", fontSize: "0.84rem" }}>{verifyStatus}</div>}
                  </div>
                )}
              </div>
            </Section>

            <Section title="General Runtime" eyebrow="Core">
              <div style={{ display: "grid", gap: "0.9rem" }}>
                <div>
                  <label style={{ display: "block", marginBottom: "0.45rem", color: labelColor }}>Default model</label>
                  <select value={settings.general.defaultModel} onChange={(e) => updateGeneral("defaultModel", e.target.value)} style={fieldStyle}>
                    {models.map((model) => (
                      <option key={model} value={model}>{model}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ display: "block", marginBottom: "0.45rem", color: labelColor }}>Timezone</label>
                  <select value={settings.general.timezone} onChange={(e) => updateGeneral("timezone", e.target.value)} style={fieldStyle}>
                    {timezones.map((zone) => (
                      <option key={zone} value={zone}>{zone}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ display: "block", marginBottom: "0.45rem", color: labelColor }}>Max concurrent workflows</label>
                  <input value={settings.general.maxConcurrentWorkflows} onChange={(e) => updateGeneral("maxConcurrentWorkflows", e.target.value)} style={fieldStyle} />
                </div>
              </div>
            </Section>

            <Section title="Notifications" eyebrow="Delivery">
              <div style={{ display: "grid", gap: "0.95rem" }}>
                {[
                  ["Email on workflow complete", settings.notifications.emailOnWorkflowComplete, "emailOnWorkflowComplete"],
                  ["Email on failure", settings.notifications.emailOnFailure, "emailOnFailure"],
                  ["Slack webhook alerts", settings.notifications.slackWebhookAlerts, "slackWebhookAlerts"],
                ].map(([label, value, key]) => (
                  <div key={String(key)} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.9rem", borderRadius: 14, background: shellColor, border: `1px solid ${borderColor}` }}>
                    <div>
                      <div style={{ color: "#eff5ff", fontWeight: 600 }}>{label}</div>
                      <div style={{ color: muted, fontSize: "0.82rem", marginTop: 4 }}>Toggles delivery behavior for automation outcomes.</div>
                    </div>
                    <Toggle checked={Boolean(value)} onChange={(next) => updateNotifications(String(key), next)} />
                  </div>
                ))}
                <div>
                  <label style={{ display: "block", marginBottom: "0.45rem", color: labelColor }}>Notification email</label>
                  <input value={String(settings.notifications.notificationEmail || "")} onChange={(e) => updateNotifications("notificationEmail", e.target.value)} placeholder="you@company.com" style={fieldStyle} />
                </div>
              </div>
            </Section>

            <Section title="SMTP And API Credentials" eyebrow="Secrets">
              <div style={{ display: "grid", gap: "0.85rem" }}>
                <div style={{ padding: "0.95rem", borderRadius: 14, background: "rgba(123,162,255,0.09)", border: `1px solid ${borderColor}`, color: muted, fontSize: "0.85rem", lineHeight: 1.55 }}>
                  For Gmail or Google Workspace, the password here should usually be a 16-character Google App Password generated after enabling 2-Step Verification.
                  It is not the password a visitor uses to log into your Flow account.
                </div>
                <div>
                  <label style={{ display: "block", marginBottom: "0.45rem", color: labelColor }}>Gemini API key</label>
                  <input type="password" value={settings.apiKeys.geminiApiKey} onChange={(e) => updateApiKeys("geminiApiKey", e.target.value)} placeholder="AIza..." style={fieldStyle} />
                </div>
                <div>
                  <label style={{ display: "block", marginBottom: "0.45rem", color: labelColor }}>Slack webhook URL</label>
                  <input value={settings.apiKeys.slackWebhookUrl} onChange={(e) => updateApiKeys("slackWebhookUrl", e.target.value)} placeholder="https://hooks.slack.com/..." style={fieldStyle} />
                </div>
                <div>
                  <label style={{ display: "block", marginBottom: "0.45rem", color: labelColor }}>SendGrid API key</label>
                  <input type="password" value={settings.apiKeys.sendGridApiKey} onChange={(e) => updateApiKeys("sendGridApiKey", e.target.value)} placeholder="SG...." style={fieldStyle} />
                </div>
                <div>
                  <label style={{ display: "block", marginBottom: "0.45rem", color: labelColor }}>SMTP host</label>
                  <input value={settings.apiKeys.smtpHost} onChange={(e) => updateApiKeys("smtpHost", e.target.value)} placeholder="smtp.gmail.com" style={fieldStyle} />
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                  <div>
                    <label style={{ display: "block", marginBottom: "0.45rem", color: labelColor }}>SMTP port</label>
                    <input value={settings.apiKeys.smtpPort} onChange={(e) => updateApiKeys("smtpPort", e.target.value)} placeholder="587" style={fieldStyle} />
                  </div>
                  <div>
                    <label style={{ display: "block", marginBottom: "0.45rem", color: labelColor }}>From address</label>
                    <input value={settings.apiKeys.smtpFromAddress} onChange={(e) => updateApiKeys("smtpFromAddress", e.target.value)} placeholder="you@yourdomain.com" style={fieldStyle} />
                  </div>
                </div>
                <div>
                  <label style={{ display: "block", marginBottom: "0.45rem", color: labelColor }}>SMTP username</label>
                  <input value={settings.apiKeys.smtpUser} onChange={(e) => updateApiKeys("smtpUser", e.target.value)} placeholder="your mailbox login" style={fieldStyle} />
                </div>
                <div>
                  <label style={{ display: "block", marginBottom: "0.45rem", color: labelColor }}>App password</label>
                  <input type="password" value={settings.apiKeys.smtpPass} onChange={(e) => updateApiKeys("smtpPass", e.target.value)} placeholder="provider-generated app password" style={fieldStyle} />
                </div>
              </div>
            </Section>

            {status && <div style={{ color: muted, fontSize: "0.84rem", margin: "0.25rem 0 0.9rem" }}>{status}</div>}

            <button
              type="button"
              disabled={saving}
              onClick={handleSave}
              style={{
                width: "100%",
                padding: "0.95rem 1rem",
                borderRadius: 14,
                border: "none",
                background: saving ? accentSoft : `linear-gradient(135deg, ${accent}, #b6cbff)`,
                color: saving ? "#cfe0ff" : "#08111f",
                fontWeight: 800,
                cursor: saving ? "default" : "pointer",
                boxShadow: "0 16px 36px rgba(39,97,214,0.28)",
              }}
            >
              {saving ? "Saving..." : "Save Settings"}
            </button>
          </>
        )}
      </div>
    </div>
  )
}

export function NotificationsPanel({ onClose }: PanelProps) {
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 190, background: "rgba(3,7,13,0.38)" }} onClick={onClose}>
      <div
        style={{
          position: "absolute",
          right: 0,
          width: 360,
          height: "100%",
          background: panelColor,
          borderLeft: `1px solid ${borderColor}`,
          padding: "1rem",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3 style={{ marginTop: 0, color: "#f5f8ff" }}>Notifications</h3>
        {notifications.map((n, i) => (
          <div key={i} style={{ marginBottom: "0.9rem", padding: "0.9rem", borderRadius: 14, background: shellColor, border: `1px solid ${borderColor}` }}>
            <strong style={{ color: "#eff5ff" }}>{n.title}</strong>
            <p style={{ color: muted, margin: "0.35rem 0" }}>{n.desc}</p>
            <small style={{ color: "rgba(202, 217, 246, 0.5)" }}>{n.time}</small>
          </div>
        ))}
        <button onClick={onClose} style={{ ...fieldStyle, cursor: "pointer" }}>Close</button>
      </div>
    </div>
  )
}
