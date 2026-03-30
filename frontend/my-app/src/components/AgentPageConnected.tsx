import { useEffect, useMemo, useState } from "react"
import { getAgentConfig, saveAgentConfig, testAgentConfig, type LatestRun } from "../services/agentApi"

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
  description: string
  fields: { label: string; placeholder: string; type?: string }[]
}> = {
  "Web Search": {
    icon: "language",
    color: "#be9dff",
    description: "Configure the web search agent to browse, scrape, and extract information from any website.",
    fields: [
      { label: "Target URL or Query", placeholder: "https://arxiv.org/list/cs.AI/recent" },
      { label: "Search Depth", placeholder: "2 (number of pages to follow)" },
      { label: "Extract Fields", placeholder: "title, abstract, authors, date" },
      { label: "Filter Keywords", placeholder: "transformer, LLM, agent (comma-separated)" },
    ],
  },
  "Python Executor": {
    icon: "terminal",
    color: "#4ade80",
    description: "Run Python scripts, process data, call APIs, and execute custom logic within your workflow.",
    fields: [
      { label: "Script Name", placeholder: "data_processor.py" },
      { label: "Python Version", placeholder: "3.11" },
      { label: "Required Packages", placeholder: "pandas, requests, openai" },
      { label: "Environment Variables", placeholder: "API_KEY=xxx, DB_URL=xxx" },
    ],
  },
  "Email Sender": {
    icon: "mail",
    color: "#f59e0b",
    description: "Send automated emails with AI-generated content, summaries, or alerts.",
    fields: [
      { label: "From Address", placeholder: "agent@yourdomain.com" },
      { label: "To Address(es)", placeholder: "team@company.com, manager@company.com" },
      { label: "Subject Template", placeholder: "Daily Digest: {date} - {summary_title}" },
      { label: "Send Condition", placeholder: "Always / On error / On new results" },
    ],
  },
  Database: {
    icon: "database",
    color: "#60a5fa",
    description: "Read from or write to databases as part of your automated workflow pipeline.",
    fields: [
      { label: "Connection String", placeholder: "postgresql://user:pass@host:5432/db", type: "password" },
      { label: "Query / Operation", placeholder: "SELECT * FROM papers WHERE date > NOW() - INTERVAL '1 day'" },
      { label: "Write Table", placeholder: "workflow_results" },
      { label: "Primary Key Field", placeholder: "id" },
    ],
  },
  History: {
    icon: "history",
    color: "#a78bfa",
    description: "Browse past workflow runs, view logs, and replay or clone previous executions.",
    fields: [],
  },
}

const statusColor: Record<string, string> = {
  completed: "#4ade80",
  failed: "#ef4444",
  running: "#be9dff",
}

export default function AgentPageConnected({ agent, history, onReplayHistory, onCloneHistory, onStatusMessage, onRefresh }: AgentPageProps) {
  const config = agentConfig[agent]
  const [values, setValues] = useState<Record<string, string>>({})

  useEffect(() => {
    if (agent === "History") return
    getAgentConfig(agent)
      .then(response => setValues(response.values || {}))
      .catch(() => onStatusMessage?.("Failed to load agent config."))
  }, [agent, onStatusMessage])

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

  const save = async () => {
    await saveAgentConfig(agent, values)
    onStatusMessage?.(`${agent} config saved.`)
    await onRefresh?.()
  }

  const test = async () => {
    const response = await testAgentConfig(agent)
    onStatusMessage?.(response.message)
    await onRefresh?.()
  }

  return (
    <div style={{ padding: "2.5rem 2rem", maxWidth: 720 }}>
      <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "2rem" }}>
        <div style={{ width: 48, height: 48, borderRadius: 14, background: `${config.color}18`, border: `1px solid ${config.color}30`, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <span className="material-symbols-outlined" style={{ fontSize: 24, color: config.color }}>{config.icon}</span>
        </div>
        <div>
          <div className="section-eyebrow" style={{ marginBottom: 0 }}>Agent Configuration</div>
          <h2 style={{ fontFamily: "Manrope,sans-serif", fontSize: "1.375rem", fontWeight: 700, color: "#eee4fc" }}>{agent}</h2>
        </div>
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: "0.375rem", padding: "0.25rem 0.875rem", background: "rgba(74,222,128,0.08)", border: "1px solid rgba(74,222,128,0.2)", borderRadius: 999, fontSize: "0.6875rem", fontWeight: 600, color: "#4ade80" }}>
          <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#4ade80", animation: "pulse 2s infinite" }} /> Ready
        </div>
      </div>

      <p style={{ color: "rgba(238,228,252,0.5)", fontSize: "0.875rem", lineHeight: 1.7, marginBottom: "2rem" }}>{config.description}</p>

      <div className="liquid-glass" style={{ borderRadius: 16, padding: "1.5rem", marginBottom: "1.25rem" }}>
        <div style={{ fontFamily: "Manrope,sans-serif", fontWeight: 600, fontSize: "0.8125rem", marginBottom: "1.25rem", color: "#eee4fc" }}>Configuration</div>
        <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          {config.fields.map(f => (
            <div key={f.label}>
              <label style={{ display: "block", fontSize: "0.6875rem", fontWeight: 600, color: "rgba(238,228,252,0.4)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "0.5rem" }}>
                {f.label}
              </label>
              <input
                type={f.type || "text"}
                value={values[f.label] ?? ""}
                placeholder={f.placeholder}
                style={{
                  width: "100%", background: "rgba(41,34,58,0.5)",
                  border: "1px solid rgba(190,157,255,0.12)",
                  borderRadius: 10, padding: "0.625rem 0.875rem",
                  color: "#eee4fc", fontFamily: "Inter,sans-serif",
                  fontSize: "0.875rem", outline: "none",
                  transition: "border-color 0.2s",
                }}
                onChange={e => setValues(current => ({ ...current, [f.label]: e.target.value }))}
                onFocus={e => e.target.style.borderColor = "rgba(190,157,255,0.4)"}
                onBlur={e => e.target.style.borderColor = "rgba(190,157,255,0.12)"}
              />
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: "flex", gap: "0.75rem" }}>
        <button className="btn-primary" style={{ borderRadius: 10 }} onClick={save}>
          <span className="material-symbols-outlined" style={{ fontSize: 15 }}>save</span> Save Config
        </button>
        <button className="btn-glass" style={{ borderRadius: 10 }} onClick={test}>
          <span className="material-symbols-outlined" style={{ fontSize: 15 }}>play_arrow</span> Test Agent
        </button>
      </div>
    </div>
  )
}
