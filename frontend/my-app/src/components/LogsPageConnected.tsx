import { useMemo, useState } from "react"
import type { LogItem } from "../services/agentApi"

interface Props {
  logs: LogItem[]
  onExport?: () => void
  onClear?: () => void
}

const levelStyle: Record<string, { color: string; bg: string }> = {
  info: { color: "rgba(238,228,252,0.4)", bg: "rgba(238,228,252,0.06)" },
  success: { color: "#4ade80", bg: "rgba(74,222,128,0.08)" },
  warning: { color: "#f59e0b", bg: "rgba(245,158,11,0.08)" },
  error: { color: "#ef4444", bg: "rgba(239,68,68,0.08)" },
}

const agentColor: Record<string, string> = {
  System: "rgba(238,228,252,0.35)",
  Planner: "#a78bfa",
  Executor: "#be9dff",
  Validator: "#60a5fa",
  "Email Sender": "#f59e0b",
}

export default function LogsPageConnected({ logs, onExport, onClear }: Props) {
  const [activeFilter, setActiveFilter] = useState("All")
  const filteredLogs = useMemo(() => {
    if (activeFilter === "All") return logs
    return logs.filter(log => log.level.toLowerCase() === activeFilter.toLowerCase())
  }, [activeFilter, logs])

  return (
    <div style={{ padding: "2.5rem 2rem", maxWidth: 860 }}>
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: "2rem" }}>
        <div>
          <div className="section-eyebrow">Diagnostics</div>
          <h2 style={{ fontFamily: "Manrope,sans-serif", fontSize: "1.5rem", fontWeight: 700, color: "#eee4fc" }}>Logs</h2>
          <p style={{ color: "rgba(238,228,252,0.4)", fontSize: "0.875rem", marginTop: 4 }}>Real-time execution logs</p>
        </div>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <button className="btn-glass" style={{ borderRadius: 10, fontSize: "0.75rem" }} onClick={onExport}>
            <span className="material-symbols-outlined" style={{ fontSize: 14 }}>download</span> Export
          </button>
          <button className="btn-glass" style={{ borderRadius: 10, fontSize: "0.75rem" }} onClick={onClear}>
            <span className="material-symbols-outlined" style={{ fontSize: 14 }}>delete_sweep</span> Clear
          </button>
        </div>
      </div>

      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.5rem", flexWrap: "wrap" }}>
        {["All", "Info", "Success", "Warning", "Error"].map(f => (
          <button key={f} onClick={() => setActiveFilter(f)} style={{
            padding: "0.25rem 0.875rem", borderRadius: 999,
            background: activeFilter === f ? "rgba(190,157,255,0.15)" : "rgba(41,34,58,0.5)",
            border: `1px solid ${activeFilter === f ? "rgba(190,157,255,0.3)" : "rgba(190,157,255,0.1)"}`,
            color: activeFilter === f ? "#be9dff" : "rgba(238,228,252,0.4)",
            fontSize: "0.6875rem", fontWeight: 600, cursor: "pointer",
            fontFamily: "Manrope,sans-serif",
          }}>{f}</button>
        ))}
      </div>

      <div style={{ background: "rgba(8,6,14,0.5)", borderRadius: 14, border: "1px solid rgba(190,157,255,0.08)", overflow: "hidden" }}>
        {filteredLogs.map((log, i) => {
          const ls = levelStyle[log.level] || levelStyle.info
          return (
            <div key={log.id} style={{ display: "flex", alignItems: "flex-start", gap: "1rem", padding: "0.625rem 1.25rem", borderBottom: i < filteredLogs.length - 1 ? "1px solid rgba(190,157,255,0.04)" : "none", background: i % 2 === 0 ? "transparent" : "rgba(255,255,255,0.01)" }}>
              <span style={{ fontFamily: "monospace", fontSize: "0.6875rem", color: "rgba(238,228,252,0.25)", flexShrink: 0, paddingTop: 1 }}>{log.time}</span>
              <div style={{ width: 56, flexShrink: 0 }}>
                <span style={{ padding: "0.1rem 0.5rem", borderRadius: 4, fontSize: "0.5625rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", background: ls.bg, color: ls.color }}>
                  {log.level}
                </span>
              </div>
              <span style={{ fontFamily: "monospace", fontSize: "0.6875rem", color: agentColor[log.agent] || "rgba(238,228,252,0.4)", flexShrink: 0, width: 80 }}>
                [{log.agent}]
              </span>
              <span style={{ fontFamily: "monospace", fontSize: "0.6875rem", color: "rgba(238,228,252,0.55)", lineHeight: 1.6 }}>
                {log.message}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
