import { useState } from "react"

interface PanelProps {
  onClose: () => void
}

// ✅ Proper typing
type PanelItem =
  | { label: string; type: "select"; options: string[] }
  | { label: string; type: "toggle"; value: boolean }
  | { label: string; type: "input" | "password"; placeholder: string }

type PanelSection = {
  title: string
  items: PanelItem[]
}

const sections: PanelSection[] = [
  {
    title: "General",
    items: [
      { label: "Default Model", type: "select", options: ["GPT-4o", "Claude 3.5", "Gemini 1.5 Pro"] },
      { label: "Timezone", type: "select", options: ["UTC", "IST (UTC+5:30)", "EST (UTC-5)"] },
      { label: "Max Concurrent Workflows", type: "input", placeholder: "3" },
    ],
  },
  {
    title: "Notifications",
    items: [
      { label: "Email on workflow complete", type: "toggle", value: true },
      { label: "Email on failure", type: "toggle", value: true },
      { label: "Slack webhook alerts", type: "toggle", value: false },
      { label: "Notification email", type: "input", placeholder: "you@company.com" },
    ],
  },
  {
    title: "API Keys",
    items: [
      { label: "OpenAI API Key", type: "password", placeholder: "sk-..." },
      { label: "Slack Webhook URL", type: "input", placeholder: "https://hooks.slack.com/..." },
      { label: "SendGrid API Key", type: "password", placeholder: "SG...." },
    ],
  },
]

export function SettingsPanel({ onClose }: PanelProps) {
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 200 }} onClick={onClose}>
      <div
        style={{
          position: "absolute",
          right: 0,
          top: 0,
          bottom: 0,
          width: 380,
          background: "#0e0b1a",
          borderLeft: "1px solid rgba(190,157,255,0.12)",
          padding: "1.5rem",
          overflowY: "auto",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "2rem" }}>
          <div>
            <div style={{ fontSize: "0.75rem", color: "#aaa" }}>Preferences</div>
            <h3 style={{ color: "#eee4fc" }}>Settings</h3>
          </div>
          <button onClick={onClose}>✕</button>
        </div>

        {/* Sections */}
        {sections.map((section) => (
          <div key={section.title} style={{ marginBottom: "2rem" }}>
            <div style={{ fontSize: "0.75rem", marginBottom: "1rem", color: "#aaa" }}>
              {section.title}
            </div>

            {section.items.map((item, i) => (
              <div key={i} style={{ marginBottom: "1rem" }}>
                <label style={{ display: "block", marginBottom: "0.3rem" }}>
                  {item.label}
                </label>

                {/* TOGGLE */}
                {item.type === "toggle" && (
                  <div
                    style={{
                      width: 36,
                      height: 20,
                      borderRadius: 999,
                      background: item.value ? "#be9dff" : "#333",
                      position: "relative",
                    }}
                  >
                    <div
                      style={{
                        position: "absolute",
                        top: 2,
                        left: item.value ? 18 : 2,
                        width: 14,
                        height: 14,
                        borderRadius: "50%",
                        background: "#fff",
                      }}
                    />
                  </div>
                )}

                {/* SELECT */}
                {item.type === "select" && (
                  <select style={{ padding: "0.4rem", width: "100%" }}>
                    {item.options.map((o) => (
                      <option key={o}>{o}</option>
                    ))}
                  </select>
                )}

                {/* INPUT / PASSWORD */}
                {(item.type === "input" || item.type === "password") && (
                  <input
                    type={item.type}
                    placeholder={item.placeholder}
                    style={{ padding: "0.4rem", width: "100%" }}
                  />
                )}
              </div>
            ))}
          </div>
        ))}

        <button style={{ width: "100%", padding: "0.5rem" }}>
          Save Settings
        </button>
      </div>
    </div>
  )
}

// ---------------- NOTIFICATIONS ----------------

const notifications = [
  { title: "Workflow completed", desc: "Task finished", time: "2 min ago" },
  { title: "Running workflow", desc: "Processing...", time: "5 min ago" },
  { title: "Workflow failed", desc: "Error occurred", time: "1 hour ago" },
]

export function NotificationsPanel({ onClose }: PanelProps) {
  return (
    <div style={{ position: "fixed", inset: 0 }} onClick={onClose}>
      <div
        style={{
          position: "absolute",
          right: 0,
          width: 360,
          height: "100%",
          background: "#0e0b1a",
          padding: "1rem",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3>Notifications</h3>

        {notifications.map((n, i) => (
          <div key={i} style={{ marginBottom: "1rem" }}>
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