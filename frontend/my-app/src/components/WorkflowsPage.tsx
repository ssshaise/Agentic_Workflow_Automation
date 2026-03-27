const workflows = [
  { id: "WKF-8821-X", name: "arXiv Monitor → Summarize → Email", status: "running", agents: ["Web Search", "Python Executor", "Email Sender"], lastRun: "Running now", schedule: "Daily 8am" },
  { id: "WKF-8820-A", name: "Shopify Inventory Sync", status: "active", agents: ["Python Executor", "Database"], lastRun: "5 hours ago", schedule: "Every hour" },
  { id: "WKF-8819-B", name: "Market Sentiment Monitor", status: "paused", agents: ["Web Search", "Python Executor"], lastRun: "Yesterday", schedule: "Every 6 hours" },
  { id: "WKF-8818-C", name: "Smart Meeting Scheduler", status: "active", agents: ["Email Sender"], lastRun: "2 hours ago", schedule: "On trigger" },
]

const statusStyle: Record<string, { bg: string; border: string; color: string; label: string }> = {
  running: { bg: "rgba(190,157,255,0.1)", border: "rgba(190,157,255,0.25)", color: "#be9dff", label: "Running" },
  active: { bg: "rgba(74,222,128,0.08)", border: "rgba(74,222,128,0.2)", color: "#4ade80", label: "Active" },
  paused: { bg: "rgba(245,158,11,0.08)", border: "rgba(245,158,11,0.2)", color: "#f59e0b", label: "Paused" },
  failed: { bg: "rgba(239,68,68,0.08)", border: "rgba(239,68,68,0.2)", color: "#ef4444", label: "Failed" },
}

export default function WorkflowsPage() {
  return (
    <div style={{ padding: "2.5rem 2rem", maxWidth: 860 }}>
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: "2rem" }}>
        <div>
          <div className="section-eyebrow">Automation</div>
          <h2 style={{ fontFamily: "Manrope,sans-serif", fontSize: "1.5rem", fontWeight: 700, color: "#eee4fc" }}>Workflows</h2>
          <p style={{ color: "rgba(238,228,252,0.4)", fontSize: "0.875rem", marginTop: 4 }}>Manage and monitor all your automated pipelines</p>
        </div>
        <button className="btn-primary" style={{ borderRadius: 10 }}>
          <span className="material-symbols-outlined" style={{ fontSize: 15 }}>add</span> New Workflow
        </button>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "1rem", marginBottom: "2rem" }}>
        {[
          { label: "Total", value: "12", icon: "account_tree" },
          { label: "Active", value: "8", icon: "play_circle", color: "#4ade80" },
          { label: "Running", value: "1", icon: "sync", color: "#be9dff" },
          { label: "Failed", value: "1", icon: "error", color: "#ef4444" },
        ].map(s => (
          <div key={s.label} className="liquid-glass" style={{ borderRadius: 12, padding: "1rem 1.25rem" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.5rem" }}>
              <span style={{ fontSize: "0.6875rem", color: "rgba(238,228,252,0.4)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em" }}>{s.label}</span>
              <span className="material-symbols-outlined" style={{ fontSize: 16, color: s.color || "rgba(238,228,252,0.3)" }}>{s.icon}</span>
            </div>
            <div style={{ fontFamily: "Manrope,sans-serif", fontSize: "1.75rem", fontWeight: 700, color: s.color || "#eee4fc" }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Workflow list */}
      <div style={{ display: "flex", flexDirection: "column", gap: "0.875rem" }}>
        {workflows.map(w => {
          const st = statusStyle[w.status]
          return (
            <div key={w.id} className="liquid-glass feature-card" style={{ borderRadius: 14, padding: "1.25rem 1.5rem" }}>
              <div style={{ display: "flex", alignItems: "flex-start", gap: "1rem" }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.5rem" }}>
                    <span style={{ fontFamily: "Manrope,sans-serif", fontWeight: 600, fontSize: "0.9375rem", color: "#eee4fc" }}>{w.name}</span>
                    <div style={{ display: "inline-flex", alignItems: "center", gap: "0.25rem", padding: "0.15rem 0.625rem", background: st.bg, border: `1px solid ${st.border}`, borderRadius: 999, fontSize: "0.625rem", fontWeight: 600, color: st.color }}>
                      <div style={{ width: 4, height: 4, borderRadius: "50%", background: st.color, animation: w.status === "running" ? "pulse 2s infinite" : "none" }} />
                      {st.label}
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginBottom: "0.75rem" }}>
                    {w.agents.map(a => (
                      <span key={a} style={{ padding: "0.125rem 0.625rem", background: "rgba(190,157,255,0.08)", border: "1px solid rgba(190,157,255,0.12)", borderRadius: 6, fontSize: "0.625rem", color: "rgba(238,228,252,0.5)", fontWeight: 500 }}>{a}</span>
                    ))}
                  </div>
                  <div style={{ fontSize: "0.6875rem", color: "rgba(238,228,252,0.3)" }}>
                    <span>Last run: {w.lastRun}</span>
                    <span style={{ margin: "0 0.5rem" }}>·</span>
                    <span>Schedule: {w.schedule}</span>
                    <span style={{ margin: "0 0.5rem" }}>·</span>
                    <span style={{ fontFamily: "monospace" }}>{w.id}</span>
                  </div>
                </div>
                <div style={{ display: "flex", gap: "0.5rem", flexShrink: 0 }}>
                  <button className="btn-glass" style={{ fontSize: "0.6875rem", padding: "0.3rem 0.75rem", borderRadius: 8 }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 13 }}>edit</span>
                  </button>
                  <button className="btn-glass" style={{ fontSize: "0.6875rem", padding: "0.3rem 0.75rem", borderRadius: 8 }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 13 }}>{w.status === "paused" ? "play_arrow" : "pause"}</span>
                  </button>
                  <button className="btn-glass" style={{ fontSize: "0.6875rem", padding: "0.3rem 0.75rem", borderRadius: 8 }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 13 }}>replay</span>
                  </button>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
