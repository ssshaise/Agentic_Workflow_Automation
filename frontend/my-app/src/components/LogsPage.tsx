const logs = [
  { time: "09:41:02", level: "info", agent: "System", message: "Initializing workflow WKF-8821-X" },
  { time: "09:41:05", level: "info", agent: "Planner", message: 'Analyzing request: "Monitor arxiv papers → summarize → send email"' },
  { time: "09:41:06", level: "info", agent: "Planner", message: "Strategy selected: Sequential scrape with LLM validation" },
  { time: "09:41:10", level: "info", agent: "Executor", message: "Accessing https://arxiv.org/list/cs.AI/recent" },
  { time: "09:41:12", level: "success", agent: "Executor", message: "Found 12 new entries. Processing paper #1..." },
  { time: "09:41:15", level: "info", agent: "Executor", message: "Summarizing: 'Efficient Transformers for Edge Computing'" },
  { time: "09:41:18", level: "warning", agent: "Executor", message: "Rate limit approaching on arXiv API — adding 200ms stagger" },
  { time: "09:41:22", level: "info", agent: "Validator", message: "Quality check passed for paper #1" },
  { time: "09:41:25", level: "info", agent: "Executor", message: "Processing paper #2: 'Neural Architecture Search at Scale'" },
  { time: "09:41:30", level: "error", agent: "Executor", message: "Timeout on paper #3 — retrying (attempt 1/3)" },
  { time: "09:41:33", level: "success", agent: "Executor", message: "Retry succeeded for paper #3" },
  { time: "09:41:40", level: "info", agent: "Email Sender", message: "Composing digest email for 5 processed papers" },
  { time: "09:41:42", level: "success", agent: "Email Sender", message: "Email sent to team@company.com" },
]

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

export default function LogsPage() {
  return (
    <div style={{ padding: "2.5rem 2rem", maxWidth: 860 }}>
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: "2rem" }}>
        <div>
          <div className="section-eyebrow">Diagnostics</div>
          <h2 style={{ fontFamily: "Manrope,sans-serif", fontSize: "1.5rem", fontWeight: 700, color: "#eee4fc" }}>Logs</h2>
          <p style={{ color: "rgba(238,228,252,0.4)", fontSize: "0.875rem", marginTop: 4 }}>Real-time execution logs for WKF-8821-X</p>
        </div>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <button className="btn-glass" style={{ borderRadius: 10, fontSize: "0.75rem" }}>
            <span className="material-symbols-outlined" style={{ fontSize: 14 }}>download</span> Export
          </button>
          <button className="btn-glass" style={{ borderRadius: 10, fontSize: "0.75rem" }}>
            <span className="material-symbols-outlined" style={{ fontSize: 14 }}>delete_sweep</span> Clear
          </button>
        </div>
      </div>

      {/* Filter chips */}
      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.5rem", flexWrap: "wrap" }}>
        {["All", "Info", "Success", "Warning", "Error"].map((f, i) => (
          <button key={f} style={{
            padding: "0.25rem 0.875rem", borderRadius: 999,
            background: i === 0 ? "rgba(190,157,255,0.15)" : "rgba(41,34,58,0.5)",
            border: `1px solid ${i === 0 ? "rgba(190,157,255,0.3)" : "rgba(190,157,255,0.1)"}`,
            color: i === 0 ? "#be9dff" : "rgba(238,228,252,0.4)",
            fontSize: "0.6875rem", fontWeight: 600, cursor: "pointer",
            fontFamily: "Manrope,sans-serif",
          }}>{f}</button>
        ))}
      </div>

      {/* Log entries */}
      <div style={{ background: "rgba(8,6,14,0.5)", borderRadius: 14, border: "1px solid rgba(190,157,255,0.08)", overflow: "hidden" }}>
        {logs.map((log, i) => {
          const ls = levelStyle[log.level]
          return (
            <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: "1rem", padding: "0.625rem 1.25rem", borderBottom: i < logs.length - 1 ? "1px solid rgba(190,157,255,0.04)" : "none", background: i % 2 === 0 ? "transparent" : "rgba(255,255,255,0.01)" }}>
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
