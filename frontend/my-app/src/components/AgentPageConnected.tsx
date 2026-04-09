import { useMemo } from "react"
import type { LatestRun } from "../services/agentApi"

interface AgentPageProps {
  agent: string
  history: LatestRun[]
  onReplayHistory?: (runId: string) => void
  onCloneHistory?: (runId: string) => void
  onStatusMessage?: (message: string) => void
  onRefresh?: () => Promise<void>
}

const agentConfig: Record<string, {
  icon: string
  color: string
  title: string
  description: string
  bullets: string[]
}> = {
  "Web Search": {
    icon: "language",
    color: "#be9dff",
    title: "Web Search",
    description: "FLOW handles search automatically when a task needs web or arXiv results.",
    bullets: [
      "No manual setup is required.",
      "The workflow picks search sources from the task itself.",
      "Results are fed directly into the next automation step.",
    ],
  },
  "Python Executor": {
    icon: "terminal",
    color: "#4ade80",
    title: "Python Executor",
    description: "FLOW uses the execution layer internally for formatting, transformation, and workflow glue.",
    bullets: [
      "Users do not need to supply scripts or packages for standard workflows.",
      "The agent chooses when structured processing is needed.",
      "Failures are surfaced in the run details automatically.",
    ],
  },
  "Email Sender": {
    icon: "mail",
    color: "#f59e0b",
    title: "Email Delivery",
    description: "FLOW now sends workflow emails from the platform mailbox instead of requiring each user to configure SMTP or app passwords.",
    bullets: [
      "Add only a recipient inbox in Settings or include an email address in the prompt.",
      "FLOW sends the message from the configured company mailbox.",
      "Delivery errors appear directly in the run summary.",
    ],
  },
  Database: {
    icon: "database",
    color: "#60a5fa",
    title: "Database",
    description: "Database storage is managed behind the scenes for runs, logs, notifications, and saved workflow state.",
    bullets: [
      "No end-user database configuration is needed.",
      "FLOW stores run history automatically.",
      "Advanced data integrations can be added later as product features instead of agent config fields.",
    ],
  },
  History: {
    icon: "history",
    color: "#a78bfa",
    title: "History",
    description: "Browse previous runs, replay them, or clone them into new workflows.",
    bullets: [],
  },
}

const statusColor: Record<string, string> = {
  completed: "#4ade80",
  failed: "#ef4444",
  running: "#be9dff",
}

export default function AgentPageConnected({ agent, history, onReplayHistory, onCloneHistory }: AgentPageProps) {
  const config = agentConfig[agent]

  const historyItems = useMemo(() => history.map(item => ({
    id: item.id,
    name: item.name,
    status: item.status,
    time: item.time,
    duration: item.duration,
  })), [history])

  if (!config) return null

  if (agent === "History") {
    return (
      <div style={{ padding: "2.5rem 2rem", maxWidth: 720 }}>
        <div className="section-eyebrow">Run History</div>
        <h2 style={{ fontFamily: "Manrope,sans-serif", fontSize: "1.5rem", fontWeight: 700, marginBottom: "0.5rem" }}>Past Workflows</h2>
        <p style={{ color: "rgba(238,228,252,0.45)", marginBottom: "2rem", fontSize: "0.875rem" }}>Browse and replay previous executions</p>

        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          {historyItems.map(h => (
            <div key={h.id} className="liquid-glass" style={{ borderRadius: 12, padding: "1rem 1.25rem", display: "flex", alignItems: "center", gap: "1rem" }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: statusColor[h.status] || "#4ade80", flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: "Manrope,sans-serif", fontWeight: 600, fontSize: "0.875rem", color: "#eee4fc" }}>{h.name}</div>
                <div style={{ fontSize: "0.6875rem", color: "rgba(238,228,252,0.35)", marginTop: 2 }}>{h.id} · {h.time} · {h.duration}</div>
              </div>
              <div style={{ display: "flex", gap: "0.5rem" }}>
                <button className="btn-glass" style={{ fontSize: "0.6875rem", padding: "0.25rem 0.75rem", borderRadius: 8 }} onClick={() => onReplayHistory?.(h.id)}>
                  <span className="material-symbols-outlined" style={{ fontSize: 13 }}>replay</span> Replay
                </button>
                <button className="btn-glass" style={{ fontSize: "0.6875rem", padding: "0.25rem 0.75rem", borderRadius: 8 }} onClick={() => onCloneHistory?.(h.id)}>
                  <span className="material-symbols-outlined" style={{ fontSize: 13 }}>content_copy</span> Clone
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div style={{ padding: "2.5rem 2rem", maxWidth: 760 }}>
      <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "2rem" }}>
        <div style={{ width: 48, height: 48, borderRadius: 14, background: `${config.color}18`, border: `1px solid ${config.color}30`, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <span className="material-symbols-outlined" style={{ fontSize: 24, color: config.color }}>{config.icon}</span>
        </div>
        <div>
          <div className="section-eyebrow" style={{ marginBottom: 0 }}>Managed Capability</div>
          <h2 style={{ fontFamily: "Manrope,sans-serif", fontSize: "1.375rem", fontWeight: 700, color: "#eee4fc" }}>{config.title}</h2>
        </div>
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: "0.375rem", padding: "0.25rem 0.875rem", background: "rgba(74,222,128,0.08)", border: "1px solid rgba(74,222,128,0.2)", borderRadius: 999, fontSize: "0.6875rem", fontWeight: 600, color: "#4ade80" }}>
          <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#4ade80" }} /> Managed by FLOW
        </div>
      </div>

      <div className="liquid-glass" style={{ borderRadius: 16, padding: "1.5rem" }}>
        <p style={{ color: "rgba(238,228,252,0.6)", fontSize: "0.96rem", lineHeight: 1.8, marginBottom: "1.25rem" }}>{config.description}</p>
        <div style={{ display: "grid", gap: "0.75rem" }}>
          {config.bullets.map(item => (
            <div key={item} style={{ display: "flex", gap: "0.75rem", alignItems: "flex-start", padding: "0.9rem 1rem", borderRadius: 14, background: "rgba(41,34,58,0.5)", border: "1px solid rgba(190,157,255,0.08)" }}>
              <span className="material-symbols-outlined" style={{ fontSize: 18, color: config.color, marginTop: 1 }}>task_alt</span>
              <div style={{ color: "rgba(238,228,252,0.62)", lineHeight: 1.65, fontSize: "0.88rem" }}>{item}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
